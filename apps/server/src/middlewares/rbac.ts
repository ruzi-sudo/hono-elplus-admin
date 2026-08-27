import type { Context, Next } from "hono";
import { and, eq } from "drizzle-orm";
import { ForbiddenException } from "../common/exception";
import { getDb } from "../db";
import { sysPages, sysRolePages, sysRoles, sysUserRoles } from "../db/schema";
import { getAuthenticatedUser, type AuthenticatedUser } from "./auth";

type PermissionResolver = string | ((c: Context) => string | Promise<string>);

function isAdmin(user: AuthenticatedUser): boolean {
  return user.roles.includes("admin");
}

export async function hasPageAccess(
  userId: number,
  pageName: string,
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
        eq(sysPages.name, pageName),
        eq(sysPages.menuType, 0),
        eq(sysPages.status, 1),
        eq(sysRoles.status, 1),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function hasPermission(
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

export function requirePageAccess(pageName: string) {
  return async (c: Context, next: Next) => {
    const user = getAuthenticatedUser(c);
    if (!isAdmin(user) && !(await hasPageAccess(user.userId, pageName))) {
      throw new ForbiddenException(`无权访问页面 ${pageName}`);
    }
    await next();
  };
}

export function requirePermission(requirement: PermissionResolver) {
  return async (c: Context, next: Next) => {
    const user = getAuthenticatedUser(c);
    const permission =
      typeof requirement === "function" ? await requirement(c) : requirement;
    if (!isAdmin(user) && !(await hasPermission(user.userId, permission))) {
      throw new ForbiddenException(`缺少接口权限 ${permission}`);
    }
    await next();
  };
}
