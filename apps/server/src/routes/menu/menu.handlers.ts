import { OpenAPIHono } from "@hono/zod-openapi";
import { validatorParamsHook } from "../../common/validator";
import { getAuthenticatedUser } from "../../middlewares/auth";
import { assertPermission, isSystemAdmin } from "../../middlewares/rbac";
import { ForbiddenException } from "../../common/exception";
import * as routes from "./menu.routes";
import * as menuService from "../../service/menu.service";

export const route = new OpenAPIHono({
  defaultHook: (result, c) => validatorParamsHook(result, c),
});

route.openapi(routes.listMenus, async (c) => {
  const data = await menuService.listAllMenus();
  return c.json({ code: 0, message: "操作成功", data });
});

route.openapi(routes.createMenu, async (c) => {
  const body = c.req.valid("json");
  const user = getAuthenticatedUser(c);
  if ((body.menuType ?? 0) === 1 || body.auths !== undefined) {
    if (!isSystemAdmin(user)) {
      throw new ForbiddenException("只有管理员可以创建按钮权限");
    }
  }
  const permission =
    Number(body.parentId) > 0 ? "system-menu:add-child" : "system-menu:add";
  await assertPermission(user, permission);
  const data = await menuService.createMenu(body);
  return c.json({ code: 0, message: "操作成功", data });
});

route.openapi(routes.updateMenu, async (c) => {
  const body = c.req.valid("json");
  try {
    if (body.menuType !== undefined || body.auths !== undefined) {
      if (!isSystemAdmin(getAuthenticatedUser(c))) {
        throw new ForbiddenException("只有管理员可以修改按钮权限");
      }
    }
    await menuService.updateMenu(body);
    return c.json({ code: 0, message: "操作成功", data: {} });
  } catch (err: any) {
    return c.json(
      {
        code: err.code || 10001,
        message: err.message || "修改失败",
        data: err.data || {},
      },
      err.status || 400,
    );
  }
});

route.openapi(routes.deleteMenu, async (c) => {
  const body = c.req.valid("json");
  try {
    await menuService.deleteMenu(body.id);
    return c.json({ code: 0, message: "操作成功", data: {} });
  } catch (err: any) {
    return c.json(
      {
        code: err.code || 10001,
        message: err.message || "删除失败",
        data: err.data || {},
      },
      err.status || 400,
    );
  }
});

route.openapi(routes.getAsyncRoutes, async (c) => {
  const user = (c as any).get("user") as { roles: string[] };
  const data = await menuService.getAsyncRoutes(user.roles);
  return c.json({ code: 0, message: "操作成功", data });
});
