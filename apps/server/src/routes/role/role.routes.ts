import { createRoute, z } from "@hono/zod-openapi";
import {
  CreateApiPermissionSchema,
  ListRolesQuerySchema,
  RoleMenuIdsSchema,
  SaveRoleMenuSchema,
  SaveRoleApiPermissionsSchema,
  UpdateApiPermissionSchema,
} from "./role.schemas";
import { ErrorResponseSchema, ForbiddenResponse } from "../../common/schemas";

export const listRoles = createRoute({
  method: "post",
  path: "/role",
  tags: ["role"],
  request: {
    body: { content: { "application/json": { schema: ListRolesQuerySchema } } },
  },
  responses: {
    "200": { description: "角色列表" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "403": ForbiddenResponse,
  },
});

export const createRole = createRoute({
  method: "post",
  path: "/role/create",
  tags: ["role"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().min(1).max(64),
            code: z.string().min(1).max(64),
            status: z.coerce.number().optional(),
            remark: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    "200": { description: "创建成功" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "403": ForbiddenResponse,
  },
});

export const updateRole = createRoute({
  method: "post",
  path: "/role/update",
  tags: ["role"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.number(),
            name: z.string().min(1).max(64).optional(),
            code: z.string().min(1).max(64).optional(),
            status: z.coerce.number().optional(),
            remark: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    "200": { description: "修改成功" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "403": ForbiddenResponse,
  },
});

export const deleteRole = createRoute({
  method: "post",
  path: "/role/delete",
  tags: ["role"],
  request: {
    body: {
      content: { "application/json": { schema: z.object({ id: z.number() }) } },
    },
  },
  responses: {
    "200": { description: "删除成功" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "403": ForbiddenResponse,
  },
});

export const saveRoleMenu = createRoute({
  method: "post",
  path: "/role/save-menu",
  tags: ["role"],
  request: {
    body: { content: { "application/json": { schema: SaveRoleMenuSchema } } },
  },
  responses: {
    "200": { description: "保存成功" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "403": ForbiddenResponse,
  },
});

export const roleMenu = createRoute({
  method: "post",
  path: "/role-menu",
  tags: ["role"],
  responses: {
    "200": { description: "菜单权限树" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "403": ForbiddenResponse,
  },
});

export const roleMenuIds = createRoute({
  method: "post",
  path: "/role-menu-ids",
  tags: ["role"],
  request: {
    body: { content: { "application/json": { schema: RoleMenuIdsSchema } } },
  },
  responses: {
    "200": { description: "角色已分配的菜单ID" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "403": ForbiddenResponse,
  },
});

export const listApiPermissions = createRoute({
  method: "get",
  path: "/role-api-permissions",
  tags: ["role"],
  responses: {
    "200": { description: "接口权限列表" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "403": ForbiddenResponse,
  },
});

export const getRolePermissions = createRoute({
  method: "post",
  path: "/role-permissions",
  tags: ["role"],
  request: {
    body: { content: { "application/json": { schema: RoleMenuIdsSchema } } },
  },
  responses: {
    "200": { description: "角色权限" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "403": ForbiddenResponse,
  },
});

export const saveRoleApiPermissions = createRoute({
  method: "post",
  path: "/role/save-api-permissions",
  tags: ["role"],
  request: {
    body: {
      content: {
        "application/json": { schema: SaveRoleApiPermissionsSchema },
      },
    },
  },
  responses: {
    "200": { description: "保存角色接口权限成功" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "403": ForbiddenResponse,
  },
});

export const createApiPermission = createRoute({
  method: "post",
  path: "/role-api-permissions/create",
  tags: ["role"],
  request: {
    body: {
      content: { "application/json": { schema: CreateApiPermissionSchema } },
    },
  },
  responses: {
    "200": { description: "创建接口权限成功" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "403": ForbiddenResponse,
  },
});

export const updateApiPermission = createRoute({
  method: "post",
  path: "/role-api-permissions/update",
  tags: ["role"],
  request: {
    body: {
      content: { "application/json": { schema: UpdateApiPermissionSchema } },
    },
  },
  responses: {
    "200": { description: "更新接口权限成功" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "403": ForbiddenResponse,
  },
});
