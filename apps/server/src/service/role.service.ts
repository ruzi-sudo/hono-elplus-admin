import { eq, like, and, count, desc, inArray } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { getDb } from "../db";
import {
  sysRoles,
  sysUserRoles,
  sysRolePages,
  sysUsers,
  sysPages,
  sysApiPermissions,
  sysRoleApiPermissions,
} from "../db/schema";
import type * as schema from "../db/schema";
import { ForbiddenException, ParamsException } from "../common/exception";
import type { AuthenticatedUser } from "../middlewares/auth";
import { isSystemAdmin } from "../middlewares/rbac";

const PROTECTED_ROLE_CODES = new Set(["admin", "common"]);

function assertMutableRole(code: string): void {
  if (PROTECTED_ROLE_CODES.has(code)) {
    throw new ParamsException("系统内置角色不允许修改");
  }
}

type PermissionQueries = Pick<MySql2Database<typeof schema>, "select">;

function resolveGrantChanges(
  existingIds: number[],
  requestedIds: number[],
  editableIds: ReadonlySet<number> | undefined,
  forbiddenMessage: string,
) {
  const existing = new Set(existingIds);
  const requested = new Set(requestedIds);
  const added = [...requested].filter((id) => !existing.has(id));
  if (editableIds && added.some((id) => !editableIds.has(id))) {
    throw new ForbiddenException(forbiddenMessage);
  }

  // Omitting an out-of-scope grant must not revoke it; submitting it is a no-op.
  const removed = existingIds.filter(
    (id) => !requested.has(id) && (!editableIds || editableIds.has(id)),
  );
  return { added, removed };
}

async function getUserApiPermissionIds(
  db: PermissionQueries,
  userId: number,
): Promise<Set<number>> {
  const rows = await db
    .select({ apiPermissionId: sysRoleApiPermissions.apiPermissionId })
    .from(sysRoleApiPermissions)
    .innerJoin(sysUserRoles, eq(sysRoleApiPermissions.roleId, sysUserRoles.roleId))
    .innerJoin(sysRoles, eq(sysRoleApiPermissions.roleId, sysRoles.id))
    .innerJoin(
      sysApiPermissions,
      eq(sysRoleApiPermissions.apiPermissionId, sysApiPermissions.id),
    )
    .where(
      and(
        eq(sysUserRoles.userId, userId),
        eq(sysRoles.status, 1),
        eq(sysApiPermissions.status, 1),
      ),
    );
  return new Set(rows.map((row) => row.apiPermissionId));
}

async function assertValidHomePage(
  db: PermissionQueries,
  menuIds: number[],
  homePageId: number | null,
): Promise<void> {
  if (homePageId === null) return;
  if (!menuIds.includes(homePageId)) {
    throw new ParamsException("角色首页必须包含在菜单权限中");
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
    throw new ParamsException("角色首页必须是已启用且可访问的页面");
  }
}

async function getUserPageIds(
  db: PermissionQueries,
  userId: number,
): Promise<Set<number>> {
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

  await assertRoleGrantsAssignable(db, user.userId, uniqueRoleIds);
}

