import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEnvStatus } from "@/lib/env-config";

// Debug endpoint — TEMPORARY. Remove after troubleshooting is complete.

export async function GET() {
  const status = getEnvStatus();

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

  const allSet = status.DATABASE_URL_set && status.NEXTAUTH_SECRET_set && status.NEXTAUTH_URL_set;
  const usingFallback = status.using_fallback_database || status.using_fallback_secret;

  let diagnosis: string;
  if (dbConnection === "failed") {
    diagnosis = `❌ DB connection failed: ${dbError}`;
  } else if (userCount === 0) {
    diagnosis = "❌ DB connected but NO users. Run seed: bun run scripts/seed.ts";
  } else if (!adminExists) {
    diagnosis = "❌ admin@techus.app not found in DB. Re-seed the database.";
  } else if (passwordValid === false) {
    diagnosis = "❌ admin@techus.app exists but password 'admin123' does NOT match.";
  } else if (usingFallback) {
    diagnosis = "✅ App is WORKING using hardcoded fallback env values. Login should succeed with admin@techus.app / admin123. (Recommend setting proper env vars on Vercel and removing env-config.ts fallback.)";
  } else {
    diagnosis = "✅ All env vars set on Vercel, DB connected, admin user valid. Login with admin@techus.app / admin123";
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    vercel_url: "https://tech-us-seven.vercel.app",
    environment: {
      NODE_ENV: process.env.NODE_ENV ?? "unset",
      DATABASE_URL_set: status.DATABASE_URL_set,
      NEXTAUTH_SECRET_set: status.NEXTAUTH_SECRET_set,
      NEXTAUTH_URL_set: status.NEXTAUTH_URL_set,
      using_fallback_database: status.using_fallback_database,
      using_fallback_secret: status.using_fallback_secret,
      using_fallback_url: status.using_fallback_url,
    },
    database: {
      connection: dbConnection,
      error: dbError,
      userCount,
      adminExists,
      adminPasswordValid: passwordValid,
    },
    allEnvVarsSet: allSet,
    using_any_fallback: usingFallback,
    diagnosis,
    login_url: "https://tech-us-seven.vercel.app",
  }, { status: 200 });
}
