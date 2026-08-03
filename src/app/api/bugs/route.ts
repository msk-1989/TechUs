import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog, notifyUser } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const severity = req.nextUrl.searchParams.get("severity");
  const moduleName = req.nextUrl.searchParams.get("module");
  const reporterId = req.nextUrl.searchParams.get("reporterId");
  const assigneeId = req.nextUrl.searchParams.get("assigneeId");
  const assignedToMe = req.nextUrl.searchParams.get("assignedToMe");
  const search = req.nextUrl.searchParams.get("search");

  const session = await getServerSession(authOptions);
  const currentTesterId = (session?.user as any)?.testerId;

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (severity && severity !== "all") where.severity = severity;
  if (moduleName && moduleName !== "all") where.moduleName = moduleName;
  if (assignedToMe === "true" && currentTesterId) {
    where.assigneeId = currentTesterId;
  }
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
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const testerId = (session.user as any).testerId;
  const testerName = session.user.name ?? undefined;

  const body = await req.json();
  const {
    title, description, severity, priority, moduleName,
    reporter, assigneeId, stepsToRepro, expected, actual, testCaseId,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const assignee = assigneeId
    ? await db.tester.findUnique({ where: { id: assigneeId }, include: { user: true } })
    : null;

  const bug = await db.bug.create({
    data: {
      title,
      description,
      severity: severity ?? "major",
      priority: priority ?? "medium",
      moduleName,
      reporter: reporter ?? testerName,
      reporterId: testerId ?? null,
      assignee: assignee?.name ?? null,
      assigneeId: assigneeId || null,
      stepsToRepro,
      expected,
      actual,
      testCaseId: testCaseId || null,
    },
  });

  await createAuditLog({
    userId,
    action: "bug.create",
    entityType: "Bug",
    entityId: bug.id,
    details: `Created bug: "${title}" (${severity ?? "major"})`,
  });

  // Notify the assignee if set
  if (assignee?.userId) {
    await notifyUser({
      userId: assignee.userId,
      type: "bug_assigned",
      title: `New bug assigned: ${title}`,
      body: `Severity: ${severity ?? "major"} · Module: ${moduleName ?? "—"}`,
      link: "/?view=bugs",
    });
  }

  return NextResponse.json({ bug });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await req.json();
  const { id, status, severity, priority, assignee, assigneeId } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const before = await db.bug.findUnique({
    where: { id },
    select: { title: true, status: true, assigneeId: true },
  });

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

  // If assignee changed, notify new assignee
  if (assigneeId && assigneeId !== before?.assigneeId) {
    const newAssignee = await db.tester.findUnique({
      where: { id: assigneeId },
      include: { user: true },
    });
    if (newAssignee?.userId) {
      await notifyUser({
        userId: newAssignee.userId,
        type: "bug_assigned",
        title: `Bug reassigned to you: ${before?.title ?? "Bug"}`,
        body: `Status: ${status ?? "unchanged"}`,
        link: "/?view=bugs",
      });
    }
  }

  await createAuditLog({
    userId,
    action: "bug.update",
    entityType: "Bug",
    entityId: id,
    details: `"${before?.title ?? "Bug"}" — ${Object.keys(body).filter(k => !["id"].includes(k)).join(", ")}`,
  });

  return NextResponse.json({ bug: updated });
}