async function assertRoleGrantsAssignable(
  db: PermissionQueries,
  userId: number,
  roleIds: number[],
) {
  const [
    targetPageRows,
    allowedPageIds,
    targetApiPermissionRows,
    allowedApiPermissionIds,
  ] = await Promise.all([
    db
      .select({ pageId: sysRolePages.pageId })
      .from(sysRolePages)
      .where(inArray(sysRolePages.roleId, roleIds)),
    getUserPageIds(db, userId),
    db
      .select({ apiPermissionId: sysRoleApiPermissions.apiPermissionId })
      .from(sysRoleApiPermissions)
      .where(inArray(sysRoleApiPermissions.roleId, roleIds)),
    getUserApiPermissionIds(db, userId),
  ]);

  if (targetPageRows.some((row) => !allowedPageIds.has(row.pageId))) {
    throw new ForbiddenException("只能分配自身已有页面权限范围内的角色");
  }

  if (
    targetApiPermissionRows.some(
      (row) => !allowedApiPermissionIds.has(row.apiPermissionId),
    )
  ) {
    throw new ForbiddenException("只能分配自身已有接口权限范围内的角色");
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

export async function listApiPermissionRoles() {
  const db = await getDb();
  const roles = await db
    .select({
      id: sysRoles.id,
      name: sysRoles.name,
      code: sysRoles.code,
      status: sysRoles.status,
    })
    .from(sysRoles)
    .orderBy(desc(sysRoles.id));
  return roles.map((role) => ({ ...role, status: role.status ?? 0 }));
}

export async function getRoleIdsByUserId(userId: number) {
  const db = await getDb();
  const rows = await db
    .select({ roleId: sysUserRoles.roleId })
    .from(sysUserRoles)
    .where(eq(sysUserRoles.userId, userId));
  return rows.map((r) => r.roleId);
}

export async function listApiPermissions(user: AuthenticatedUser) {
  const db = await getDb();
  const permissions = await db
    .select({
      id: sysApiPermissions.id,
      code: sysApiPermissions.code,
      name: sysApiPermissions.name,
      module: sysApiPermissions.module,
      method: sysApiPermissions.method,
      path: sysApiPermissions.path,
      description: sysApiPermissions.description,
      sort: sysApiPermissions.sort,
      status: sysApiPermissions.status,
    })
    .from(sysApiPermissions)
    .orderBy(
      sysApiPermissions.module,
      sysApiPermissions.sort,
      sysApiPermissions.id,
    );
  const editableIds = isSystemAdmin(user)
    ? undefined
    : await getUserApiPermissionIds(db, user.userId);
  return permissions.map((permission) => ({
    ...permission,
    assignable: !editableIds || editableIds.has(permission.id),
  }));
}

export async function createApiPermission(input: {
  code: string;
  name: string;
  module: string;
  method: string;
  path: string;
  description?: string;
  sort?: number;
  status?: number;
}) {
  const db = await getDb();
  const [result] = await db.insert(sysApiPermissions).values(input);
  return { id: result.insertId };
}

export async function updateApiPermission(input: {
  id: number;
  code?: string;
  name?: string;
  module?: string;
  method?: string;
  path?: string;
  description?: string;
  sort?: number;
  status?: number;
}) {
  const db = await getDb();
  const { id, ...changes } = input;
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ method: sysApiPermissions.method, path: sysApiPermissions.path })
      .from(sysApiPermissions)
      .where(eq(sysApiPermissions.id, id))
      .for("update");
    if (!current) throw new ParamsException("接口权限不存在");
    const repointsEndpoint =
      (changes.method !== undefined && changes.method !== current.method) ||
      (changes.path !== undefined && changes.path !== current.path);
    if (repointsEndpoint) {
      const [grant] = await tx
        .select({ id: sysRoleApiPermissions.id })
        .from(sysRoleApiPermissions)
        .where(eq(sysRoleApiPermissions.apiPermissionId, id))
        .limit(1);
      if (grant) {
        throw new ParamsException("已分配的接口权限不能修改请求方法或路径");
      }
    }

    await tx
      .update(sysApiPermissions)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(sysApiPermissions.id, id));
  });
}

export async function getRoleMenuIds(roleId: number) {
  const db = await getDb();
  const [role] = await db
    .select({ homePageId: sysRoles.homePageId })
    .from(sysRoles)
    .where(eq(sysRoles.id, roleId))
    .limit(1);
  if (!role) throw { code: 10003, message: "角色不存在", status: 404 };

  const rows = await db
    .select({ pageId: sysRolePages.pageId })
    .from(sysRolePages)
    .where(eq(sysRolePages.roleId, roleId));

  return {
    menuIds: rows.map((row) => row.pageId),
    homePageId: role.homePageId ?? null,
  };
}

