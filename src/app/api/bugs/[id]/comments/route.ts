import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/permissions";
import { createAuditLog, notifyUser } from "@/lib/audit";
import { emailTemplate_BugCommented } from "@/lib/email";

// GET /api/bugs/[id]/comments — list comments for a bug
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const comments = await db.bugComment.findMany({
    where: { bugId: id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json({ comments });
}

// POST /api/bugs/[id]/comments — add a comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { body } = await req.json();

  if (!body || !body.trim()) {
    return NextResponse.json({ error: "Comment body required" }, { status: 400 });
  }

  const bug = await db.bug.findUnique({ where: { id }, select: { title: true, reporterId: true, assigneeId: true } });
  if (!bug) return NextResponse.json({ error: "Bug not found" }, { status: 404 });

  const comment = await db.bugComment.create({
    data: { bugId: id, userId: session.id, body: body.trim() },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  await createAuditLog({
    userId: session.id,
    action: "bug.comment",
    entityType: "BugComment",
    entityId: comment.id,
    details: `Commented on bug "${bug.title}": ${body.trim().slice(0, 80)}`,
  });

  // Notify the reporter and assignee (if they're not the commenter)
  const notifyIds = new Set<string>();
  if (bug.reporterId) {
    const reporter = await db.tester.findUnique({ where: { id: bug.reporterId }, select: { userId: true } });
    if (reporter?.userId && reporter.userId !== session.id) notifyIds.add(reporter.userId);
  }
  if (bug.assigneeId) {
    const assignee = await db.tester.findUnique({ where: { id: bug.assigneeId }, select: { userId: true } });
    if (assignee?.userId && assignee.userId !== session.id) notifyIds.add(assignee.userId);
  }
  for (const userId of notifyIds) {
    const recipient = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
    const emailTpl = emailTemplate_BugCommented({ title: bug.title }, session.name ?? "Someone", body.trim());
    await notifyUser({
      userId,
      type: "bug_comment",
      title: `New comment on: ${bug.title}`,
      body: `${session.name}: ${body.trim().slice(0, 100)}`,
      link: "/?view=bugs",
      email: recipient?.email ? { to: recipient.email, ...emailTpl } : undefined,
    });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
