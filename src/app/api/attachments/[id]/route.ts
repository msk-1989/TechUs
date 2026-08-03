import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

// GET /api/attachments/[id] — stream/download the actual file content
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const attachment = await db.bugAttachment.findUnique({
    where: { id },
    select: {
      fileName: true,
      fileType: true,
      mimeType: true,
      fileSize: true,
      fileData: true,
      bugId: true,
    },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  // Convert base64 to binary
  const buffer = Buffer.from(attachment.fileData, "base64");

  // Return as a binary response with proper content type
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(attachment.fileSize),
      "Content-Disposition": `inline; filename="${attachment.fileName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

// DELETE /api/attachments/[id] — delete attachment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const attachment = await db.bugAttachment.findUnique({
    where: { id },
    select: { fileName: true, fileType: true, bugId: true },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  await db.bugAttachment.delete({ where: { id } });

  await createAuditLog({
    userId: session.id,
    action: "bug.attachment.delete",
    entityType: "BugAttachment",
    entityId: id,
    details: `Deleted ${attachment.fileType} "${attachment.fileName}" from bug ${attachment.bugId}`,
  });

  return NextResponse.json({ ok: true });
}
