import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

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
    console.error("Audit log creation failed:", e);
  }
}

export async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  email?: { to: string; subject: string; html: string; text?: string };
}) {
  try {
    await db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link,
      },
    });
  } catch (e) {
    console.error("Notification creation failed:", e);
  }

  // Also send email if provided
  if (params.email) {
    await sendEmail(params.email);
  }
}
