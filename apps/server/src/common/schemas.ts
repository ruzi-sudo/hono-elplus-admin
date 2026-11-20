import { z } from "@hono/zod-openapi";

export const ErrorResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({}).optional(),
});

export const ForbiddenResponse = {
  description: "无权执行此操作",
  content: { "application/json": { schema: ErrorResponseSchema } },
} as const;
