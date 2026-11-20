import { eq, like, and, count, desc, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb } from "../db";
import {
  sysRoles,
  sysUserRoles,
  sysRolePages,
  sysUsers,
  sysPages,
} from "../db/schema";
import { ForbiddenException, ParamsException } from "../common/exception";
import type { AuthenticatedUser } from "../middlewares/auth";

const PROTECTED_ROLE_CODES = new Set(["admin", "common"]);

function isSystemAdmin(user: AuthenticatedUser): boolean {
  return user.roles.includes("admin");
}

function assertMutableRole(code: string): void {
  if (PROTECTED_ROLE_CODES.has(code)) {
    throw new ParamsException("系统内置角色不允许修改");
  }
}

async function getUserPageIds(userId: number): Promise<Set<number>> {
  const db = await getDb();
  const rows = await db
    .select({ pageId: sysRolePages.pageId })
    .from(sysRolePages)
    .innerJoin(sysUserRoles, eq(sysRolePages.roleId, sysUserRoles.roleId))
    .innerJoin(sysRoles, eq(sysRolePages.roleId, sysRoles.id))
    .innerJoin(sysPages, eq(sysRolePages.pageId, sysPages.id))
    .where(
      and(
        eq(sysUserRoles.userId, userId),
        eq(sysRoles.status, 1),
        eq(sysPages.status, 1),
      ),
    );
  return new Set(rows.map((row) => row.pageId));
}

export async function assertRolesAssignable(
  user: AuthenticatedUser,
  roleIds: number[],
): Promise<void> {
  const uniqueRoleIds = [...new Set(roleIds)];
  if (uniqueRoleIds.length === 0) return;

  const db = await getDb();
  const roles = await db
    .select({ id: sysRoles.id, code: sysRoles.code })
    .from(sysRoles)
    .where(inArray(sysRoles.id, uniqueRoleIds));
  if (roles.length !== uniqueRoleIds.length) {
    throw new ParamsException("角色不存在");
  }
  if (isSystemAdmin(user)) return;
  if (roles.some((role) => PROTECTED_ROLE_CODES.has(role.code))) {
    throw new ForbiddenException("无权分配系统内置角色");
  }

  const [targetPageRows, allowedPageIds] = await Promise.all([
    db
      .select({ pageId: sysRolePages.pageId })
      .from(sysRolePages)
      .where(inArray(sysRolePages.roleId, uniqueRoleIds)),
    getUserPageIds(user.userId),
  ]);

  if (targetPageRows.some((row) => !allowedPageIds.has(row.pageId))) {
    throw new ForbiddenException("只能分配自身已有权限范围内的角色");
  }
}

export async function listAllRoles() {
  const db = await getDb();
  const roles = await db
    .select({ id: sysRoles.id, name: sysRoles.name })
    .from(sysRoles)
    .orderBy(desc(sysRoles.id));
  return roles;
}

export async function getRoleIdsByUserId(userId: number) {
  const db = await getDb();
  const rows = await db
    .select({ roleId: sysUserRoles.roleId })
    .from(sysUserRoles)
    .where(eq(sysUserRoles.userId, userId));
  return rows.map((r) => r.roleId);
}

export async function getRolePermission(roleId: number) {
  const db = await getDb();
  const [role] = await db
    .select({ homePageId: sysRoles.homePageId })
    .from(sysRoles)
    .where(eq(sysRoles.id, roleId))
    .limit(1);
  if (!role) {
    throw { code: 10003, message: "角色不存在", status: 404 };
  }

  const rows = await db
    .select({ pageId: sysRolePages.pageId })
    .from(sysRolePages)
    .where(eq(sysRolePages.roleId, roleId));

  return {
    menuIds: rows.map((row) => row.pageId),
    homePageId: role.homePageId ?? null,
  };
}

