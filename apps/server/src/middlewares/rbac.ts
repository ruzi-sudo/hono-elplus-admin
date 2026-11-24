import type { Context, Next } from "hono";
import { and, eq } from "drizzle-orm";
import { ForbiddenException } from "../common/exception";
import { getDb } from "../db";
import {
  sysApiPermissions,
  sysPages,
  sysRoleApiPermissions,
  sysRolePages,
  sysRoles,
  sysUserRoles,
} from "../db/schema";
import { getAuthenticatedUser, type AuthenticatedUser } from "./auth";

export function isSystemAdmin(user: AuthenticatedUser): boolean {
  return user.roles.includes("admin");
}

export function assertSystemAdmin(user: AuthenticatedUser): void {
  if (!isSystemAdmin(user)) {
    throw new ForbiddenException("只有管理员可以执行此操作");
  }
}

export async function hasButtonPermission(
  userId: number,
  permission: string,
): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .select({ id: sysPages.id })
    .from(sysPages)
    .innerJoin(sysRolePages, eq(sysPages.id, sysRolePages.pageId))
    .innerJoin(sysUserRoles, eq(sysRolePages.roleId, sysUserRoles.roleId))
    .innerJoin(sysRoles, eq(sysRolePages.roleId, sysRoles.id))
    .where(
      and(
        eq(sysUserRoles.userId, userId),
        eq(sysPages.auths, permission),
        eq(sysPages.menuType, 1),
        eq(sysPages.status, 1),
        eq(sysRoles.status, 1),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function hasApiPermission(
  userId: number,
  method: string,
  path: string,
): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .select({ id: sysApiPermissions.id })
    .from(sysApiPermissions)
    .innerJoin(
      sysRoleApiPermissions,
      eq(sysApiPermissions.id, sysRoleApiPermissions.apiPermissionId),
    )
    .innerJoin(
      sysUserRoles,
      eq(sysRoleApiPermissions.roleId, sysUserRoles.roleId),
    )
    .innerJoin(sysRoles, eq(sysRoleApiPermissions.roleId, sysRoles.id))
    .where(
      and(
        eq(sysUserRoles.userId, userId),
        eq(sysApiPermissions.method, method),
        eq(sysApiPermissions.path, path),
        eq(sysApiPermissions.status, 1),
        eq(sysRoles.status, 1),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function assertButtonPermission(
  user: AuthenticatedUser,
  permission: string,
): Promise<void> {
  if (
    !isSystemAdmin(user) &&
    !(await hasButtonPermission(user.userId, permission))
  ) {
    throw new ForbiddenException(`缺少按钮权限 ${permission}`);
  }
}

export async function assertApiPermission(
  user: AuthenticatedUser,
  method: string,
  path: string,
): Promise<void> {
  if (
    !isSystemAdmin(user) &&
    !(await hasApiPermission(user.userId, method, path))
  ) {
    throw new ForbiddenException(`缺少接口权限 ${method} ${path}`);
  }
}

export function requireApiPermission() {
  return async (c: Context, next: Next) => {
    const user = getAuthenticatedUser(c);
    const method = c.req.method;
    const path = c.req.path.replace(/^\/api(?=\/|$)/, "") || "/";
    await assertApiPermission(user, method, path);
    await next();
  };
}
