import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const onlyUnread = req.nextUrl.searchParams.get("unread") === "true";
  const notifications = await db.notification.findMany({
    where: { userId, ...(onlyUnread ? { read: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await db.notification.count({
    where: { userId, read: false },
  });
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, read, markAllRead } = body;
  const userId = (session.user as any).id;

  if (markAllRead) {
    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }
  if (id) {
    await db.notification.update({
      where: { id },
      data: { read: read ?? true },
    });
  }
  return NextResponse.json({ ok: true });
}
