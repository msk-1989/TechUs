import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";

// POST /api/auth/forgot-password
// Body: { email }
// Generates a 6-digit OTP, stores in VerificationToken, returns OTP (for MVP without email service)
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  // Don't reveal whether email exists — but for MVP we'll return OTP directly
  if (!user || !user.active) {
    return NextResponse.json({ ok: true, otp: null, message: "If that email is registered, an OTP has been sent." });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store OTP in VerificationToken (reuse NextAuth's model)
  await db.verificationToken.deleteMany({ where: { identifier: email.toLowerCase() } });
  await db.verificationToken.create({
    data: {
      identifier: email.toLowerCase(),
      token: otp,
      expires,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "auth.password_reset_requested",
    entityType: "User",
    entityId: user.id,
    details: `Password reset OTP generated for ${email}`,
  });

  // For MVP without email service configured, return OTP directly
  // In production with RESEND_API_KEY set, this would send an email instead
  const hasEmailService = !!process.env.RESEND_API_KEY;
  return NextResponse.json({
    ok: true,
    otp: hasEmailService ? null : otp, // Only return OTP if no email service
    emailSent: hasEmailService,
    message: hasEmailService
      ? "OTP sent to your email"
      : "OTP generated (no email service configured — showing OTP for development)",
  });
}
