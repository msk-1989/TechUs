// =============================================================================
// PRODUCTION ENV FALLBACK
// =============================================================================
// This file provides hardcoded fallback values for environment variables that
// are NOT set on Vercel. This allows the app to boot without manual env var
// configuration.
//
// ⚠️  SECURITY WARNING:
// This file is committed to the git repo (which is private). The values below
// are also in the Neon dashboard. After the app is working, you SHOULD:
//   1. Set proper env vars on Vercel (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
//   2. Rotate the Neon DB password (since it was shared in chat)
//   3. Rotate NEXTAUTH_SECRET (since it's hardcoded here)
//   4. Delete this file once env vars are properly set on Vercel
// =============================================================================

const NEON_DB_URL =
  "postgresql://neondb_owner:npg_kHe7iYy1GlFW@ep-hidden-rice-aytmzy3n-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";

const FALLBACK_NEXTAUTH_SECRET =
  "K7xH9mP3qR8sT2vW5yZ6aB4cD8eF1gH2jK3lM5nO7pQ9rS1tU3vW5xY7zA0bC2dE4=";

const FALLBACK_NEXTAUTH_URL = "https://tech-us-seven.vercel.app";

/**
 * Get the DATABASE_URL — prefers process.env (set on Vercel), falls back to hardcoded.
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || NEON_DB_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set in env vars and no fallback available. " +
      "Set DATABASE_URL on Vercel or restore this fallback file."
    );
  }
  return url;
}

/**
 * Get NEXTAUTH_SECRET — prefers process.env, falls back to hardcoded.
 */
export function getNextauthSecret(): string {
  return process.env.NEXTAUTH_SECRET || FALLBACK_NEXTAUTH_SECRET;
}

/**
 * Get NEXTAUTH_URL — prefers process.env, falls back to hardcoded.
 */
export function getNextauthUrl(): string {
  return process.env.NEXTAUTH_URL || FALLBACK_NEXTAUTH_URL;
}

/**
 * Whether env vars are properly set on Vercel (for debug endpoint).
 */
export function getEnvStatus() {
  return {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL_set: !!process.env.NEXTAUTH_URL,
    using_fallback_database: !process.env.DATABASE_URL,
    using_fallback_secret: !process.env.NEXTAUTH_SECRET,
    using_fallback_url: !process.env.NEXTAUTH_URL,
  };
}
