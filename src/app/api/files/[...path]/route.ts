import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { uploadRoot } from "@/lib/uploads";
import { getCurrentUser } from "@/lib/session";

// Serves stored uploads. Auth-gated; path traversal is blocked by resolving
// against the upload root and rejecting anything that escapes it.
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { path: parts } = await ctx.params;
  const rel = parts.join("/");
  const abs = path.resolve(uploadRoot(), rel);
  if (!abs.startsWith(path.resolve(uploadRoot()))) {
    return new Response("Forbidden", { status: 403 });
  }
  try {
    await stat(abs);
    const buf = await readFile(abs);
    const ext = path.extname(abs).toLowerCase();
    const type =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : "application/octet-stream";
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": type } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
