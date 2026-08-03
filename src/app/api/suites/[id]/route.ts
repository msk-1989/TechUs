import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

// PUT /api/suites/[id] — update suite (admin only)
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
  const { name, description, order, moduleId } = body;

  const before = await db.testSuite.findUnique({ where: { id }, select: { name: true } });
  if (!before) {
    return NextResponse.json({ error: "Suite not found" }, { status: 404 });
  }

  const updated = await db.testSuite.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(order !== undefined ? { order } : {}),
      ...(moduleId !== undefined ? { moduleId } : {}),
    },
    include: { module: true },
  });

  await createAuditLog({
    userId: session.id,
    action: "suite.update",
    entityType: "TestSuite",
    entityId: id,
    details: `Updated suite: "${before.name}"`,
  });

  return NextResponse.json({ suite: updated });
}

// DELETE /api/suites/[id] — delete suite with cascade (admin only)
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

  const before = await db.testSuite.findUnique({
    where: { id },
    include: { _count: { select: { testCases: true } }, module: true },
  });
  if (!before) {
    return NextResponse.json({ error: "Suite not found" }, { status: 404 });
  }

  await db.testSuite.delete({ where: { id } });

  await createAuditLog({
    userId: session.id,
    action: "suite.delete",
    entityType: "TestSuite",
    entityId: id,
    details: `Deleted suite: "${before.name}" from module "${before.module.name}" — ${before._count.testCases} test cases`,
  });

  return NextResponse.json({
    ok: true,
    deleted: { name: before.name, testCaseCount: before._count.testCases },
  });
}