export async function getRoleApiPermissionIds(roleId: number) {
  const db = await getDb();
  const [role] = await db
    .select({ id: sysRoles.id })
    .from(sysRoles)
    .where(eq(sysRoles.id, roleId))
    .limit(1);
  if (!role) throw { code: 10003, message: "角色不存在", status: 404 };

  const rows = await db
    .select({ apiPermissionId: sysRoleApiPermissions.apiPermissionId })
    .from(sysRoleApiPermissions)
    .where(eq(sysRoleApiPermissions.roleId, roleId));

  return { apiPermissionIds: rows.map((row) => row.apiPermissionId) };
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

export async function updateRole(
  params: {
    id: number;
    name?: string;
    code?: string;
    status?: number;
    remark?: string;
  },
  user: AuthenticatedUser,
) {
  const db = await getDb();
  const { id, ...changes } = params;
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ code: sysRoles.code, status: sysRoles.status })
      .from(sysRoles)
      .where(eq(sysRoles.id, id))
      .for("update");
    if (!existing) {
      throw { code: 10003, message: "角色不存在", status: 404 };
    }
    assertMutableRole(existing.code);

    if (changes.code !== undefined && changes.code !== existing.code) {
      if (PROTECTED_ROLE_CODES.has(changes.code)) {
        throw new ParamsException("角色标识为系统保留值");
      }
      const [sameCode] = await tx
        .select({ id: sysRoles.id })
        .from(sysRoles)
        .where(eq(sysRoles.code, changes.code))
        .limit(1);
      if (sameCode && sameCode.id !== id) {
        throw new ParamsException("角色标识已存在");
      }
    }

    // Enabling a role can confer all its existing grants on its members.
    if (!isSystemAdmin(user) && changes.status === 1 && existing.status !== 1) {
      await assertRoleGrantsAssignable(tx, user.userId, [id]);
    }

    if (Object.values(changes).some((value) => value !== undefined)) {
      await tx
        .update(sysRoles)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(sysRoles.id, id));
    }
  });
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
  await db
    .delete(sysRoleApiPermissions)
    .where(eq(sysRoleApiPermissions.roleId, id));
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
  await db.transaction(async (tx) => {
    const [role] = await tx
      .select({ code: sysRoles.code, homePageId: sysRoles.homePageId })
      .from(sysRoles)
      .where(eq(sysRoles.id, id))
      .for("update");
    if (!role) throw { code: 10003, message: "角色不存在", status: 404 };
    assertMutableRole(role.code);

    const rows = await tx
      .select({ pageId: sysRolePages.pageId })
      .from(sysRolePages)
      .where(eq(sysRolePages.roleId, id));
    const existingIds = rows.map((row) => row.pageId);
    const editableIds = isSystemAdmin(user)
      ? undefined
      : await getUserPageIds(tx, user.userId);
    const { added, removed } = resolveGrantChanges(
      existingIds,
      menuIds,
      editableIds,
      "只能配置自身已有权限范围内的菜单",
    );

    if (added.length > 0) {
      const pages = await tx
        .select({ id: sysPages.id })
        .from(sysPages)
        .where(inArray(sysPages.id, added));
      if (pages.length !== added.length) {
        throw new ParamsException("菜单权限中包含不存在的页面");
      }
    }

    if (homePageId !== null) {
      if (editableIds && !editableIds.has(homePageId)) {
        if (homePageId !== role.homePageId) {
          throw new ForbiddenException("只能设置自身已有权限范围内的角色首页");
        }
      } else {
        const finalIds = new Set(existingIds);
        for (const pageId of removed) finalIds.delete(pageId);
        for (const pageId of added) finalIds.add(pageId);
        await assertValidHomePage(tx, [...finalIds], homePageId);
      }
    }

    if (removed.length > 0) {
      await tx.delete(sysRolePages).where(
        and(eq(sysRolePages.roleId, id), inArray(sysRolePages.pageId, removed)),
      );
    }
    if (added.length > 0) {
      await tx
        .insert(sysRolePages)
        .values(added.map((pageId) => ({ roleId: id, pageId })));
    }
    await tx
      .update(sysRoles)
      .set({ homePageId, updatedAt: new Date() })
      .where(eq(sysRoles.id, id));
  });
}

export async function saveRoleApiPermissions(
  id: number,
  apiPermissionIds: number[],
  user: AuthenticatedUser,
) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    const [role] = await tx
      .select({ code: sysRoles.code })
      .from(sysRoles)
      .where(eq(sysRoles.id, id))
      .for("update");
    if (!role) throw { code: 10003, message: "角色不存在", status: 404 };
    assertMutableRole(role.code);

    const requestedIds = [...new Set(apiPermissionIds)];
    // Serialize with catalog edits before deciding which endpoint IDs to grant.
    const definitions =
      requestedIds.length > 0
        ? await tx
            .select({ id: sysApiPermissions.id })
            .from(sysApiPermissions)
            .where(inArray(sysApiPermissions.id, requestedIds))
            .for("share")
        : [];
    const rows = await tx
      .select({ apiPermissionId: sysRoleApiPermissions.apiPermissionId })
      .from(sysRoleApiPermissions)
      .where(eq(sysRoleApiPermissions.roleId, id));
    const editableIds = isSystemAdmin(user)
      ? undefined
      : await getUserApiPermissionIds(tx, user.userId);
    const { added, removed } = resolveGrantChanges(
      rows.map((row) => row.apiPermissionId),
      requestedIds,
      editableIds,
      "只能配置自身已有权限范围内的接口",
    );
    if (definitions.length !== requestedIds.length) {
      throw new ParamsException("接口权限中包含不存在的权限");
    }

    if (removed.length > 0) {
      await tx.delete(sysRoleApiPermissions).where(
        and(
          eq(sysRoleApiPermissions.roleId, id),
          inArray(sysRoleApiPermissions.apiPermissionId, removed),
        ),
      );
    }
    if (added.length > 0) {
      await tx.insert(sysRoleApiPermissions).values(
        added.map((apiPermissionId) => ({ roleId: id, apiPermissionId })),
      );
    }
  });
}
