import {
  boolean,
  datetime,
  index,
  int,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const authUsers = mysqlTable(
  "auth_users",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    name: varchar("name", { length: 128 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: varchar("image", { length: 512 }),
    legacyUserId: int("legacy_user_id").notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => ({
    emailUk: uniqueIndex("uk_auth_users_email").on(table.email),
    legacyUserUk: uniqueIndex("uk_auth_users_legacy_user_id").on(
      table.legacyUserId,
    ),
  }),
);

export const authSessions = mysqlTable(
  "auth_sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    userId: varchar("user_id", { length: 64 })
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
  },
  (table) => ({
    tokenUk: uniqueIndex("uk_auth_sessions_token").on(table.token),
    userIdIdx: index("idx_auth_sessions_user_id").on(table.userId),
  }),
);

export const authAccounts = mysqlTable(
  "auth_accounts",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 64 }).notNull(),
    userId: varchar("user_id", { length: 64 })
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: datetime("access_token_expires_at", { mode: "date" }),
    refreshTokenExpiresAt: datetime("refresh_token_expires_at", {
      mode: "date",
    }),
    scope: text("scope"),
    password: varchar("password", { length: 255 }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => ({
    providerAccountUk: uniqueIndex("uk_auth_accounts_provider_account").on(
      table.providerId,
      table.accountId,
    ),
    userIdIdx: index("idx_auth_accounts_user_id").on(table.userId),
  }),
);

export const authVerifications = mysqlTable(
  "auth_verifications",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (table) => ({
    identifierIdx: index("idx_auth_verifications_identifier").on(
      table.identifier,
    ),
  }),
);
