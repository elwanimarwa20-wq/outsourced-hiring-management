import { getCurrentUser } from "@/lib/session";
import { storeFile, ALLOWED_IMAGE_TYPES } from "@/lib/uploads";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return new Response("No file", { status: 400 });
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return new Response("Only JPG or PNG images are allowed.", { status: 415 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return new Response("Image exceeds the 2MB limit.", { status: 413 });
  }
  const stored = await storeFile(file, "photos");
  return Response.json({ url: stored.url });
}
