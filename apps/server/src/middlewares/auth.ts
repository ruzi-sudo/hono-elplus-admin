import type { Context, Next } from "hono";
import { and, asc, eq } from "drizzle-orm";
import { getAuth } from "../auth";
import { UnauthorizedException } from "../common/exception";
import { getDb } from "../db";
import { sysRoles, sysUserRoles, sysUsers } from "../db/schema";
import { isAccessTokenOnline } from "../service/redis.service";

export interface AuthenticatedUser {
  userId: number;
  username: string;
  roles: string[];
  authUserId: string;
  sessionId: string;
}

export function getAuthenticatedUser(c: Context): AuthenticatedUser {
  const user = c.get("user") as AuthenticatedUser | undefined;
  if (!user) throw new UnauthorizedException();
  return user;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedException();
  }

  const token = authHeader.slice(7).trim();
  if (!token || !(await isAccessTokenOnline(token))) {
    throw new UnauthorizedException("登录状态已过期，请重新登录");
  }

  try {
    const auth = await getAuth();
    const authSession = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (!authSession) {
      throw new UnauthorizedException("登录状态已过期，请重新登录");
    }

    const legacyUserId = Number(authSession.user.legacyUserId);
    if (!Number.isSafeInteger(legacyUserId) || legacyUserId <= 0) {
      throw new UnauthorizedException("登录账号未关联业务用户");
    }

    const db = await getDb();
    const [businessUser] = await db
      .select({
        id: sysUsers.id,
        username: sysUsers.username,
        status: sysUsers.status,
      })
      .from(sysUsers)
      .where(eq(sysUsers.id, legacyUserId))
      .limit(1);

    if (!businessUser || businessUser.status !== 1) {
      throw new UnauthorizedException("账号不存在或已停用");
    }

    const roleRows = await db
      .select({ code: sysRoles.code })
      .from(sysRoles)
      .innerJoin(sysUserRoles, eq(sysRoles.id, sysUserRoles.roleId))
      .where(
        and(eq(sysUserRoles.userId, businessUser.id), eq(sysRoles.status, 1)),
      )
      .orderBy(asc(sysRoles.id));

    const user: AuthenticatedUser = {
      userId: businessUser.id,
      username: businessUser.username,
      roles: roleRows.map((role) => role.code),
      authUserId: authSession.user.id,
      sessionId: authSession.session.id,
    };

    c.set("user", user);
    c.set("authSession", authSession.session);
  } catch (error) {
    if (error instanceof UnauthorizedException) throw error;
    throw new UnauthorizedException("登录状态已过期，请重新登录");
  }

  await next();
}
