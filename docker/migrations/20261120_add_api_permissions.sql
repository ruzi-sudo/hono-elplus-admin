-- API permission tables and route metadata for existing data volumes.
-- Safe to run after docker/init.sql or on an existing installation.

CREATE TABLE IF NOT EXISTS sys_api_permissions (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    code            VARCHAR(128) NOT NULL,
    name            VARCHAR(128) NOT NULL,
    module          VARCHAR(64) NOT NULL,
    method          VARCHAR(16) NOT NULL,
    path            VARCHAR(255) NOT NULL,
    status          TINYINT DEFAULT 1,
    description     VARCHAR(255),
    sort            INT DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_api_permissions_code (code),
    UNIQUE KEY uk_api_permissions_method_path (method, path),
    KEY idx_api_permissions_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='接口权限表';

CREATE TABLE IF NOT EXISTS sys_role_api_permissions (
    id                INT PRIMARY KEY AUTO_INCREMENT,
    role_id           INT NOT NULL,
    api_permission_id INT NOT NULL,
    UNIQUE KEY uk_role_api_permission (role_id, api_permission_id),
    KEY idx_role_api_permissions_role_id (role_id),
    KEY idx_role_api_permissions_api_id (api_permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色接口权限关联表';

SET @description_column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sys_api_permissions'
      AND COLUMN_NAME = 'description'
);
SET @add_description_column = IF(
    @description_column_exists = 0,
    'ALTER TABLE sys_api_permissions ADD COLUMN description VARCHAR(255) NULL AFTER status',
    'SELECT 1'
);
PREPARE add_description_column_stmt FROM @add_description_column;
EXECUTE add_description_column_stmt;
DEALLOCATE PREPARE add_description_column_stmt;

SET @sort_column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sys_api_permissions'
      AND COLUMN_NAME = 'sort'
);
SET @add_sort_column = IF(
    @sort_column_exists = 0,
    'ALTER TABLE sys_api_permissions ADD COLUMN sort INT DEFAULT 0 AFTER description',
    'SELECT 1'
);
PREPARE add_sort_column_stmt FROM @add_sort_column;
EXECUTE add_sort_column_stmt;
DEALLOCATE PREPARE add_sort_column_stmt;

SET @module_index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sys_api_permissions'
      AND INDEX_NAME = 'idx_api_permissions_module'
);
SET @add_module_index = IF(
    @module_index_exists = 0,
    'CREATE INDEX idx_api_permissions_module ON sys_api_permissions(module)',
    'SELECT 1'
);
PREPARE add_module_index_stmt FROM @add_module_index;
EXECUTE add_module_index_stmt;
DEALLOCATE PREPARE add_module_index_stmt;

SET @role_index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sys_role_api_permissions'
      AND INDEX_NAME = 'idx_role_api_permissions_role_id'
);
SET @add_role_index = IF(
    @role_index_exists = 0,
    'CREATE INDEX idx_role_api_permissions_role_id ON sys_role_api_permissions(role_id)',
    'SELECT 1'
);
PREPARE add_role_index_stmt FROM @add_role_index;
EXECUTE add_role_index_stmt;
DEALLOCATE PREPARE add_role_index_stmt;

SET @api_index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sys_role_api_permissions'
      AND INDEX_NAME = 'idx_role_api_permissions_api_id'
);

SET @role_fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sys_role_api_permissions'
      AND CONSTRAINT_NAME = 'fk_role_api_permissions_role'
);
SET @add_role_fk = IF(
    @role_fk_exists = 0,
    'ALTER TABLE sys_role_api_permissions ADD CONSTRAINT fk_role_api_permissions_role FOREIGN KEY (role_id) REFERENCES sys_roles(id) ON DELETE CASCADE',
    'SELECT 1'
);
PREPARE add_role_fk_stmt FROM @add_role_fk;
EXECUTE add_role_fk_stmt;
DEALLOCATE PREPARE add_role_fk_stmt;

SET @api_fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sys_role_api_permissions'
      AND CONSTRAINT_NAME = 'fk_role_api_permissions_api'
);
SET @add_api_fk = IF(
    @api_fk_exists = 0,
    'ALTER TABLE sys_role_api_permissions ADD CONSTRAINT fk_role_api_permissions_api FOREIGN KEY (api_permission_id) REFERENCES sys_api_permissions(id) ON DELETE CASCADE',
    'SELECT 1'
);
PREPARE add_api_fk_stmt FROM @add_api_fk;
EXECUTE add_api_fk_stmt;
DEALLOCATE PREPARE add_api_fk_stmt;
SET @add_api_index = IF(
    @api_index_exists = 0,
    'CREATE INDEX idx_role_api_permissions_api_id ON sys_role_api_permissions(api_permission_id)',
    'SELECT 1'
);
PREPARE add_api_index_stmt FROM @add_api_index;
EXECUTE add_api_index_stmt;
DEALLOCATE PREPARE add_api_index_stmt;

INSERT INTO sys_api_permissions
    (code, name, module, method, path, status, sort)
