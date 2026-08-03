import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const runs = await db.testRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
    include: {
      startedBy: { select: { name: true, color: true } },
      _count: { select: { executions: true } },
    },
  });
  return NextResponse.json({ runs });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const testerId = (session.user as any).testerId;
  const body = await req.json();
  const { name, description, environment } = body;
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const run = await db.testRun.create({
    data: {
      name,
      description,
      environment,
      startedById: testerId ?? null,
    },
  });
  await db.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: "test_run.create",
      entityType: "TestRun",
      entityId: run.id,
      details: `Started test run: ${name}`,
    },
  });
  return NextResponse.json({ run });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  const run = await db.testRun.update({
    where: { id },
    data: {
      status,
      completedAt: status === "completed" || status === "aborted" ? new Date() : null,
    },
  });
  return NextResponse.json({ run });
}
