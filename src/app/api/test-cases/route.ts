import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

  const session = await getServerSession(authOptions);
  const currentTesterId = (session?.user as any)?.testerId;

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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const testerId = (session.user as any).testerId;
  const testerName = session.user.name ?? undefined;

  const body = await req.json();
  const { id, status, notes, testerName: overrideName, createExecution } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

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
