import { db } from "@/lib/db";

export async function createAuditLog(params: {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
}) {
  try {
    await db.auditLog.create({ data: params });
  } catch (e) {
    // Audit log failure should never break the main flow
    console.error("Audit log creation failed:", e);
  }
}

export async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    await db.notification.create({ data: params });
  } catch (e) {
    console.error("Notification creation failed:", e);
  }
}
