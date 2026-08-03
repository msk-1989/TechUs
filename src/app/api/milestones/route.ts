import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

// GET /api/milestones — list all milestones with stats
export async function GET() {
  const milestones = await db.milestone.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      testCases: { select: { status: true } },
    },
  });
  const withStats = milestones.map((m) => {
    const total = m.testCases.length;
    const pass = m.testCases.filter((t) => t.status === "pass").length;
    const fail = m.testCases.filter((t) => t.status === "fail").length;
    const notRun = m.testCases.filter((t) => t.status === "not_run").length;
    return {
      id: m.id,
      name: m.name,
      description: m.description,
      targetDate: m.targetDate,
      status: m.status,
      createdAt: m.createdAt,
      stats: { total, pass, fail, notRun, passRate: total > 0 ? Math.round((pass / total) * 100) : 0 },
    };
  });
  return NextResponse.json({ milestones: withStats });
}

// POST /api/milestones — create a new milestone (admin only)
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
  const { name, description, targetDate, status } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const milestone = await db.milestone.create({
    data: {
      name,
      description: description || null,
      targetDate: targetDate ? new Date(targetDate) : null,
      status: status || "active",
    },
  });

  await createAuditLog({
    userId: session.id,
    action: "milestone.create",
    entityType: "Milestone",
    entityId: milestone.id,
    details: `Created milestone: ${name}`,
  });

  return NextResponse.json({ milestone }, { status: 201 });
}
