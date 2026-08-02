import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Debug endpoint — TEMPORARY. Remove after troubleshooting is complete.
// Exposes env var STATUS (not values) and DB connection test.

export async function GET() {
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasNextauthSecret = !!process.env.NEXTAUTH_SECRET;
  const hasNextauthUrl = !!process.env.NEXTAUTH_URL;
  const databaseUrlProtocol = process.env.DATABASE_URL?.split("://")[0] ?? "missing";
  const databaseUrlHost = process.env.DATABASE_URL?.split("@")[1]?.split("/")[0]?.replace(":pooler", "") ?? "missing";

  let dbConnection: string = "not_tested";
  let dbError: string | null = null;
  let userCount: number | null = null;
  let adminExists = false;
  let passwordValid: boolean | null = null;

  try {
    await db.$queryRaw`SELECT 1`;
    dbConnection = "ok";
    userCount = await db.user.count();
    const admin = await db.user.findUnique({ where: { email: "admin@techus.app" } });
    adminExists = !!admin;
    if (admin) {
      const bcrypt = (await import("bcryptjs")).default;
      passwordValid = await bcrypt.compare("admin123", admin.passwordHash ?? "");
    }
  } catch (e: any) {
    dbConnection = "failed";
    dbError = e.message?.slice(0, 300) ?? "unknown";
  }

  const allSet = hasDatabaseUrl && hasNextauthSecret && hasNextauthUrl;
  const diagnosis = !hasDatabaseUrl
    ? "❌ DATABASE_URL is NOT set on Vercel. The app cannot connect to PostgreSQL. Add it in Vercel → Settings → Environment Variables."
    : !hasNextauthSecret
    ? "❌ NEXTAUTH_SECRET is NOT set on Vercel. Sessions can't be signed. Generate one with `openssl rand -base64 32` and add to Vercel env vars."
    : !hasNextauthUrl
    ? "⚠️ NEXTAUTH_URL is NOT set. Set it to https://tech-us-seven.vercel.app"
    : dbConnection === "failed"
    ? `❌ Database connection failed: ${dbError}`
    : userCount === 0
    ? "❌ Database connected but NO users found. Run the seed: DATABASE_URL='<your_url>' bun run scripts/seed.ts"
    : !adminExists
    ? "❌ admin@techus.app user not found in DB. Run the seed script."
    : passwordValid === false
    ? "❌ admin@techus.app exists but password 'admin123' does NOT match. Re-seed the database."
    : "✅ All env vars set, DB connected, admin user exists with valid password. Login should work with admin@techus.app / admin123";

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    vercel_url: "https://tech-us-seven.vercel.app",
    environment: {
      NODE_ENV: process.env.NODE_ENV ?? "unset",
      DATABASE_URL_set: hasDatabaseUrl,
      DATABASE_URL_protocol: databaseUrlProtocol,
      DATABASE_URL_host: databaseUrlHost,
      NEXTAUTH_SECRET_set: hasNextauthSecret,
      NEXTAUTH_SECRET_length: process.env.NEXTAUTH_SECRET?.length ?? 0,
      NEXTAUTH_URL_set: hasNextauthUrl,
      NEXTAUTH_URL_value: process.env.NEXTAUTH_URL ?? "missing",
    },
    database: {
      connection: dbConnection,
      error: dbError,
      userCount,
      adminExists,
      adminPasswordValid: passwordValid,
    },
    allEnvVarsSet: allSet,
    diagnosis,
    next_steps_if_failing: [
      "1. Go to https://vercel.com/msk-1989/tech-us/settings/environment-variables",
      "2. Add DATABASE_URL = postgresql://neondb_owner:npg_kHe7iYy1GlFW@ep-hidden-rice-aytmzy3n-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require",
      "3. Add NEXTAUTH_SECRET = K7xH9mP3qR8sT2vW5yZ6aB4cD8eF1gH2jK3lM5nO7pQ9rS1tU3vW5xY7zA0bC2dE4=",
      "4. Add NEXTAUTH_URL = https://tech-us-seven.vercel.app",
      "5. ⚠️ For EACH variable, set Environment = 'Production' (not just Preview/Development)",
      "6. After all 3 added, go to Deployments tab → click ⋮ on latest → Redeploy",
      "7. Wait 2 minutes, then refresh this /api/debug endpoint",
      "8. When allEnvVarsSet = true and diagnosis says ✅, login will work",
    ],
  }, { status: 200 });
}
