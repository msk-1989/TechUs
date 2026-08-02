import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/permissions";

// Public activity feed — any authenticated user can see recent team actions
// (limited to action, details, timestamp, user name — no sensitive data)
export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await db.auditLog.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true },
      },
    },
  });

  // Sanitize — only expose safe fields
  const activity = logs.map((l) => ({
    id: l.id,
    action: l.action,
    details: l.details,
    userName: l.user?.name ?? "System",
    createdAt: l.createdAt,
  }));

  return NextResponse.json({ activity });
}
