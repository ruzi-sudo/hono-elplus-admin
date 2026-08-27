import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { ParamsException } from "../common/exception";

export async function saveAvatar(file: File): Promise<string> {
  const ext = extname(file.name || "").toLowerCase() || ".png";
  const allowedExts = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
  if (!allowedExts.has(ext)) {
    throw new ParamsException("仅支持 jpg、png、webp、gif 图片");
  }

  const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadDir, { recursive: true });
  const filename = `${Date.now()}-${randomUUID()}${ext}`;
  const filepath = join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  return `/api/uploads/avatars/${filename}`;
}
