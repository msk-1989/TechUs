import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [
    totalTestCases,
    passCount,
    failCount,
    blockedCount,
    skippedCount,
    notRunCount,
    totalBugs,
    openBugs,
    criticalBugs,
    modules,
  ] = await Promise.all([
    db.testCase.count(),
    db.testCase.count({ where: { status: "pass" } }),
    db.testCase.count({ where: { status: "fail" } }),
    db.testCase.count({ where: { status: "blocked" } }),
    db.testCase.count({ where: { status: "skipped" } }),
    db.testCase.count({ where: { status: "not_run" } }),
    db.bug.count(),
    db.bug.count({ where: { status: "open" } }),
    db.bug.count({ where: { severity: "critical" } }),
    db.module.findMany({
      orderBy: { order: "asc" },
      include: {
        suites: {
          include: {
            testCases: { select: { status: true, priority: true, category: true } },
          },
        },
      },
    }),
  ]);

  // Module-wise breakdown
  const moduleStats = modules.map((m) => {
    const allTests = m.suites.flatMap((s) => s.testCases);
    const total = allTests.length;
    const pass = allTests.filter((t) => t.status === "pass").length;
    const fail = allTests.filter((t) => t.status === "fail").length;
    const blocked = allTests.filter((t) => t.status === "blocked").length;
    const skipped = allTests.filter((t) => t.status === "skipped").length;
    const notRun = allTests.filter((t) => t.status === "not_run").length;
    const passRate = total > 0 ? Math.round((pass / total) * 100) : 0;
    const executed = pass + fail + blocked + skipped;
    const coverage = total > 0 ? Math.round((executed / total) * 100) : 0;
    return {
      id: m.id,
      key: m.key,
      name: m.name,
      description: m.description,
      icon: m.icon,
      total,
      pass,
      fail,
      blocked,
      skipped,
      notRun,
      passRate,
      coverage,
    };
  });

  // Category breakdown
  const allTests = await db.testCase.findMany({ select: { status: true, category: true, priority: true } });
  const categoryStats = ["functional", "ui", "integration", "security", "payment"].map((cat) => {
    const tests = allTests.filter((t) => t.category === cat);
    return {
      category: cat,
      total: tests.length,
      pass: tests.filter((t) => t.status === "pass").length,
      fail: tests.filter((t) => t.status === "fail").length,
      blocked: tests.filter((t) => t.status === "blocked").length,
      skipped: tests.filter((t) => t.status === "skipped").length,
      notRun: tests.filter((t) => t.status === "not_run").length,
    };
  });

  const priorityStats = ["critical", "high", "medium", "low"].map((p) => {
    const tests = allTests.filter((t) => t.priority === p);
    return {
      priority: p,
      total: tests.length,
      pass: tests.filter((t) => t.status === "pass").length,
      fail: tests.filter((t) => t.status === "fail").length,
      blocked: tests.filter((t) => t.status === "blocked").length,
      skipped: tests.filter((t) => t.status === "skipped").length,
      notRun: tests.filter((t) => t.status === "not_run").length,
    };
  });

  const overallPassRate = totalTestCases > 0 ? Math.round((passCount / totalTestCases) * 100) : 0;
  const overallCoverage = totalTestCases > 0 ? Math.round(((passCount + failCount + blockedCount + skippedCount) / totalTestCases) * 100) : 0;

  return NextResponse.json({
    summary: {
      totalTestCases,
      passCount,
      failCount,
      blockedCount,
      skippedCount,
      notRunCount,
      totalBugs,
      openBugs,
      criticalBugs,
      overallPassRate,
      overallCoverage,
    },
    moduleStats,
    categoryStats,
    priorityStats,
  });
}
