import { OpenAPIHono } from '@hono/zod-openapi';
import { validatorParamsHook } from '../../common/validator';
import * as routes from './auth.routes';
import * as authService from '../../service/auth.service';
import { getClientIp } from '../../service/ip.service';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

function getErrorStatus(error: unknown): ContentfulStatusCode {
  if (!error || typeof error !== 'object') return 400;
  const candidate = 'statusCode' in error
    ? error.statusCode
    : 'status' in error
      ? error.status
      : undefined;
  return typeof candidate === 'number' && candidate >= 200 && candidate <= 599
    ? candidate as ContentfulStatusCode
    : 400;
}

export const route = new OpenAPIHono({
  defaultHook: (result, c) => validatorParamsHook(result, c),
});

route.openapi(routes.login, async (c) => {
  const body = c.req.valid('json');
  try {
    const data = await authService.login(body.username, body.password, c.req.raw, {
      ip: getClientIp(c),
      ua: c.req.header('user-agent') || '',
    });
    return c.json({ code: 0, message: '操作成功', data });
  } catch (err: any) {
    return c.json({ code: err.code || 10001, message: err.message, data: {} }, getErrorStatus(err));
  }
});

route.openapi(routes.register, async (c) => {
  const body = c.req.valid('json');
  try {
    const data = await authService.register(body.username, body.email, body.password, body.confirmPassword);
    return c.json({ code: 0, message: '注册成功', data });
  } catch (err: any) {
    return c.json({ code: err.code || 10001, message: err.message || '注册失败', data: {} }, getErrorStatus(err));
  }
});

route.openapi(routes.refreshToken, async (c) => {
  const body = c.req.valid('json');
  try {
    const data = await authService.refreshToken(body.refreshToken, c.req.raw);
    return c.json({ code: 0, message: '操作成功', data });
  } catch (err: any) {
    return c.json({ code: err.code || 10001, message: err.message, data: {} }, getErrorStatus(err));
  }
});