export async function listRoles(params: {
  name?: string;
  status?: number;
  code?: string | string[];
  pageNum: number;
  pageSize: number;
}) {
  const db = await getDb();
  const { pageNum, pageSize } = params;

  const conditions = [];
  if (params.name) conditions.push(like(sysRoles.name, `%${params.name}%`));
  if (params.status !== undefined && params.status !== null)
    conditions.push(eq(sysRoles.status, params.status));
  if (params.code) {
    const codes = Array.isArray(params.code) ? params.code : [params.code];
    conditions.push(inArray(sysRoles.code, codes));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(sysRoles)
    .where(whereClause);

  const offset = (pageNum - 1) * pageSize;
  const roles = await db
    .select({
      id: sysRoles.id,
      name: sysRoles.name,
      code: sysRoles.code,
      status: sysRoles.status,
      remark: sysRoles.remark,
      createTime: sysRoles.createdAt,
      updateTime: sysRoles.updatedAt,
    })
    .from(sysRoles)
    .where(whereClause)
    .orderBy(desc(sysRoles.id))
    .limit(pageSize)
    .offset(offset);

  const list = roles.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    status: r.status ?? 1,
    remark: r.remark || "",
    createTime: r.createTime ? new Date(r.createTime).getTime() : Date.now(),
    updateTime: r.updateTime ? new Date(r.updateTime).getTime() : Date.now(),
  }));

  return { list, total, pageSize, currentPage: pageNum };
}

export async function createRole(params: {
  name: string;
  code: string;
  status?: number;
  remark?: string;
}) {
  const db = await getDb();

  if (PROTECTED_ROLE_CODES.has(params.code)) {
    throw new ParamsException("角色标识为系统保留值");
  }

  const [existing] = await db
    .select({ id: sysRoles.id, code: sysRoles.code })
    .from(sysRoles)
    .where(eq(sysRoles.code, params.code))
    .limit(1);
  if (existing) {
    throw { code: 10001, message: "角色标识已存在", status: 400 };
  }

  const [result] = await db.insert(sysRoles).values({
    name: params.name,
    code: params.code,
    status: params.status ?? 1,
    remark: params.remark || null,
  } as typeof sysRoles.$inferInsert);

  return { id: Number(result.insertId) };
}

export async function updateRole(params: {
  id: number;
  name?: string;
  code?: string;
  status?: number;
  remark?: string;
}) {
  const db = await getDb();

  const [existing] = await db
    .select({ id: sysRoles.id, code: sysRoles.code })
    .from(sysRoles)
    .where(eq(sysRoles.id, params.id))
    .limit(1);
  if (!existing) {
    throw { code: 10003, message: "角色不存在", status: 404 };
  }

  assertMutableRole(existing.code);

  if (params.code !== undefined && params.code !== existing.code) {
    if (PROTECTED_ROLE_CODES.has(params.code)) {
      throw new ParamsException("角色标识为系统保留值");
    }
    const [sameCode] = await db
      .select({ id: sysRoles.id })
      .from(sysRoles)
      .where(eq(sysRoles.code, params.code))
      .limit(1);
    if (sameCode && sameCode.id !== params.id) {
      throw new ParamsException("角色标识已存在");
    }
  }

  const updateData: Record<string, any> = {};
  if (params.name !== undefined) updateData.name = params.name;
  if (params.code !== undefined) updateData.code = params.code;
  if (params.status !== undefined) updateData.status = params.status;
  if (params.remark !== undefined) updateData.remark = params.remark;

  if (Object.keys(updateData).length > 0) {
    updateData.updatedAt = new Date();
    await db.update(sysRoles).set(updateData).where(eq(sysRoles.id, params.id));
  }
}

