import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

// POST /api/test-cases/bulk
// Body: { ids: string[], action: "assign" | "status" | "delete", value?: string }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ids, action, value } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }
  if (!action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (action === "delete") {
    // Admin only
    try { await requireAdmin(); }
    catch { return NextResponse.json({ error: "Forbidden — admin only for bulk delete" }, { status: 403 }); }

    const result = await db.testCase.deleteMany({ where: { id: { in: ids } } });
    await createAuditLog({
      userId: session.id,
      action: "test_case.bulk_delete",
      entityType: "TestCase",
      details: `Bulk deleted ${result.count} test cases`,
    });
    return NextResponse.json({ ok: true, affected: result.count });
  }

  if (action === "assign") {
    // Admin only
    try { await requireAdmin(); }
    catch { return NextResponse.json({ error: "Forbidden — admin only for bulk assign" }, { status: 403 }); }

    const testerId = value || null;
    const result = await db.testCase.updateMany({
      where: { id: { in: ids } },
      data: { assignedTesterId: testerId },
    });
    await createAuditLog({
      userId: session.id,
      action: "test_case.bulk_assign",
      entityType: "TestCase",
      details: `Bulk assigned ${result.count} test cases to ${testerId || "unassigned"}`,
    });
    return NextResponse.json({ ok: true, affected: result.count });
  }

  if (action === "status") {
    // Any authenticated user can change status (execute)
    const testerId = session.testerId;
    const testerName = session.name ?? undefined;

    // Update each test case + create execution records
    let count = 0;
    for (const id of ids) {
      const before = await db.testCase.findUnique({ where: { id }, select: { title: true, status: true } });
      if (!before) continue;
      await db.testCase.update({
        where: { id },
        data: {
          status: value,
          testerName,
          lastRunAt: new Date(),
        },
      });
      await db.testExecution.create({
        data: {
          testCaseId: id,
          status: value,
          executedBy: testerName ?? null,
          testerId: testerId ?? null,
        },
      });
      count++;
    }
    await createAuditLog({
      userId: session.id,
      action: "test_case.bulk_execute",
      entityType: "TestCase",
      details: `Bulk set ${count} test cases to status: ${value}`,
    });
    return NextResponse.json({ ok: true, affected: count });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
