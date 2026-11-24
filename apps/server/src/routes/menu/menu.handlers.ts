import { OpenAPIHono } from "@hono/zod-openapi";
import { validatorParamsHook } from "../../common/validator";
import { getAuthenticatedUser } from "../../middlewares/auth";
import { isSystemAdmin } from "../../middlewares/rbac";
import { ForbiddenException } from "../../common/exception";
import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { sysPages } from "../../db/schema";
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
  if (
    !isSystemAdmin(getAuthenticatedUser(c)) &&
    (body.menuType !== 0 || body.auths)
  ) {
    throw new ForbiddenException("只有管理员可以创建按钮权限");
  }
  const data = await menuService.createMenu(body);
  return c.json({ code: 0, message: "操作成功", data });
});

route.openapi(routes.updateMenu, async (c) => {
  const body = c.req.valid("json");
  try {
    if (!isSystemAdmin(getAuthenticatedUser(c))) {
      const db = await getDb();
      const [existing] = await db
        .select({ menuType: sysPages.menuType, auths: sysPages.auths })
        .from(sysPages)
        .where(eq(sysPages.id, body.id))
        .limit(1);
      if (
        existing?.menuType === 1 ||
        existing?.auths ||
        (body.menuType !== undefined && body.menuType !== 0) ||
        body.auths
      ) {
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
    if (!isSystemAdmin(getAuthenticatedUser(c))) {
      const menus = await menuService.listAllMenus();
      const byId = new Map(menus.map((menu) => [menu.id, menu]));
      for (const menu of menus) {
        if (menu.menuType !== 1 && !menu.auths) continue;
        const seen = new Set<number>();
        let current: typeof menu | undefined = menu;
        while (current && !seen.has(current.id)) {
          if (current.id === body.id) {
            throw new ForbiddenException("只有管理员可以删除按钮权限");
          }
          seen.add(current.id);
          current = byId.get(current.parentId);
        }
      }
    }
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
