import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/permissions";

// Requirements coverage — groups test cases by specReference (spec section)
// Shows which sections of the spec have tests, which are untested, and pass rates
export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testCases = await db.testCase.findMany({
    where: { specReference: { not: null } },
    select: {
      specReference: true,
      status: true,
      priority: true,
      decisionNeeded: true,
      title: true,
    },
    orderBy: { specReference: "asc" },
  });

  // Group by specReference
  const grouped: Record<string, {
    section: string;
    total: number;
    pass: number;
    fail: number;
    blocked: number;
    skipped: number;
    notRun: number;
    decisionsNeeded: number;
    passRate: number;
    coverage: number;
    testCases: { title: string; status: string; priority: string; decisionNeeded: boolean }[];
  }> = {};

  for (const tc of testCases) {
    if (!tc.specReference) continue;
    if (!grouped[tc.specReference]) {
      grouped[tc.specReference] = {
        section: tc.specReference,
        total: 0,
        pass: 0,
        fail: 0,
        blocked: 0,
        skipped: 0,
        notRun: 0,
        decisionsNeeded: 0,
        passRate: 0,
        coverage: 0,
        testCases: [],
      };
    }
    const g = grouped[tc.specReference];
    g.total++;
    if (tc.status === "pass") g.pass++;
    else if (tc.status === "fail") g.fail++;
    else if (tc.status === "blocked") g.blocked++;
    else if (tc.status === "skipped") g.skipped++;
    else g.notRun++;
    if (tc.decisionNeeded) g.decisionsNeeded++;
    g.testCases.push({
      title: tc.title,
      status: tc.status,
      priority: tc.priority,
      decisionNeeded: tc.decisionNeeded,
    });
  }

  // Calculate pass rates
  const sections = Object.values(grouped).map((g) => {
    g.passRate = g.total > 0 ? Math.round((g.pass / g.total) * 100) : 0;
    g.coverage = g.total > 0 ? Math.round(((g.pass + g.fail + g.blocked + g.skipped) / g.total) * 100) : 0;
    return g;
  });

  // Also count test cases WITHOUT specReference (untraceable)
  const untraceable = await db.testCase.count({
    where: { specReference: null },
  });

  return NextResponse.json({
    sections: sections.sort((a, b) => a.section.localeCompare(b.section)),
    untraceableCount: untraceable,
    totalSpecSections: sections.length,
    totalTestCasesWithSpec: testCases.length,
  });
}
