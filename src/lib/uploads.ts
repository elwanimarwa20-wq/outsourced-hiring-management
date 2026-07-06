import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Prototype file store: writes to a local uploads dir served via an API route.
// In production this is replaced by the document repository / object storage
// specified in the SAD (OCI Object Storage or S3-compatible bucket).
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");

export const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];

export async function storeFile(
  file: File,
  subdir: string,
): Promise<{ filePath: string; fileName: string; fileSize: number; mimeType: string; url: string }> {
  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const stored = `${randomUUID()}${ext}`;
  const abs = path.join(dir, stored);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(abs, buf);
  return {
    filePath: abs,
    fileName: file.name,
    fileSize: buf.length,
    mimeType: file.type,
    url: `/api/files/${subdir}/${stored}`,
  };
}

export function uploadRoot() {
  return UPLOAD_ROOT;
}
