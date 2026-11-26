import { OpenAPIHono } from "@hono/zod-openapi";
import { validatorParamsHook } from "../../common/validator";
import * as routes from "./role.routes";
import * as roleService from "../../service/role.service";
import * as menuService from "../../service/menu.service";
import { getAuthenticatedUser } from "../../middlewares/auth";
import { assertSystemAdmin } from "../../middlewares/rbac";

export const route = new OpenAPIHono({
  defaultHook: (result, c) => validatorParamsHook(result, c),
});

route.openapi(routes.listRoles, async (c) => {
  const body = c.req.valid("json");
  const data = await roleService.listRoles({
    name: body.name,
    status: body.status,
    code: body.code,
    sortBy: body.sortBy,
    sortOrder: body.sortOrder,
    pageNum: body.pageNum,
    pageSize: body.pageSize,
  });
  return c.json({ code: 0, message: "操作成功", data });
});

route.openapi(routes.createRole, async (c) => {
  const body = c.req.valid("json") as {
    name: string;
    code: string;
    status?: number;
    remark?: string;
  };
  try {
    const data = await roleService.createRole(body);
    return c.json({ code: 0, message: "操作成功", data });
  } catch (err: any) {
    return c.json(
      { code: err.code || 10001, message: err.message || "创建失败", data: {} },
      err.status || 400,
    );
  }
});

route.openapi(routes.updateRole, async (c) => {
  const body = c.req.valid("json") as {
    id: number;
    name?: string;
    code?: string;
    status?: number;
    remark?: string;
  };
  try {
    await roleService.updateRole(body, getAuthenticatedUser(c));
    return c.json({ code: 0, message: "操作成功", data: {} });
  } catch (err: any) {
    return c.json(
      { code: err.code || 10001, message: err.message || "修改失败", data: {} },
      err.status || 400,
    );
  }
});

route.openapi(routes.deleteRole, async (c) => {
  const body = c.req.valid("json");
  try {
    await roleService.deleteRole(body.id);
    return c.json({ code: 0, message: "操作成功", data: {} });
  } catch (err: any) {
    return c.json(
      { code: err.code || 10001, message: err.message || "删除失败", data: {} },
      err.status || 400,
    );
  }
});

route.openapi(routes.saveRoleMenu, async (c) => {
  const body = c.req.valid("json");
  try {
    await roleService.saveRoleMenu(
      body.id,
      body.menuIds,
      body.homePageId,
      getAuthenticatedUser(c),
    );
    return c.json({ code: 0, message: "操作成功", data: {} });
  } catch (err: any) {
    return c.json(
      { code: err.code || 10001, message: err.message || "保存失败", data: {} },
      err.status || 400,
    );
  }
});

route.openapi(routes.listApiPermissions, async (c) => {
  const data = await roleService.listApiPermissions(getAuthenticatedUser(c));
  return c.json({ code: 0, message: "操作成功", data });
});

route.openapi(routes.listApiPermissionRoles, async (c) => {
  const data = await roleService.listApiPermissionRoles();
  return c.json({ code: 0, message: "操作成功", data }, 200);
});

route.openapi(routes.getRoleApiPermissionIds, async (c) => {
  const body = c.req.valid("json");
  const data = await roleService.getRoleApiPermissionIds(body.id);
  return c.json({ code: 0, message: "操作成功", data });
});

route.openapi(routes.createApiPermission, async (c) => {
  assertSystemAdmin(getAuthenticatedUser(c));
  const body = c.req.valid("json") as Parameters<typeof roleService.createApiPermission>[0];
  try {
    const data = await roleService.createApiPermission(body);
    return c.json({ code: 0, message: "操作成功", data });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("创建失败");
    return c.json({ code: 10001, message: error.message, data: {} }, 400);
  }
});

route.openapi(routes.updateApiPermission, async (c) => {
  assertSystemAdmin(getAuthenticatedUser(c));
  const body = c.req.valid("json") as Parameters<typeof roleService.updateApiPermission>[0];
  try {
    await roleService.updateApiPermission(body);
    return c.json({ code: 0, message: "操作成功", data: {} });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("更新失败");
    return c.json({ code: 10001, message: error.message, data: {} }, 400);
  }
});

route.openapi(routes.saveRoleApiPermissions, async (c) => {
  const body = c.req.valid("json");
  try {
    await roleService.saveRoleApiPermissions(
      body.id,
      body.apiPermissionIds,
      getAuthenticatedUser(c),
    );
    return c.json({ code: 0, message: "操作成功", data: {} });
  } catch (err: any) {
    return c.json(
      { code: err.code || 10001, message: err.message || "保存失败", data: {} },
      err.status || 400,
    );
  }
});

route.openapi(routes.roleMenu, async (c) => {
  const data = await menuService.getRoleMenuTree();
  return c.json({ code: 0, message: "操作成功", data });
});

route.openapi(routes.roleMenuIds, async (c) => {
  const body = c.req.valid("json");
  const data = await roleService.getRoleMenuIds(body.id);
  return c.json({ code: 0, message: "操作成功", data });
});
