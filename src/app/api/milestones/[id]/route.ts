import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

// PUT /api/milestones/[id] — update milestone (admin only)
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
  const { name, description, targetDate, status } = body;

  const before = await db.milestone.findUnique({ where: { id }, select: { name: true } });
  if (!before) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  const updated = await db.milestone.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(targetDate !== undefined ? { targetDate: targetDate ? new Date(targetDate) : null } : {}),
      ...(status !== undefined ? { status } : {}),
    },
  });

  await createAuditLog({
    userId: session.id,
    action: "milestone.update",
    entityType: "Milestone",
    entityId: id,
    details: `Updated milestone: "${before.name}"`,
  });

  return NextResponse.json({ milestone: updated });
}

// DELETE /api/milestones/[id] — delete milestone (admin only)
// Test cases linked to this milestone will have milestoneId set to null (preserved)
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

  const before = await db.milestone.findUnique({
    where: { id },
    select: { name: true, _count: { select: { testCases: true } } },
  });
  if (!before) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  // Unlink test cases from this milestone (set milestoneId to null, preserve test cases)
  await db.testCase.updateMany({
    where: { milestoneId: id },
    data: { milestoneId: null },
  });

  await db.milestone.delete({ where: { id } });

  await createAuditLog({
    userId: session.id,
    action: "milestone.delete",
    entityType: "Milestone",
    entityId: id,
    details: `Deleted milestone: "${before.name}" — ${before._count.testCases} test cases unlinked`,
  });

  return NextResponse.json({
    ok: true,
    deleted: { name: before.name, testCaseCount: before._count.testCases },
  });
}
