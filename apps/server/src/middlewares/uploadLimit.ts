import type { Context, Next } from "hono";
import { ParamsException } from "../common/exception";
import { MAX_AVATAR_UPLOAD_BYTES } from "../service/upload.service";

const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export async function avatarUploadLimitMiddleware(c: Context, next: Next) {
  const contentLength = Number(c.req.header("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_AVATAR_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES
  ) {
    throw new ParamsException("头像文件不能超过 5 MB");
  }
  await next();
}
