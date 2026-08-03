import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getNextauthSecret, getNextauthUrl, getEnvStatus } from "@/lib/env-config";

const AUTH_SECRET = getNextauthSecret();
const AUTH_URL = getNextauthUrl();

// Set env vars for NextAuth to pick up (in case they're missing on Vercel)
if (!process.env.NEXTAUTH_SECRET) process.env.NEXTAUTH_SECRET = AUTH_SECRET;
if (!process.env.NEXTAUTH_URL) process.env.NEXTAUTH_URL = AUTH_URL;

if (process.env.NODE_ENV === "production") {
  const status = getEnvStatus();
  if (status.using_fallback_database) {
    console.warn("⚠️  Using FALLBACK DATABASE_URL (hardcoded in env-config.ts). Set DATABASE_URL on Vercel and remove the fallback.");
  }
  if (status.using_fallback_secret) {
    console.warn("⚠️  Using FALLBACK NEXTAUTH_SECRET (hardcoded in env-config.ts). Set NEXTAUTH_SECRET on Vercel and remove the fallback.");
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;
          const user = await db.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
            include: { tester: true },
          });
          if (!user || !user.passwordHash || !user.active) return null;
          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;
          return {
            id: user.id,
            name: user.name ?? user.email,
            email: user.email,
            role: user.role,
            testerId: user.tester?.id ?? null,
          } as any;
        } catch (e) {
          console.error("Auth error:", e);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.testerId = (user as any).testerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).testerId = token.testerId;
      }
      return session;
    },
  },
  secret: AUTH_SECRET,
};
