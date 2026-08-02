import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const testers = await db.tester.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      executions: {
        orderBy: { executedAt: "desc" },
        take: 50,
        include: {
          testCase: {
            select: {
              id: true,
              title: true,
              suite: { select: { module: { select: { name: true } } } },
            },
          },
        },
      },
      reportedBugs: { orderBy: { createdAt: "desc" }, take: 30 },
      assignedBugs: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  // Compute per-tester stats
  const testersWithStats = testers.map((t) => {
    const executions = t.executions;
    const pass = executions.filter((e) => e.status === "pass").length;
    const fail = executions.filter((e) => e.status === "fail").length;
    const blocked = executions.filter((e) => e.status === "blocked").length;
    const skipped = executions.filter((e) => e.status === "skipped").length;
    const total = executions.length;
    const passRate = total > 0 ? Math.round((pass / total) * 100) : 0;
    const lastActive = executions[0]?.executedAt ?? null;

    // Unique modules touched
    const moduleSet = new Set<string>();
    executions.forEach((e) => {
      if (e.testCase?.suite?.module?.name) moduleSet.add(e.testCase.suite.module.name);
    });

    return {
      id: t.id,
      name: t.name,
      email: t.email,
      role: t.role,
      color: t.color,
      active: t.active,
      stats: {
        totalExecutions: total,
        pass,
        fail,
        blocked,
        skipped,
        passRate,
        bugsReported: t.reportedBugs.length,
        bugsAssigned: t.assignedBugs.length,
        modulesTouched: moduleSet.size,
        lastActive,
      },
      recentExecutions: executions.slice(0, 10).map((e) => ({
        id: e.id,
        status: e.status,
        notes: e.notes,
        executedAt: e.executedAt,
        testCase: {
          id: e.testCase.id,
          title: e.testCase.title,
          module: e.testCase.suite.module.name,
        },
      })),
      recentBugs: t.reportedBugs.slice(0, 10).map((b) => ({
        id: b.id,
        title: b.title,
        severity: b.severity,
        status: b.status,
        createdAt: b.createdAt,
      })),
    };
  });

  return NextResponse.json({ testers: testersWithStats });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, role, color } = body;

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const tester = await db.tester.create({
    data: {
      name,
      email,
      role: role ?? "tester",
      color: color ?? "emerald",
    },
  });

  return NextResponse.json({ tester });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, active, role, color, name, email } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const updated = await db.tester.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(active !== undefined ? { active } : {}),
    },
  });

  return NextResponse.json({ tester: updated });
}
