import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Test login endpoint — TEMPORARY. Tests the exact same flow as NextAuth's authorize().
// GET /api/auth/test-login?email=admin@techus.app&password=admin123
// Returns the exact failure reason if login doesn't work.

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "admin@techus.app";
  const password = req.nextUrl.searchParams.get("password") || "admin123";

  const steps: string[] = [];
  let user: any = null;

  // Step 1: Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      ok: false,
      steps: ["❌ DATABASE_URL env var is NOT set on Vercel"],
      diagnosis: "Add DATABASE_URL to Vercel env vars, then redeploy.",
    }, { status: 500 });
  }
  steps.push("✅ DATABASE_URL is set");

  // Step 2: Find user
  try {
    user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { tester: true },
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      steps: [...steps, `❌ DB query failed: ${e.message?.slice(0, 200)}`],
      diagnosis: "Database connection issue. Check DATABASE_URL value.",
    }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({
      ok: false,
      steps: [...steps, `❌ No user found with email: ${email}`],
      diagnosis: "User doesn't exist in DB. Run the seed script: DATABASE_URL='<your_url>' bun run scripts/seed.ts",
      email_checked: email,
    }, { status: 401 });
  }
  steps.push(`✅ User found: ${user.name} (role: ${user.role})`);

  // Step 3: Check active flag
  if (!user.active) {
    return NextResponse.json({
      ok: false,
      steps: [...steps, "❌ User account is deactivated (active=false)"],
    }, { status: 401 });
  }
  steps.push("✅ User account is active");

  // Step 4: Check password hash exists
  if (!user.passwordHash) {
    return NextResponse.json({
      ok: false,
      steps: [...steps, "❌ User has no password hash (passwordHash is null)"],
      diagnosis: "Run the seed script to set passwords.",
    }, { status: 401 });
  }
  steps.push(`✅ Password hash exists (${user.passwordHash.length} chars)`);

  // Step 5: Verify password
  let passwordMatch = false;
  try {
    passwordMatch = await bcrypt.compare(password, user.passwordHash);
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      steps: [...steps, `❌ bcrypt.compare threw: ${e.message}`],
    }, { status: 500 });
  }

  if (!passwordMatch) {
    return NextResponse.json({
      ok: false,
      steps: [...steps, `❌ Password "${password}" does NOT match the hash for ${email}`],
      diagnosis: "Either use the correct password, or re-seed the database.",
    }, { status: 401 });
  }
  steps.push(`✅ Password "${password}" matches`);

  // All good
  return NextResponse.json({
    ok: true,
    steps,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      testerId: user.tester?.id ?? null,
    },
    diagnosis: "✅ Login should work! If NextAuth still returns 401, check NEXTAUTH_SECRET is set and redeployed.",
  });
}
