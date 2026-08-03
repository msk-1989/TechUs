import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

// GET /api/suites — list all suites (optional: ?moduleId=xxx)
export async function GET(req: NextRequest) {
  const moduleId = req.nextUrl.searchParams.get("moduleId");
  const where: Record<string, unknown> = {};
  if (moduleId) where.moduleId = moduleId;

  const suites = await db.testSuite.findMany({
    where,
    orderBy: { order: "asc" },
    include: {
      module: true,
      _count: { select: { testCases: true } },
    },
  });
  return NextResponse.json({ suites });
}

// POST /api/suites — create a new suite (admin only)
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
  const { moduleId, name, description, order } = body;

  if (!moduleId || !name) {
    return NextResponse.json({ error: "moduleId and name are required" }, { status: 400 });
  }

  // Verify module exists
  const mod = await db.module.findUnique({ where: { id: moduleId } });
  if (!mod) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  const maxOrder = await db.testSuite.aggregate({
    where: { moduleId },
    _max: { order: true },
  });

  const suite = await db.testSuite.create({
    data: {
      moduleId,
      name,
      description: description || null,
      order: order ?? (maxOrder._max.order ?? 0) + 1,
    },
    include: { module: true },
  });

  await createAuditLog({
    userId: session.id,
    action: "suite.create",
    entityType: "TestSuite",
    entityId: suite.id,
    details: `Created suite: "${name}" in module "${mod.name}"`,
  });

  return NextResponse.json({ suite }, { status: 201 });
}
