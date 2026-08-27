import { z } from "@hono/zod-openapi";

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.coerce.number().optional(),
);

export const ListRolesQuerySchema = z.object({
  name: z.string().optional().openapi({ example: "超级管理员" }),
  status: optionalNumber.openapi({ example: 1 }),
  code: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .openapi({ example: "admin" }),
  pageNum: z.coerce.number().positive().int().default(1),
  pageSize: z.coerce.number().positive().int().default(10),
});

export const RoleMenuIdsSchema = z.object({
  id: z.number().positive().int().openapi({ example: 1 }),
});

export const SaveRoleMenuSchema = z.object({
  id: z.number().positive().int().openapi({ example: 1 }),
  menuIds: z.array(z.number().positive().int()).max(5000),
  homePageId: z.number().positive().int().nullable().openapi({ example: 2 }),
});
