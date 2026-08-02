import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Debug endpoint — TEMPORARY. Remove after troubleshooting is complete.
// This endpoint exposes env var status (NOT values) so we can diagnose
// what's missing on Vercel without access to server logs.

export async function GET() {
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasNextauthSecret = !!process.env.NEXTAUTH_SECRET;
  const hasNextauthUrl = !!process.env.NEXTAUTH_URL;
  const databaseUrlProtocol = process.env.DATABASE_URL?.split("://")[0] ?? "missing";
  const databaseUrlHost = process.env.DATABASE_URL?.split("@")[1]?.split("/")[0]?.replace(":pooler", "") ?? "missing";

  let dbConnection: string = "not_tested";
  let dbError: string | null = null;
  try {
    await db.$queryRaw`SELECT 1`;
    dbConnection = "ok";
  } catch (e: any) {
    dbConnection = "failed";
    dbError = e.message?.slice(0, 200) ?? "unknown";
  }

  let userCount: number | null = null;
  try {
    const result = await db.user.count();
    userCount = result;
  } catch (e: any) {
    dbError = e.message?.slice(0, 200);
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV ?? "unset",
      DATABASE_URL_set: hasDatabaseUrl,
      DATABASE_URL_protocol: databaseUrlProtocol,
      DATABASE_URL_host: databaseUrlHost,
      NEXTAUTH_SECRET_set: hasNextauthSecret,
      NEXTAUTH_URL_set: hasNextauthUrl,
      NEXTAUTH_URL_value: process.env.NEXTAUTH_URL ?? "missing",
    },
    database: {
      connection: dbConnection,
      error: dbError,
      userCount,
    },
    nextauth: {
      secret_length: process.env.NEXTAUTH_SECRET?.length ?? 0,
      url_set: hasNextauthUrl,
    },
    diagnosis: !hasDatabaseUrl
      ? "❌ DATABASE_URL is not set. Add it to Vercel env vars."
      : !hasNextauthSecret
      ? "❌ NEXTAUTH_SECRET is not set. Generate one with `openssl rand -base64 32` and add to Vercel."
      : !hasNextauthUrl
      ? "⚠️ NEXTAUTH_URL is not set. Set it to your Vercel URL (e.g. https://tech-us-seven.vercel.app)."
      : dbConnection === "failed"
      ? "❌ Database connection failed. Check DATABASE_URL value and Neon dashboard for IP restrictions."
      : userCount === 0
      ? "❌ Database connected but no users found. Run the seed script: `bun run scripts/seed.ts` with your DATABASE_URL set locally."
      : "✅ All env vars set and DB connected. Issue may be elsewhere — check Vercel function logs.",
    fix_steps: [
      "1. Go to https://vercel.com/your-project/settings/environment-variables",
      "2. Add DATABASE_URL (Neon Postgres connection string with ?sslmode=require)",
      "3. Add NEXTAUTH_SECRET (generate with: openssl rand -base64 32)",
      "4. Add NEXTAUTH_URL = https://tech-us-seven.vercel.app",
      "5. Redeploy: Vercel dashboard → Deployments → Redeploy",
      "6. After deploy, run seed locally: DATABASE_URL='<your_url>' bun run scripts/seed.ts",
    ],
  }, { status: 200 });
}
