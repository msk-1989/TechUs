import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const milestones = await db.milestone.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      testCases: {
        select: {
          status: true,
        },
      },
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
