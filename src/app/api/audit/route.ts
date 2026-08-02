import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden — admin only" },
      { status: e.message === "UNAUTHORIZED" ? 401 : 403 }
    );
  }

  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
  const action = req.nextUrl.searchParams.get("action");
  const userId = req.nextUrl.searchParams.get("userId");

  const where: Record<string, unknown> = {};
  if (action) where.action = { contains: action };
  if (userId) where.userId = userId;

  const logs = await db.auditLog.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });
  return NextResponse.json({ logs });
}
