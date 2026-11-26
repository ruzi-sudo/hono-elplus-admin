import { z } from "@hono/zod-openapi";

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.coerce.number().optional(),
);

export const ListUsersQuerySchema = z.object({
  username: z.string().optional().openapi({ example: "admin" }),
  status: optionalNumber.openapi({ example: 1 }),
  email: z
    .string()
    .optional()
    .nullable()
    .openapi({ example: "admin@pureadmin.cn" }),
  sortBy: z.enum(["createTime"]).optional().openapi({ example: "createTime" }),
  sortOrder: z.enum(["asc", "desc"]).optional().openapi({ example: "desc" }),
  pageNum: z.coerce.number().positive().int().default(1),
  pageSize: z.coerce.number().positive().int().default(10),
});
