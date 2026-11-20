import {
  datetime,
  index,
  int,
  mysqlTable,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { sysRoles } from "./roles";

export const sysApiPermissions = mysqlTable(
  "sys_api_permissions",
  {
    id: int("id").primaryKey().autoincrement(),
    code: varchar("code", { length: 128 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    module: varchar("module", { length: 64 }).notNull(),
    method: varchar("method", { length: 16 }).notNull(),
    path: varchar("path", { length: 255 }).notNull(),
    status: tinyint("status").default(1),
    createdAt: datetime("created_at", { mode: "date" }).defaultNow(),
    updatedAt: datetime("updated_at", { mode: "date" }).defaultNow(),
    description: varchar("description", { length: 255 }),
    sort: int("sort").default(0),
  },
  (table) => ({
    codeUk: uniqueIndex("uk_api_permissions_code").on(table.code),
    routeUk: uniqueIndex("uk_api_permissions_method_path").on(
      table.method,
      table.path,
    ),
    moduleIdx: index("idx_api_permissions_module").on(table.module),
  }),
);

export const sysRoleApiPermissions = mysqlTable(
  "sys_role_api_permissions",
  {
    id: int("id").primaryKey().autoincrement(),
    roleId: int("role_id")
      .notNull()
      .references(() => sysRoles.id, { onDelete: "cascade" }),
    apiPermissionId: int("api_permission_id")
      .notNull()
      .references(() => sysApiPermissions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    roleApiUk: uniqueIndex("uk_role_api_permission").on(
      table.roleId,
      table.apiPermissionId,
    ),
    roleIdx: index("idx_role_api_permissions_role_id").on(table.roleId),
    apiIdx: index("idx_role_api_permissions_api_id").on(
      table.apiPermissionId,
    ),
  }),
);