export async function deleteRole(id: number) {
  const db = await getDb();

  const [existing] = await db
    .select({ id: sysRoles.id, code: sysRoles.code })
    .from(sysRoles)
    .where(eq(sysRoles.id, id))
    .limit(1);
  if (!existing) {
    throw { code: 10003, message: "角色不存在", status: 404 };
  }

  assertMutableRole(existing.code);

  // 先删除角色关联的权限和用户关系
  await db.delete(sysRolePages).where(eq(sysRolePages.roleId, id));
  await db.delete(sysUserRoles).where(eq(sysUserRoles.roleId, id));
  await db.delete(sysRoles).where(eq(sysRoles.id, id));

  // 兜底：给所有无角色的用户分配 common 角色
  await ensureFallbackRole(db);
}

async function ensureFallbackRole(db: any) {
  // 查出所有无角色的用户
  const hasRoleRows = await db
    .select({ userId: sysUserRoles.userId })
    .from(sysUserRoles);
  const hasRoleIds = [...new Set(hasRoleRows.map((r) => r.userId))];
  const allUsers = await db.select({ id: sysUsers.id }).from(sysUsers);
  const orphanUserIds = allUsers
    .filter((u) => !hasRoleIds.includes(u.id))
    .map((u) => u.id);
  if (orphanUserIds.length === 0) return;

  // 查找 common 角色（前端已禁用删除，肯定存在）
  const [commonRole] = await db
    .select({ id: sysRoles.id })
    .from(sysRoles)
    .where(eq(sysRoles.code, "common"))
    .limit(1);
  if (!commonRole) return;

  for (const userId of orphanUserIds) {
    await db.insert(sysUserRoles).values({ userId, roleId: commonRole.id });
  }
}

export async function saveRoleMenu(
  id: number,
  menuIds: number[],
  homePageId: number | null,
  user: AuthenticatedUser,
) {
  const db = await getDb();
  const uniqueMenuIds = [...new Set(menuIds)];

  const [role] = await db
    .select({ id: sysRoles.id, code: sysRoles.code })
    .from(sysRoles)
    .where(eq(sysRoles.id, id))
    .limit(1);
  if (!role) {
    throw { code: 10003, message: "角色不存在", status: 404 };
  }

  assertMutableRole(role.code);

  if (!isSystemAdmin(user)) {
    const allowedPageIds = await getUserPageIds(user.userId);
    if (uniqueMenuIds.some((pageId) => !allowedPageIds.has(pageId))) {
      throw new ForbiddenException("只能配置自身已有权限范围内的菜单");
    }
  }

  if (uniqueMenuIds.length > 0) {
    const pages = await db
      .select({ id: sysPages.id })
      .from(sysPages)
      .where(inArray(sysPages.id, uniqueMenuIds));
    if (pages.length !== uniqueMenuIds.length) {
      throw { code: 10001, message: "菜单权限中包含不存在的页面", status: 400 };
    }
  }

  if (homePageId !== null) {
    if (!uniqueMenuIds.includes(homePageId)) {
      throw {
        code: 10001,
        message: "角色首页必须包含在菜单权限中",
        status: 400,
      };
    }
    const [homePage] = await db
      .select({
        menuType: sysPages.menuType,
        path: sysPages.path,
        component: sysPages.component,
        status: sysPages.status,
      })
      .from(sysPages)
      .where(eq(sysPages.id, homePageId))
      .limit(1);
    if (
      !homePage ||
      homePage.menuType === 1 ||
      homePage.status !== 1 ||
      !homePage.path ||
      homePage.path === "/" ||
      !homePage.component
    ) {
      throw {
        code: 10001,
        message: "角色首页必须是已启用且可访问的页面",
        status: 400,
      };
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(sysRolePages).where(eq(sysRolePages.roleId, id));
    if (uniqueMenuIds.length > 0) {
      await tx
        .insert(sysRolePages)
        .values(
          uniqueMenuIds.map((menuId) => ({ roleId: id, pageId: menuId })),
        );
    }
    await tx
      .update(sysRoles)
      .set({
        homePageId,
        updatedAt: new Date(),
      } as Partial<typeof sysRoles.$inferInsert>)
      .where(eq(sysRoles.id, id));
  });
}
