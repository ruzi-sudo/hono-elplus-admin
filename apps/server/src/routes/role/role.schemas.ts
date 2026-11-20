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

export const SaveRolePermissionsSchema = z.object({
  id: z.number().positive().int().openapi({ example: 1 }),
  menuIds: z.array(z.number().positive().int()).max(5000),
  apiPermissionIds: z.array(z.number().positive().int()).max(5000),
  homePageId: z.number().positive().int().nullable().openapi({ example: 2 }),
});

export const ApiPermissionSchema = z.object({
  id: z.number().positive().int().optional(),
  code: z.string().min(1).max(128),
  name: z.string().min(1).max(128),
  module: z.string().min(1).max(64),
  method: z.string().min(1).max(16),
  path: z.string().min(1).max(255),
  description: z.string().max(255).optional(),
  sort: z.coerce.number().int().optional(),
  status: z.coerce.number().int().optional(),
});

export const CreateApiPermissionSchema = ApiPermissionSchema.omit({ id: true, status: true });

export const UpdateApiPermissionSchema = ApiPermissionSchema.partial().extend({
  id: z.number().positive().int(),
});
