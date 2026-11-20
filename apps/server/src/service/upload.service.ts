import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { ParamsException } from "../common/exception";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const DEFAULT_EXTENSION = ".png";
const PUBLIC_PATH = "/api/uploads/avatars";
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "avatars");
export const MAX_AVATAR_UPLOAD_BYTES = 5 * 1024 * 1024;

type ImageFormat = "jpeg" | "png" | "webp" | "gif";

function detectImageFormat(buffer: Buffer): ImageFormat | null {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return "png";
  }
  if (
    buffer.length >= 3 &&
    buffer[0] === 255 &&
    buffer[1] === 216 &&
    buffer[2] === 255
  ) {
    return "jpeg";
  }
  if (
    buffer.length >= 6 &&
    (buffer.subarray(0, 6).equals(Buffer.from("GIF87a")) ||
      buffer.subarray(0, 6).equals(Buffer.from("GIF89a")))
  ) {
    return "gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).equals(Buffer.from("RIFF")) &&
    buffer.subarray(8, 12).equals(Buffer.from("WEBP"))
  ) {
    return "webp";
  }
  return null;
}

function isExtensionCompatible(ext: string, format: ImageFormat): boolean {
  return (
    (format === "jpeg" && [".jpg", ".jpeg"].includes(ext)) ||
    (format === "png" && ext === ".png") ||
    (format === "webp" && ext === ".webp") ||
    (format === "gif" && ext === ".gif")
  );
}

export async function saveAvatar(file: File): Promise<string> {
  const ext = extname(file.name || "").toLowerCase() || DEFAULT_EXTENSION;
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new ParamsException("仅支持 jpg、jpeg、png、webp、gif 文件");
  }

  if (file.size === 0 || file.size > MAX_AVATAR_UPLOAD_BYTES) {
    throw new ParamsException("头像文件不能超过 5 MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const format = detectImageFormat(buffer);
  if (!format || !isExtensionCompatible(ext, format)) {
    throw new ParamsException("头像文件内容与扩展名不匹配");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${randomUUID()}${ext}`;
  const filepath = join(UPLOAD_DIR, filename);
  await writeFile(filepath, buffer);

  return `${PUBLIC_PATH}/${filename}`;
}
