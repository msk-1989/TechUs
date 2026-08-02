import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const moduleId = req.nextUrl.searchParams.get("moduleId");
  const priority = req.nextUrl.searchParams.get("priority");
  const category = req.nextUrl.searchParams.get("category");
  const testerId = req.nextUrl.searchParams.get("testerId");
  const search = req.nextUrl.searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (priority && priority !== "all") where.priority = priority;
  if (category && category !== "all") where.category = category;
  if (moduleId && moduleId !== "all") {
    where.suite = { moduleId };
  }
  if (testerId && testerId !== "all") {
    if (testerId === "any") {
      // tests that have at least one execution
      where.executions = { some: {} };
    } else if (testerId === "none") {
      // tests that have no executions yet
      where.executions = { none: {} };
    } else {
      where.executions = { some: { testerId } };
    }
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
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
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ testCases });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, notes, testerName, testerId, createExecution } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  const updated = await db.testCase.update({
    where: { id },
    data: {
      status,
      notes: notes ?? undefined,
      testerName: testerName ?? undefined,
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
        testerId: testerId || null,
      },
    });
  }

  return NextResponse.json({ testCase: updated });
}
