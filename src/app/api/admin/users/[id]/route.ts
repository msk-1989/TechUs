import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { requireAdmin, getCurrentUser } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

// PUT /api/admin/users/[id] — update user (admin only)
// Can update: name, email, role, active, password
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireAdmin();
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden — admin only" },
      { status: e.message === "UNAUTHORIZED" ? 401 : 403 }
    );
  }
  const { id } = await params;
  const body = await req.json();
  const { name, email, role, active, color, password } = body;

  const before = await db.user.findUnique({
    where: { id },
    include: { tester: true },
  });
  if (!before) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Safety: prevent admin from deactivating or downgrading themselves
  if (session.id === id) {
    if (active === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }
    if (role && role !== "admin") {
      return NextResponse.json(
        { error: "You cannot downgrade your own admin role" },
        { status: 400 }
      );
    }
  }

  // Validate role if provided
  if (role && !["admin", "lead", "tester", "developer"].includes(role)) {
    return NextResponse.json(
      { error: "Invalid role. Must be: admin, lead, tester, or developer" },
      { status: 400 }
    );
  }

  // Check email uniqueness if changing
  if (email && email.toLowerCase() !== before.email) {
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered by another user" },
        { status: 409 }
      );
    }
  }

  // Build update data for User
  const userUpdate: Record<string, unknown> = {};
  if (name !== undefined) userUpdate.name = name;
  if (email !== undefined) userUpdate.email = email.toLowerCase();
  if (role !== undefined) userUpdate.role = role;
  if (active !== undefined) userUpdate.active = active;
  if (password !== undefined) {
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    userUpdate.passwordHash = await bcrypt.hash(password, 12);
  }

  // Update User
  const updated = await db.user.update({
    where: { id },
    data: userUpdate,
  });

  // Update linked Tester profile if exists
  if (before.tester) {
    const testerUpdate: Record<string, unknown> = {};
    if (name !== undefined) testerUpdate.name = name;
    if (email !== undefined) testerUpdate.email = email.toLowerCase();
    if (role !== undefined) testerUpdate.role = role;
    if (active !== undefined) testerUpdate.active = active;
    if (color !== undefined) testerUpdate.color = color;
    if (Object.keys(testerUpdate).length > 0) {
      await db.tester.update({
        where: { id: before.tester.id },
        data: testerUpdate,
      });
    }
  }

  const changes: string[] = [];
  if (name !== undefined && name !== before.name) changes.push(`name: "${before.name}" → "${name}"`);
  if (email !== undefined) changes.push(`email updated`);
  if (role !== undefined && role !== before.role) changes.push(`role: ${before.role} → ${role}`);
  if (active !== undefined && active !== before.active) changes.push(`active: ${before.active} → ${active}`);
  if (color !== undefined) changes.push(`color updated`);
  if (password !== undefined) changes.push("password reset");

  await createAuditLog({
    userId: session.id,
    action: "user.update",
    entityType: "User",
    entityId: id,
    details: `Updated "${before.name}": ${changes.join(", ") || "no changes"}`,
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      active: updated.active,
    },
  });
}

// DELETE /api/admin/users/[id] — delete user (admin only)
// Cascade deletes: tester profile, executions, bugs (reporter/assignee set null), audit logs
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireAdmin();
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden — admin only" },
      { status: e.message === "UNAUTHORIZED" ? 401 : 403 }
    );
  }
  const { id } = await params;

  // Safety: prevent admin from deleting themselves
  if (session.id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account. Ask another admin to do this." },
      { status: 400 }
    );
  }

  const before = await db.user.findUnique({
    where: { id },
    include: { tester: true },
  });
  if (!before) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Count related records for the response
  const testerId = before.tester?.id;
  let executionCount = 0;
  let bugReportedCount = 0;
  let bugAssignedCount = 0;
  if (testerId) {
    executionCount = await db.testExecution.count({ where: { testerId } });
    bugReportedCount = await db.bug.count({ where: { reporterId: testerId } });
    bugAssignedCount = await db.bug.count({ where: { assigneeId: testerId } });
  }

  // Cascade: delete tester profile (executions cascade; bugs set null on reporter/assignee)
  if (testerId) {
    // Set null on bugs where this tester is reporter or assignee
    await db.bug.updateMany({ where: { reporterId: testerId }, data: { reporterId: null, reporter: null } });
    await db.bug.updateMany({ where: { assigneeId: testerId }, data: { assigneeId: null, assignee: null } });
    // Delete executions by this tester
    await db.testExecution.deleteMany({ where: { testerId } });
    // Delete the tester profile
    await db.tester.delete({ where: { id: testerId } });
  }
  // Delete notifications
  await db.notification.deleteMany({ where: { userId: id } });
  // Null out audit log userId (preserve history, just anonymize)
  await db.auditLog.updateMany({ where: { userId: id }, data: { userId: null } });
  // Delete the user
  await db.user.delete({ where: { id } });

  await createAuditLog({
    userId: session.id,
    action: "user.delete",
    entityType: "User",
    entityId: id,
    details: `Deleted ${before.role} account: "${before.name}" (${before.email}) — ${executionCount} executions, ${bugReportedCount} bugs reported, ${bugAssignedCount} bugs assigned`,
  });

  return NextResponse.json({
    ok: true,
    deleted: {
      name: before.name,
      email: before.email,
      role: before.role,
      executionCount,
      bugReportedCount,
      bugAssignedCount,
    },
  });
}
