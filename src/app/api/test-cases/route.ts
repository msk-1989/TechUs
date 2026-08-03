import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const moduleId = req.nextUrl.searchParams.get("moduleId");
  const priority = req.nextUrl.searchParams.get("priority");
  const category = req.nextUrl.searchParams.get("category");
  const testerId = req.nextUrl.searchParams.get("testerId");
  const decisionNeeded = req.nextUrl.searchParams.get("decisionNeeded");
  const assignedToMe = req.nextUrl.searchParams.get("assignedToMe");
  const search = req.nextUrl.searchParams.get("search");

  const session = await getCurrentUser();
  const currentTesterId = session?.testerId;

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (priority && priority !== "all") where.priority = priority;
  if (category && category !== "all") where.category = category;
  if (moduleId && moduleId !== "all") {
    where.suite = { moduleId };
  }
  if (decisionNeeded === "true") {
    where.decisionNeeded = true;
  }
  if (assignedToMe === "true" && currentTesterId) {
    where.assignedTesterId = currentTesterId;
  }
  if (testerId && testerId !== "all") {
    if (testerId === "any") {
      where.executions = { some: {} };
    } else if (testerId === "none") {
      where.executions = { none: {} };
    } else {
      where.executions = { some: { testerId } };
    }
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const testCases = await db.testCase.findMany({
    where,
    include: {
      suite: { include: { module: true } },
      bugs: true,
      executions: {
        orderBy: { executedAt: "desc" },
        take: 1,
        include: { tester: true },
      },
      assignedTester: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ testCases });
}

export async function PATCH(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.id;
  const testerId = session.testerId;
  const testerName = session.name ?? undefined;

  const body = await req.json();
  const { id, status, notes, testerName: overrideName, createExecution, assignedTesterId } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // If only updating assignment, require admin
  const isAssignmentOnly = !!assignedTesterId && !status && !notes;
  if (isAssignmentOnly && session.role !== "admin" && session.role !== "lead") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  // If updating status (execution), any authenticated user can do it
  if (status) {
    const before = await db.testCase.findUnique({
      where: { id },
      select: { title: true, status: true },
    });

    const updated = await db.testCase.update({
      where: { id },
      data: {
        status,
        notes: notes ?? undefined,
        testerName: testerName ?? overrideName ?? undefined,
        lastRunAt: new Date(),
      },
      include: { suite: { include: { module: true } }, bugs: true },
    });

    if (createExecution) {
      await db.testExecution.create({
        data: {
          testCaseId: id,
          status,
          notes: notes ?? null,
          executedBy: testerName ?? null,
          testerId: testerId ?? null,
        },
      });
    }

    await createAuditLog({
      userId,
      action: "test_case.execute",
      entityType: "TestCase",
      entityId: id,
      details: `"${before?.title ?? "Test case"}" status: ${before?.status ?? "?"} → ${status}${notes ? ` | notes: ${notes.slice(0, 80)}` : ""}`,
    });

    return NextResponse.json({ testCase: updated });
  }

  // Assignment update (admin only)
  if (assignedTesterId !== undefined) {
    const updated = await db.testCase.update({
      where: { id },
      data: {
        assignedTesterId: assignedTesterId || null,
      },
    });

    await createAuditLog({
      userId,
      action: "test_case.assign",
      entityType: "TestCase",
      entityId: id,
      details: `Assigned test case to ${assignedTesterId || "unassigned"}`,
    });

    return NextResponse.json({ testCase: updated });
  }

  return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
}

// POST - Create new test case (admin only)
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
  const {
    suiteId,
    title,
    description,
    steps,
    expected,
    priority,
    category,
    decisionNeeded,
    specReference,
    milestoneId,
    assignedTesterId,
  } = body;

  if (!suiteId || !title) {
    return NextResponse.json({ error: "suiteId and title are required" }, { status: 400 });
  }

  const testCase = await db.testCase.create({
    data: {
      suiteId,
      title,
      description: description || null,
      steps: steps || null,
      expected: expected || null,
      priority: priority ?? "medium",
      category: category ?? "functional",
      decisionNeeded: decisionNeeded ?? false,
      specReference: specReference || null,
      milestoneId: milestoneId || null,
      assignedTesterId: assignedTesterId || null,
    },
    include: { suite: { include: { module: true } } },
  });

  await createAuditLog({
    userId: session.id,
    action: "test_case.create",
    entityType: "TestCase",
    entityId: testCase.id,
    details: `Created test case: "${title}" in suite ${testCase.suite.name}`,
  });

  return NextResponse.json({ testCase }, { status: 201 });
}
