CREATE TABLE IF NOT EXISTS auth_users (
    id              VARCHAR(64) PRIMARY KEY,
    name            VARCHAR(128) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    image           VARCHAR(512),
    legacy_user_id  INT NOT NULL,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL,
    UNIQUE KEY uk_auth_users_email (email),
    UNIQUE KEY uk_auth_users_legacy_user_id (legacy_user_id),
    CONSTRAINT fk_auth_users_legacy_user
      FOREIGN KEY (legacy_user_id) REFERENCES sys_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Better Auth 用户表';

CREATE TABLE IF NOT EXISTS auth_sessions (
    id          VARCHAR(64) PRIMARY KEY,
    expires_at  DATETIME NOT NULL,
    token       VARCHAR(255) NOT NULL,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL,
    ip_address  VARCHAR(64),
    user_agent  TEXT,
    user_id     VARCHAR(64) NOT NULL,
    UNIQUE KEY uk_auth_sessions_token (token),
    KEY idx_auth_sessions_user_id (user_id),
    CONSTRAINT fk_auth_sessions_user
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Better Auth 会话表';

CREATE TABLE IF NOT EXISTS auth_accounts (
    id                       VARCHAR(64) PRIMARY KEY,
    account_id               VARCHAR(255) NOT NULL,
    provider_id              VARCHAR(64) NOT NULL,
    user_id                  VARCHAR(64) NOT NULL,
    access_token             TEXT,
    refresh_token            TEXT,
    id_token                 TEXT,
    access_token_expires_at  DATETIME,
    refresh_token_expires_at DATETIME,
    scope                    TEXT,
    password                 VARCHAR(255),
    created_at               DATETIME NOT NULL,
    updated_at               DATETIME NOT NULL,
    UNIQUE KEY uk_auth_accounts_provider_account (provider_id, account_id),
    KEY idx_auth_accounts_user_id (user_id),
    CONSTRAINT fk_auth_accounts_user
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Better Auth 账号表';

CREATE TABLE IF NOT EXISTS auth_verifications (
    id          VARCHAR(64) PRIMARY KEY,
    identifier  VARCHAR(255) NOT NULL,
    value       TEXT NOT NULL,
    expires_at  DATETIME NOT NULL,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL,
    KEY idx_auth_verifications_identifier (identifier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Better Auth 验证表';

INSERT INTO sys_pages (parent_id, menu_type, title, `rank`, auths, status)
SELECT parent_page.id, 1, seed.title, seed.rank_value, seed.auths, 1
FROM (
    SELECT 'Welcome' AS parent_name, '查看详情' AS title, 1 AS rank_value, 'welcome:view' AS auths
    UNION ALL SELECT 'SystemUser', '新增用户', 1, 'system-user:add'
    UNION ALL SELECT 'SystemUser', '批量删除', 2, 'system-user:batch-delete'
    UNION ALL SELECT 'SystemUser', '修改', 3, 'system-user:edit'
    UNION ALL SELECT 'SystemUser', '删除', 4, 'system-user:delete'
    UNION ALL SELECT 'SystemUser', '上传头像', 5, 'system-user:upload-avatar'
    UNION ALL SELECT 'SystemUser', '重置密码', 6, 'system-user:reset-password'
    UNION ALL SELECT 'SystemUser', '分配角色', 7, 'system-user:assign-role'
    UNION ALL SELECT 'SystemRole', '新增角色', 1, 'system-role:add'
    UNION ALL SELECT 'SystemRole', '修改', 2, 'system-role:edit'
    UNION ALL SELECT 'SystemRole', '删除', 3, 'system-role:delete'
    UNION ALL SELECT 'SystemRole', '权限', 4, 'system-role:configure-permission'
    UNION ALL SELECT 'SystemRole', '保存权限配置', 5, 'system-role:save-permission'
    UNION ALL SELECT 'SystemMenu', '新增菜单', 1, 'system-menu:add'
    UNION ALL SELECT 'SystemMenu', '修改', 2, 'system-menu:edit'
    UNION ALL SELECT 'SystemMenu', '新增子菜单', 3, 'system-menu:add-child'
    UNION ALL SELECT 'SystemMenu', '删除', 4, 'system-menu:delete'
    UNION ALL SELECT 'LoginLog', '清空日志', 1, 'login-log:clear'
    UNION ALL SELECT 'LoginLog', '批量删除', 2, 'login-log:batch-delete'
    UNION ALL SELECT 'SystemLog', '清空日志', 1, 'system-log:clear'
    UNION ALL SELECT 'SystemLog', '批量删除', 2, 'system-log:batch-delete'
    UNION ALL SELECT 'SystemLog', '详情', 3, 'system-log:view'
    UNION ALL SELECT 'OnlineUser', '强退', 1, 'online-user:force-logout'
) AS seed
JOIN sys_pages parent_page
  ON parent_page.name = seed.parent_name
 AND parent_page.menu_type = 0
LEFT JOIN sys_pages existing ON existing.auths = seed.auths
WHERE existing.id IS NULL;

INSERT IGNORE INTO sys_role_pages (role_id, page_id)
SELECT role_row.id, page_row.id
FROM sys_roles role_row
JOIN sys_pages page_row ON page_row.menu_type = 1
WHERE role_row.code = 'admin'
  AND page_row.auths IN (
    'welcome:view',
    'system-user:add',
    'system-user:batch-delete',
    'system-user:edit',
    'system-user:delete',
    'system-user:upload-avatar',
    'system-user:reset-password',
    'system-user:assign-role',
    'system-role:add',
    'system-role:edit',
    'system-role:delete',
    'system-role:configure-permission',
    'system-role:save-permission',
    'system-menu:add',
    'system-menu:edit',
    'system-menu:add-child',
    'system-menu:delete',
    'login-log:clear',
    'login-log:batch-delete',
    'system-log:clear',
    'system-log:batch-delete',
    'system-log:view',
    'online-user:force-logout'
  );
