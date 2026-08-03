import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

// File size limits (in bytes)
const MAX_IMAGE = 3 * 1024 * 1024; // 3MB
const MAX_VIDEO = 8 * 1024 * 1024; // 8MB
const MAX_AUDIO = 2 * 1024 * 1024; // 2MB

function getFileType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "other";
}

function getMaxSize(fileType: string): number {
  if (fileType === "image") return MAX_IMAGE;
  if (fileType === "video") return MAX_VIDEO;
  if (fileType === "audio") return MAX_AUDIO;
  return MAX_IMAGE; // default to image limit
}

// GET /api/bugs/[id]/attachments — list attachments for a bug
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const attachments = await db.bugAttachment.findMany({
    where: { bugId: id },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { name: true } },
    },
  });

  // Return metadata WITHOUT the base64 fileData (too large for list view)
  const sanitized = attachments.map((a) => ({
    id: a.id,
    bugId: a.bugId,
    fileName: a.fileName,
    fileType: a.fileType,
    mimeType: a.mimeType,
    fileSize: a.fileSize,
    uploadedBy: a.uploadedBy?.name ?? "Unknown",
    createdAt: a.createdAt,
  }));

  return NextResponse.json({ attachments: sanitized });
}

// POST /api/bugs/[id]/attachments — upload attachment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  // Verify the bug exists
  const bug = await db.bug.findUnique({ where: { id }, select: { title: true } });
  if (!bug) {
    return NextResponse.json({ error: "Bug not found" }, { status: 404 });
  }

  // Parse multipart form data
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const fileName = (formData.get("fileName") as string) || file?.name || "attachment";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const fileType = getFileType(file.type);
  if (fileType === "other") {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Only images, videos, and audio files are allowed.` },
      { status: 400 }
    );
  }

  const maxSize = getMaxSize(fileType);
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    return NextResponse.json(
      { error: `File too large: ${fileMB}MB. Max for ${fileType}: ${maxMB}MB` },
      { status: 413 }
    );
  }

  // Convert to base64
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Data = buffer.toString("base64");

  // Store in database
  const attachment = await db.bugAttachment.create({
    data: {
      bugId: id,
      fileName,
      fileType,
      mimeType: file.type,
      fileSize: file.size,
      fileData: base64Data,
      uploadedById: session.id,
    },
  });

  await createAuditLog({
    userId: session.id,
    action: "bug.attachment.upload",
    entityType: "BugAttachment",
    entityId: attachment.id,
    details: `Uploaded ${fileType} "${fileName}" (${(file.size / 1024).toFixed(0)}KB) to bug: "${bug.title}"`,
  });

  return NextResponse.json({
    attachment: {
      id: attachment.id,
      bugId: attachment.bugId,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      createdAt: attachment.createdAt,
    },
  }, { status: 201 });
}
