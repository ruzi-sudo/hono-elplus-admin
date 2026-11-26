import { z } from '@hono/zod-openapi';

const optionalNumber = z.preprocess(
  v => (v === '' || v === null || v === undefined ? undefined : Number(v)),
  z.coerce.number().optional()
);

const ListQueryBaseSchema = {
  username: z.string().optional(),
  status: optionalNumber,
  module: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().openapi({ example: "desc" }),
  pageNum: z.coerce.number().positive().int().default(1),
  pageSize: z.coerce.number().positive().int().default(10),
};

export const OnlineListQuerySchema = z.object({
  ...ListQueryBaseSchema,
  sortBy: z.enum(["loginTime"]).optional().openapi({ example: "loginTime" }),
});

export const LoginListQuerySchema = z.object({
  ...ListQueryBaseSchema,
  sortBy: z.enum(["loginTime"]).optional().openapi({ example: "loginTime" }),
});

export const SystemListQuerySchema = z.object({
  ...ListQueryBaseSchema,
  sortBy: z.enum(["requestTime"]).optional().openapi({ example: "requestTime" }),
});

export const DetailQuerySchema = z.object({
  id: z.number().openapi({ example: 1 }),
});
