import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";

// POST /api/auth/reset-password
// Body: { email, otp, newPassword }
export async function POST(req: NextRequest) {
  const { email, otp, newPassword } = await req.json();
  if (!email || !otp || !newPassword) {
    return NextResponse.json({ error: "Email, OTP, and new password are required" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const identifier = email.toLowerCase();

  // Find the OTP token
  const token = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier, token: otp } },
  });

  if (!token) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }
  if (token.expires < new Date()) {
    await db.verificationToken.delete({
      where: { identifier_token: { identifier: token.identifier, token: token.token } },
    });
    return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: identifier } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update user
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Delete the used token
  await db.verificationToken.delete({
    where: { identifier_token: { identifier: token.identifier, token: token.token } },
  });

  await createAuditLog({
    userId: user.id,
    action: "auth.password_reset",
    entityType: "User",
    entityId: user.id,
    details: `Password reset completed for ${email}`,
  });

  return NextResponse.json({ ok: true, message: "Password reset successful. You can now login." });
}
