import {
  mysqlTable,
  int,
  varchar,
  tinyint,
  text,
  datetime,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const sysRoles = mysqlTable(
  "sys_roles",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 64 }).notNull(),
    code: varchar("code", { length: 64 }).notNull().unique(),
    status: tinyint("status").default(1),
    remark: text("remark"),
    homePageId: int("home_page_id"),
    createdAt: datetime("created_at", { mode: "date" }).default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: datetime("updated_at", { mode: "date" }).default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    codeIdx: index("idx_roles_code").on(table.code),
    homePageIdIdx: index("idx_roles_home_page_id").on(table.homePageId),
  }),
);
