import { withRlsContext } from "@/lib/db";
import { getCurrentUser, rlsContext } from "@/lib/session";
import { storeFile, ALLOWED_ATTACHMENT_TYPES } from "@/lib/uploads";
import type { AttachmentSlot } from "@/generated/prisma/enums";

const SLOTS: AttachmentSlot[] = ["CV", "QUOTATION", "PASSPORT", "EMPLOYEE_ID"];

// Upload or replace an attachment in a fixed slot. Replacing bumps versionNo.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id: formId } = await ctx.params;

  const form = await req.formData();
  const slot = String(form.get("slot") ?? "") as AttachmentSlot;
  const file = form.get("file");
  if (!SLOTS.includes(slot)) return new Response("Invalid slot", { status: 400 });
  if (!(file instanceof File)) return new Response("No file", { status: 400 });
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    return new Response("Unsupported file type.", { status: 415 });
  }

  const stored = await storeFile(file, `attachments/${formId}`);

  const record = await withRlsContext(rlsContext(user), async (tx) => {
    const existing = await tx.formAttachment.findFirst({
      where: { formId, slot },
      orderBy: { versionNo: "desc" },
    });
    const versionNo = existing ? existing.versionNo + 1 : 1;
    if (existing) {
      await tx.formAttachment.deleteMany({ where: { formId, slot } });
    }
    const created = await tx.formAttachment.create({
      data: {
        formId,
        slot,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        filePath: stored.url,
        fileSize: stored.fileSize,
        versionNo,
        uploadedById: user.id,
      },
    });
    await tx.formAuditLog.create({
      data: {
        formId,
        action: existing ? "ATTACHMENT_REPLACE" : "ATTACHMENT_ADD",
        actedById: user.id,
        newValue: `${slot}: ${stored.fileName}`,
      },
    });
    return created;
  });

  return Response.json({
    id: record.id,
    slot: record.slot,
    fileName: record.fileName,
    fileSize: record.fileSize,
    url: record.filePath,
    versionNo: record.versionNo,
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id: formId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const slot = String(searchParams.get("slot") ?? "") as AttachmentSlot;
  if (!SLOTS.includes(slot)) return new Response("Invalid slot", { status: 400 });

  await withRlsContext(rlsContext(user), async (tx) => {
    await tx.formAttachment.deleteMany({ where: { formId, slot } });
    await tx.formAuditLog.create({
      data: { formId, action: "ATTACHMENT_REMOVE", actedById: user.id, newValue: slot },
    });
  });
  return new Response(null, { status: 204 });
}
