import { mysqlTable, int, varchar, text, datetime, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const sysConfigs = mysqlTable('sys_configs', {
  id: int('id').primaryKey().autoincrement(),
  configKey: varchar('config_key', { length: 100 }).notNull().unique(),
  configValue: text('config_value'),
  description: varchar('description', { length: 255 }),
  createdAt: datetime('created_at', { mode: 'date' }).default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at', { mode: 'date' }).default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  configKeyIdx: index('idx_configs_key').on(table.configKey),
}));
