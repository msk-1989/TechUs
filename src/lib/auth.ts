import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Fallback secret — ONLY used if NEXTAUTH_SECRET env var is missing.
// This allows the app to boot without crashing, but sessions will be
// invalidated on every redeploy. ALWAYS set NEXTAUTH_SECRET in production.
const FALLBACK_SECRET =
  process.env.NEXTAUTH_SECRET ??
  "techus-dev-fallback-secret-do-not-use-in-production-please-set-NEXTAUTH_SECRET-env-var";

if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "production") {
  console.error(
    "⚠️  NEXTAUTH_SECRET is NOT set! Using fallback secret — sessions will break on every redeploy."
  );
}

if (!process.env.DATABASE_URL) {
  console.error("⚠️  DATABASE_URL is NOT set! The app cannot connect to PostgreSQL.");
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
  secret: FALLBACK_SECRET,
  // Allow the deployed Vercel URL without needing to set NEXTAUTH_URL explicitly
  // NextAuth v4 will auto-detect the URL from headers in production
};
