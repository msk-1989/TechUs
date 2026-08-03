import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

// GET /api/test-cases/[id] - Get single test case with full details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const testCase = await db.testCase.findUnique({
    where: { id },
    include: {
      suite: { include: { module: true } },
      bugs: true,
      executions: {
        orderBy: { executedAt: "desc" },
        include: { tester: true },
      },
      assignedTester: true,
      milestone: true,
    },
  });
  if (!testCase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ testCase });
}

// PUT /api/test-cases/[id] - Update test case (admin only)
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

  const before = await db.testCase.findUnique({
    where: { id },
    select: { title: true },
  });
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.testCase.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description || null } : {}),
      ...(body.steps !== undefined ? { steps: body.steps || null } : {}),
      ...(body.expected !== undefined ? { expected: body.expected || null } : {}),
      ...(body.priority !== undefined ? { priority: body.priority } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.decisionNeeded !== undefined ? { decisionNeeded: body.decisionNeeded } : {}),
      ...(body.specReference !== undefined ? { specReference: body.specReference || null } : {}),
      ...(body.suiteId !== undefined ? { suiteId: body.suiteId } : {}),
      ...(body.milestoneId !== undefined ? { milestoneId: body.milestoneId || null } : {}),
      ...(body.assignedTesterId !== undefined ? { assignedTesterId: body.assignedTesterId || null } : {}),
    },
    include: { suite: { include: { module: true } } },
  });

  await createAuditLog({
    userId: session.id,
    action: "test_case.update",
    entityType: "TestCase",
    entityId: id,
    details: `Updated test case: "${before.title}"`,
  });

  return NextResponse.json({ testCase: updated });
}

// DELETE /api/test-cases/[id] - Delete test case (admin only)
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

  const before = await db.testCase.findUnique({
    where: { id },
    select: { title: true },
  });
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete related records first
  await db.testExecution.deleteMany({ where: { testCaseId: id } });
  await db.bug.deleteMany({ where: { testCaseId: id } });
  await db.testCase.delete({ where: { id } });

  await createAuditLog({
    userId: session.id,
    action: "test_case.delete",
    entityType: "TestCase",
    entityId: id,
    details: `Deleted test case: "${before.title}"`,
  });

  return NextResponse.json({ ok: true });
}

// POST /api/test-cases/[id]?clone=true - Clone test case (admin only)
export async function POST(
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

  const original = await db.testCase.findUnique({
    where: { id },
    include: { suite: true },
  });
  if (!original) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cloned = await db.testCase.create({
    data: {
      suiteId: original.suiteId,
      title: `${original.title} (Clone)`,
      description: original.description,
      steps: original.steps,
      expected: original.expected,
      status: "not_run",
      priority: original.priority,
      category: original.category,
      decisionNeeded: original.decisionNeeded,
      specReference: original.specReference,
      milestoneId: original.milestoneId,
    },
    include: { suite: { include: { module: true } } },
  });

  await createAuditLog({
    userId: session.id,
    action: "test_case.clone",
    entityType: "TestCase",
    entityId: cloned.id,
    details: `Cloned test case: "${original.title}" → "${cloned.title}"`,
  });

  return NextResponse.json({ testCase: cloned }, { status: 201 });
}
