import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

// GET /api/admin/users — list all users (admin only)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden — admin only" },
      { status: e.message === "UNAUTHORIZED" ? 401 : 403 }
    );
  }

  const roleFilter = req.nextUrl.searchParams.get("role");
  const activeFilter = req.nextUrl.searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (roleFilter && roleFilter !== "all") where.role = roleFilter;
  if (activeFilter === "true") where.active = true;
  if (activeFilter === "false") where.active = false;

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tester: {
        select: {
          id: true,
          name: true,
          color: true,
          role: true,
          active: true,
          _count: {
            select: {
              executions: true,
              reportedBugs: true,
              assignedBugs: true,
            },
          },
        },
      },
    },
  });

  // Sanitize — never expose passwordHash
  const sanitized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
    tester: u.tester
      ? {
          id: u.tester.id,
          name: u.tester.name,
          color: u.tester.color,
          active: u.tester.active,
          stats: {
            executions: u.tester._count.executions,
            bugsReported: u.tester._count.reportedBugs,
            bugsAssigned: u.tester._count.assignedBugs,
          },
        }
      : null,
  }));

  return NextResponse.json({ users: sanitized });
}

// POST /api/admin/users — create a new user (admin only)
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden — admin only" },
      { status: e.message === "UNAUTHORIZED" ? 401 : 403 }
    );
  }

  const body = await req.json();
  const { name, email, password, role, color } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "Missing required fields: name, email, password, role" },
      { status: 400 }
    );
  }

  if (!["admin", "lead", "tester", "developer"].includes(role)) {
    return NextResponse.json(
      { error: "Invalid role. Must be: admin, lead, tester, or developer" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const assignedColor = color || ["emerald", "violet", "amber", "sky", "rose", "teal"][Math.floor(Math.random() * 6)];

  const user = await db.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      emailVerified: new Date(),
      tester: {
        create: {
          name,
          email: email.toLowerCase(),
          role,
          color: assignedColor,
        },
      },
    },
    include: { tester: true },
  });

  await createAuditLog({
    userId: session.id,
    action: "user.create",
    entityType: "User",
    entityId: user.id,
    details: `Created ${role} account: ${name} (${email})`,
  });

  return NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        testerId: user.tester?.id ?? null,
      },
    },
    { status: 201 }
  );
}