VALUES
('api:auth:logout', '退出登录', '认证', 'POST', '/logout', 1, 10),
('api:user:list', '查询用户', '用户管理', 'POST', '/user', 1, 10),
('api:user:create', '创建用户', '用户管理', 'POST', '/user/create', 1, 20),
('api:user:update', '修改用户', '用户管理', 'POST', '/user/update', 1, 30),
('api:user:delete', '删除用户', '用户管理', 'POST', '/user/delete', 1, 40),
('api:user:batch-delete', '批量删除用户', '用户管理', 'POST', '/user/batch-delete', 1, 50),
('api:user:reset-password', '重置用户密码', '用户管理', 'POST', '/user/reset-password', 1, 60),
('api:user:list-roles', '查询角色选项', '用户管理', 'GET', '/list-all-role', 1, 70),
('api:user:list-role-ids', '查询用户角色', '用户管理', 'POST', '/list-role-ids', 1, 80),
('api:user:upload-avatar', '上传用户头像', '用户管理', 'POST', '/upload/avatar', 1, 90),
('api:role:list', '查询角色', '角色管理', 'POST', '/role', 1, 10),
('api:role:create', '创建角色', '角色管理', 'POST', '/role/create', 1, 20),
('api:role:update', '修改角色', '角色管理', 'POST', '/role/update', 1, 30),
('api:role:delete', '删除角色', '角色管理', 'POST', '/role/delete', 1, 40),
('api:role:list-menu', '查询角色菜单', '角色管理', 'POST', '/role-menu', 1, 50),
('api:role:get-menu-ids', '查询角色菜单ID', '角色管理', 'POST', '/role-menu-ids', 1, 60),
('api:role:list-api-permissions', '查询接口权限', '角色管理', 'GET', '/role-api-permissions', 1, 70),
('api:role:create-api-permission', '新增接口权限', '角色管理', 'POST', '/role-api-permissions/create', 1, 80),
('api:role:update-api-permission', '修改接口权限', '角色管理', 'POST', '/role-api-permissions/update', 1, 90),
('api:role:save-menu', '保存角色菜单', '角色管理', 'POST', '/role/save-menu', 1, 110),
('api:role:save-api-permissions', '保存角色接口权限', '角色管理', 'POST', '/role/save-api-permissions', 1, 120),
('api:menu:list', '查询菜单', '菜单管理', 'POST', '/menu', 1, 10),
('api:menu:create', '创建菜单', '菜单管理', 'POST', '/menu/create', 1, 20),
('api:menu:update', '修改菜单', '菜单管理', 'POST', '/menu/update', 1, 30),
('api:menu:delete', '删除菜单', '菜单管理', 'POST', '/menu/delete', 1, 40),
('api:menu:get-routes', '查询动态路由', '菜单管理', 'GET', '/get-async-routes', 1, 50),
('api:monitor:online-list', '查询在线用户', '在线用户', 'POST', '/online-logs', 1, 10),
('api:monitor:force-offline', '强制下线用户', '在线用户', 'POST', '/online-logs/force-offline', 1, 20),
('api:monitor:login-list', '查询登录日志', '登录日志', 'POST', '/login-logs', 1, 10),
('api:monitor:login-delete', '删除登录日志', '登录日志', 'POST', '/login-logs/delete', 1, 20),
('api:monitor:login-clear', '清空登录日志', '登录日志', 'POST', '/login-logs/clear', 1, 30),
('api:monitor:system-list', '查询系统日志', '系统日志', 'POST', '/system-logs', 1, 10),
('api:monitor:system-detail', '查询系统日志详情', '系统日志', 'POST', '/system-logs-detail', 1, 20),
('api:monitor:system-delete', '删除系统日志', '系统日志', 'POST', '/system-logs/delete', 1, 30),
('api:monitor:system-clear', '清空系统日志', '系统日志', 'POST', '/system-logs/clear', 1, 40),
('api:dashboard:cards', '查询首页卡片', '首页', 'POST', '/get-card-list', 1, 10),
('api:dashboard:map', '查询首页地图', '首页', 'GET', '/get-map-info', 1, 20),
('api:mine:get', '查询个人信息', '个人中心', 'GET', '/mine', 1, 10),
('api:mine:update', '修改个人信息', '个人中心', 'POST', '/mine/update', 1, 20),
('api:mine:reset-password', '修改个人密码', '个人中心', 'POST', '/mine/reset-password', 1, 30),
('api:mine:upload-avatar', '上传个人头像', '个人中心', 'POST', '/mine/upload/avatar', 1, 40)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    module = VALUES(module),
    method = VALUES(method),
    path = VALUES(path),
    status = VALUES(status),
    sort = VALUES(sort),
    updated_at = CURRENT_TIMESTAMP;

DELETE role_permission
FROM sys_role_api_permissions role_permission
INNER JOIN sys_api_permissions permission
  ON permission.id = role_permission.api_permission_id
WHERE permission.code IN (
    'api:role:get-permissions',
    'api:role:save-permissions'
);
DELETE FROM sys_api_permissions
WHERE code IN (
    'api:role:get-permissions',
    'api:role:save-permissions'
);

INSERT IGNORE INTO sys_role_api_permissions (role_id, api_permission_id)
SELECT role_row.id, permission.id
FROM sys_roles role_row
JOIN sys_api_permissions permission
  ON role_row.code = 'admin';

INSERT IGNORE INTO sys_role_api_permissions (role_id, api_permission_id)
SELECT role_row.id, permission.id
FROM sys_roles role_row
JOIN sys_api_permissions permission
  ON role_row.code = 'common'
WHERE permission.code IN (
  'api:auth:logout',
  'api:menu:get-routes',
  'api:dashboard:cards',
  'api:dashboard:map',
  'api:mine:get',
  'api:mine:update',
  'api:mine:reset-password',
  'api:mine:upload-avatar'
);
