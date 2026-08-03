import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

// GET /api/modules — list all modules with suites and test cases
export async function GET() {
  const modules = await db.module.findMany({
    orderBy: { order: "asc" },
    include: {
      suites: {
        orderBy: { order: "asc" },
        include: {
          testCases: {
            orderBy: { createdAt: "asc" },
            include: { bugs: true },
          },
        },
      },
    },
  });
  return NextResponse.json({ modules });
}

// POST /api/modules — create a new module (admin only)
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
  const { key, name, description, icon, order } = body;

  if (!name || !key) {
    return NextResponse.json({ error: "name and key are required" }, { status: 400 });
  }

  // Check key uniqueness
  const existing = await db.module.findUnique({ where: { key } });
  if (existing) {
    return NextResponse.json({ error: "Module key already exists" }, { status: 409 });
  }

  const maxOrder = await db.module.aggregate({ _max: { order: true } });
  const newModule = await db.module.create({
    data: {
      key,
      name,
      description: description || null,
      icon: icon || "Globe",
      order: order ?? (maxOrder._max.order ?? 0) + 1,
    },
  });

  await createAuditLog({
    userId: session.id,
    action: "module.create",
    entityType: "Module",
    entityId: newModule.id,
    details: `Created module: ${name} (key: ${key})`,
  });

  return NextResponse.json({ module: newModule }, { status: 201 });
}
