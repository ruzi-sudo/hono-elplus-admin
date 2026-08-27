import { OpenAPIHono } from '@hono/zod-openapi';
import { validatorParamsHook } from '../../common/validator';
import * as routes from './menu.routes';
import * as menuService from '../../service/menu.service';

export const route = new OpenAPIHono({
  defaultHook: (result, c) => validatorParamsHook(result, c),
});

route.openapi(routes.listMenus, async (c) => {
  const data = await menuService.listAllMenus();
  return c.json({ code: 0, message: '操作成功', data });
});

route.openapi(routes.createMenu, async (c) => {
  const body = c.req.valid('json');
  const data = await menuService.createMenu(body);
  return c.json({ code: 0, message: '操作成功', data });
});

route.openapi(routes.updateMenu, async (c) => {
  const body = c.req.valid('json');
  try {
    await menuService.updateMenu(body);
    return c.json({ code: 0, message: '操作成功', data: {} });
  } catch (err: any) {
    return c.json(
      {
        code: err.code || 10001,
        message: err.message || '修改失败',
        data: err.data || {},
      },
      err.status || 400,
    );
  }
});

route.openapi(routes.deleteMenu, async (c) => {
  const body = c.req.valid('json');
  try {
    await menuService.deleteMenu(body.id);
    return c.json({ code: 0, message: '操作成功', data: {} });
  } catch (err: any) {
    return c.json(
      {
        code: err.code || 10001,
        message: err.message || '删除失败',
        data: err.data || {},
      },
      err.status || 400,
    );
  }
});

route.openapi(routes.getAsyncRoutes, async (c) => {
  const user = (c as any).get('user') as { roles: string[] };
  const data = await menuService.getAsyncRoutes(user.roles);
  return c.json({ code: 0, message: '操作成功', data });
});
