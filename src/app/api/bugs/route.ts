import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const severity = req.nextUrl.searchParams.get("severity");
  const moduleName = req.nextUrl.searchParams.get("module");
  const reporterId = req.nextUrl.searchParams.get("reporterId");
  const assigneeId = req.nextUrl.searchParams.get("assigneeId");
  const search = req.nextUrl.searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (severity && severity !== "all") where.severity = severity;
  if (moduleName && moduleName !== "all") where.moduleName = moduleName;
  if (reporterId && reporterId !== "all") {
    if (reporterId === "none") {
      where.reporterId = null;
    } else {
      where.reporterId = reporterId;
    }
  }
  if (assigneeId && assigneeId !== "all") {
    if (assigneeId === "none") {
      where.assigneeId = null;
    } else if (assigneeId === "any") {
      where.assigneeId = { not: null };
    } else {
      where.assigneeId = assigneeId;
    }
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const bugs = await db.bug.findMany({
    where,
    include: {
      testCase: { include: { suite: { include: { module: true } } } },
      reporterRef: true,
      assigneeRef: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bugs });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    title,
    description,
    severity,
    priority,
    moduleName,
    reporter,
    reporterId,
    assignee,
    assigneeId,
    stepsToRepro,
    expected,
    actual,
    testCaseId,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const bug = await db.bug.create({
    data: {
      title,
      description,
      severity: severity ?? "major",
      priority: priority ?? "medium",
      moduleName,
      reporter,
      reporterId: reporterId || null,
      assignee,
      assigneeId: assigneeId || null,
      stepsToRepro,
      expected,
      actual,
      testCaseId: testCaseId || null,
    },
  });

  return NextResponse.json({ bug });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, severity, priority, assignee, assigneeId } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const updated = await db.bug.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
      ...(priority ? { priority } : {}),
      ...(assignee !== undefined ? { assignee } : {}),
      ...(assigneeId !== undefined ? { assigneeId: assigneeId || null } : {}),
    },
  });

  return NextResponse.json({ bug: updated });
}
