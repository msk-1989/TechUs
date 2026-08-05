import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog, notifyUser } from "@/lib/audit";
import { emailTemplate_BugAssigned, emailTemplate_BugFixed } from "@/lib/email";
import { getCurrentUser, isAdmin, canUpdateBug } from "@/lib/permissions";

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
  const role = (session?.user as any)?.role;

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

  return NextResponse.json({ bugs, currentUserRole: role });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const testerId = (session.user as any).testerId;
  const testerName = session.user.name ?? undefined;
  const role = (session.user as any).role;

  const body = await req.json();
  const {
    title, description, severity, priority, moduleName,
    reporter, assigneeId, stepsToRepro, expected, actual, testCaseId,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  // Only admin/lead can assign bugs to developers; developers/testers create unassigned
  const canAssign = isAdmin({ role } as any);
  const finalAssigneeId = canAssign ? (assigneeId || null) : null;

  const assignee = finalAssigneeId
    ? await db.tester.findUnique({ where: { id: finalAssigneeId }, include: { user: true } })
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
      assigneeId: finalAssigneeId,
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
    details: `Created bug: "${title}" (${severity ?? "major"})${assignee ? ` → assigned to ${assignee.name}` : ""}`,
  });

  // Notify the assignee if set
  if (assignee?.userId) {
    const emailTpl = emailTemplate_BugAssigned({ title, severity: severity ?? "major", moduleName, stepsToRepro });
    await notifyUser({
      userId: assignee.userId,
      type: "bug_assigned",
      title: `New bug assigned: ${title}`,
      body: `Severity: ${severity ?? "major"} · Module: ${moduleName ?? "—"}`,
      link: "/?view=bugs",
      email: assignee.user?.email ? { to: assignee.user.email, ...emailTpl } : undefined,
    });
  }

  return NextResponse.json({ bug });
}

export async function PATCH(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.id;
  const testerId = session.testerId;

  const body = await req.json();
  const { id, status, severity, priority, assignee, assigneeId, resolutionNotes } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Fetch the bug to check permissions
  const before = await db.bug.findUnique({
    where: { id },
    select: { title: true, status: true, assigneeId: true, reporterId: true },
  });
  if (!before) {
    return NextResponse.json({ error: "Bug not found" }, { status: 404 });
  }

  // Permission check:
  // - Admin/lead: can change anything (status, severity, priority, assignee)
  // - Developer: can change status ONLY on bugs assigned to them, and add resolution notes
  // - Tester: cannot change bug status (must ask admin/developer)
  const isAssignedToThisDev = session.role === "developer" && before.assigneeId === testerId;

  // Restricted fields (only admin/lead can change)
  const restrictedFields = ["severity", "priority", "assignee", "assigneeId"];
  const attemptingRestricted = restrictedFields.some((f) => body[f] !== undefined);

  if (attemptingRestricted && !isAdmin(session)) {
    return NextResponse.json(
      { error: "Forbidden — only admin/lead can change severity, priority, or assignee" },
      { status: 403 }
    );
  }

  // Status change permissions
  if (status && !isAdmin(session) && !isAssignedToThisDev) {
    return NextResponse.json(
      { error: "Forbidden — you can only update status of bugs assigned to you" },
      { status: 403 }
    );
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (severity) updateData.severity = severity;
  if (priority) updateData.priority = priority;
  if (assignee !== undefined) updateData.assignee = assignee;
  if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;

  // If developer is marking as fixed/resolved, store resolution notes in the bug
  if (resolutionNotes && (status === "fixed" || status === "verified")) {
    // Append resolution notes to description for now (could be a separate field later)
    const existingDesc = (await db.bug.findUnique({ where: { id }, select: { description: true } }))?.description || "";
    updateData.description = `${existingDesc}\n\n--- Resolution Notes (${new Date().toISOString().slice(0, 10)}) ---\n${resolutionNotes}`.trim();
  }

  const updated = await db.bug.update({
    where: { id },
    data: updateData,
  });

  // If assignee changed, notify new assignee
  if (assigneeId && assigneeId !== before?.assigneeId) {
    const newAssignee = await db.tester.findUnique({
      where: { id: assigneeId },
      include: { user: true },
    });
    if (newAssignee?.userId) {
      const emailTpl = emailTemplate_BugAssigned({ title: before?.title ?? "Bug", severity: before.severity, moduleName: before.moduleName });
      await notifyUser({
        userId: newAssignee.userId,
        type: "bug_assigned",
        title: `Bug reassigned to you: ${before?.title ?? "Bug"}`,
        body: `Status: ${status ?? "unchanged"}`,
        link: "/?view=bugs",
        email: newAssignee.user?.email ? { to: newAssignee.user.email, ...emailTpl } : undefined,
      });
    }
  }

  // If developer marked as fixed, notify the reporter (so they can verify)
  if (status === "fixed" && before.reporterId) {
    const reporter = await db.tester.findUnique({
      where: { id: before.reporterId },
      include: { user: true },
    });
    if (reporter?.userId) {
      const fixerName = session.name ?? "A developer";
      const emailTpl = emailTemplate_BugFixed({ title: before?.title ?? "Bug" }, fixerName, resolutionNotes);
      await notifyUser({
        userId: reporter.userId,
        type: "bug_fixed",
        title: `Bug marked as fixed: ${before?.title ?? "Bug"}`,
        body: `The developer has marked this bug as fixed. Please verify and close.`,
        link: "/?view=bugs",
        email: reporter.user?.email ? { to: reporter.user.email, ...emailTpl } : undefined,
      });
    }
  }

  await createAuditLog({
    userId,
    action: "bug.update",
    entityType: "Bug",
    entityId: id,
    details: `"${before?.title ?? "Bug"}" — ${Object.keys(body).filter(k => !["id", "resolutionNotes"].includes(k)).join(", ")}${resolutionNotes ? ` | notes: ${resolutionNotes.slice(0, 60)}` : ""}`,
  });

  return NextResponse.json({ bug: updated });
}
