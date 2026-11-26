import { z } from "@hono/zod-openapi";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../../auth";

export const UpdateMineSchema = z.object({
  username: z.string().min(2).max(64).optional(),
  email: z.string().email().max(128).optional(),
  remark: z.string().max(255).optional(),
});

export const ResetMinePasswordSchema = z.object({
  currentPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});
