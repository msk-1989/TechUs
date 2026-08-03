import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const COLORS = ["emerald", "violet", "amber", "sky", "rose", "teal"];

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "tester",
        emailVerified: new Date(),
        tester: {
          create: { name, email: email.toLowerCase(), role: "tester", color },
        },
      },
      include: { tester: true },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "auth.register",
        entityType: "User",
        entityId: user.id,
        details: `New tester registered: ${name} (${email})`,
      },
    });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Registration failed" }, { status: 500 });
  }
}
