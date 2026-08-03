import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

// PUT /api/modules/[id] — update module (admin only)
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
  const { name, description, icon, order, key } = body;

  const before = await db.module.findUnique({ where: { id }, select: { name: true } });
  if (!before) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  // Check key uniqueness if changing
  if (key) {
    const existing = await db.module.findUnique({ where: { key } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Module key already in use" }, { status: 409 });
    }
  }

  const updated = await db.module.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(icon !== undefined ? { icon } : {}),
      ...(order !== undefined ? { order } : {}),
      ...(key !== undefined ? { key } : {}),
    },
  });

  await createAuditLog({
    userId: session.id,
    action: "module.update",
    entityType: "Module",
    entityId: id,
    details: `Updated module: "${before.name}"`,
  });

  return NextResponse.json({ module: updated });
}

// DELETE /api/modules/[id] — delete module with cascade (admin only)
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

  const before = await db.module.findUnique({
    where: { id },
    include: {
      _count: { select: { suites: true } },
      suites: {
        select: { _count: { select: { testCases: true } } },
      },
    },
  });
  if (!before) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  const suiteCount = before._count.suites;
  const testCaseCount = before.suites.reduce((sum, s) => sum + s._count.testCases, 0);

  // Cascade delete: suites → test cases → executions + bugs (handled by Prisma onDelete: Cascade)
  await db.module.delete({ where: { id } });

  await createAuditLog({
    userId: session.id,
    action: "module.delete",
    entityType: "Module",
    entityId: id,
    details: `Deleted module: "${before.name}" — ${suiteCount} suites, ${testCaseCount} test cases`,
  });

  return NextResponse.json({
    ok: true,
    deleted: { name: before.name, suiteCount, testCaseCount },
  });
}
