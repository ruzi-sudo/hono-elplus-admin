-- ============================================================
-- PureAdmin Initial Database Schema
-- Business tables use `sys_`; Better Auth tables use `auth_`
-- ============================================================

USE hono_elplus_admin;

-- ----------------------------
-- 1. 系统配置表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_configs (
    id            INT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
    config_key    VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value  TEXT COMMENT '配置值',
    description   VARCHAR(255) COMMENT '配置说明',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ----------------------------
-- 2. 用户表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_users (
    id          INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username    VARCHAR(64) UNIQUE NOT NULL COMMENT '用户名',
    password    VARCHAR(255) NOT NULL COMMENT '密码',
    avatar      VARCHAR(512) COMMENT '头像URL',
    email       VARCHAR(128) COMMENT '邮箱',
    status      TINYINT DEFAULT 1 COMMENT '状态(1启用 0停用)',
    remark      TEXT COMMENT '备注',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ----------------------------
-- 2A. Better Auth 用户表
-- ----------------------------
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

-- ----------------------------
-- 3. 角色表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_roles (
    id          INT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
    name        VARCHAR(64) NOT NULL COMMENT '角色名称',
    code        VARCHAR(64) UNIQUE NOT NULL COMMENT '角色标识',
    status      TINYINT DEFAULT 1 COMMENT '状态(1启用 0停用)',
    remark      TEXT COMMENT '备注',
    home_page_id INT COMMENT '角色登录首页页面ID',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ----------------------------
-- 4. 用户角色关联表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_user_roles (
    id       INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    user_id  INT NOT NULL COMMENT '用户ID',
    role_id  INT NOT NULL COMMENT '角色ID',
    UNIQUE KEY uk_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- ----------------------------
-- 5. 页面/菜单表
-- menu_type: 0=菜单 1=按钮
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_pages (
    id                INT PRIMARY KEY AUTO_INCREMENT COMMENT '页面ID',
    parent_id         INT DEFAULT 0 COMMENT '父级ID',
    menu_type         TINYINT DEFAULT 0 COMMENT '类型(0菜单 1按钮)',
    title             VARCHAR(128) NOT NULL COMMENT '菜单标题/i18n键',
    name              VARCHAR(128) COMMENT '路由名称',
    path              VARCHAR(255) COMMENT '路由路径',
    component         VARCHAR(255) COMMENT '组件路径',
    `rank`            INT DEFAULT 99 COMMENT '排序号',
    redirect          VARCHAR(255) COMMENT '重定向地址',
    icon              VARCHAR(64) COMMENT '图标',
    extra_icon        VARCHAR(64) COMMENT '右侧图标',
    enter_transition  VARCHAR(64) COMMENT '进场动画',
    leave_transition  VARCHAR(64) COMMENT '离场动画',
    active_path       VARCHAR(255) COMMENT '激活菜单路径',
    auths             VARCHAR(255) COMMENT '按钮权限标识',
    keep_alive        TINYINT DEFAULT 0 COMMENT '缓存页面(1是 0否)',
    hidden_tag        TINYINT DEFAULT 0 COMMENT '禁止标签页(1禁止 0允许)',
    fixed_tag         TINYINT DEFAULT 0 COMMENT '固定标签页(1固定 0不固定)',
    show_link         TINYINT DEFAULT 1 COMMENT '菜单显示(1显示 0隐藏)',
    show_parent       TINYINT DEFAULT 0 COMMENT '显示父菜单(1显示 0隐藏)',
    status            TINYINT DEFAULT 1 COMMENT '状态(1启用 0停用)',
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='页面/菜单表';

-- ----------------------------
-- 6A. 接口权限表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_api_permissions (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    code            VARCHAR(128) NOT NULL UNIQUE,
    name            VARCHAR(128) NOT NULL,
    module          VARCHAR(64) NOT NULL,
    method          VARCHAR(16) NOT NULL,
    path            VARCHAR(255) NOT NULL,
    status          TINYINT DEFAULT 1,
    description     VARCHAR(255),
    sort            INT DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_api_permissions_method_path (method, path),
    KEY idx_api_permissions_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='接口权限表';

CREATE TABLE IF NOT EXISTS sys_role_api_permissions (
    id                INT PRIMARY KEY AUTO_INCREMENT,
    role_id           INT NOT NULL,
    api_permission_id INT NOT NULL,
    UNIQUE KEY uk_role_api_permission (role_id, api_permission_id),
    KEY idx_role_api_permissions_role_id (role_id),
    KEY idx_role_api_permissions_api_id (api_permission_id),
    CONSTRAINT fk_role_api_permissions_role
      FOREIGN KEY (role_id) REFERENCES sys_roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_api_permissions_api
      FOREIGN KEY (api_permission_id) REFERENCES sys_api_permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色接口权限关联表';
-- 6. 角色页面权限关联表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_role_pages (
    id       INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    role_id  INT NOT NULL COMMENT '角色ID',
    page_id  INT NOT NULL COMMENT '页面ID',
    UNIQUE KEY uk_role_page (role_id, page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色页面权限关联表';

-- ----------------------------
-- 7. 登录日志表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_login_logs (
    id          INT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    user_id     INT DEFAULT 0 COMMENT '用户ID',
    username    VARCHAR(64) NOT NULL COMMENT '用户名',
    ip          VARCHAR(64) COMMENT '登录IP',
    address     VARCHAR(128) COMMENT '登录地点',
    `system`    VARCHAR(64) COMMENT '操作系统',
    browser     VARCHAR(64) COMMENT '浏览器',
    status      TINYINT DEFAULT 1 COMMENT '状态(1成功 0失败)',
    login_time  DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录日志表';

-- ----------------------------
-- 8. 系统日志表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_system_logs (
    id              INT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    user_id         INT DEFAULT 0 COMMENT '用户ID',
    username        VARCHAR(64) COMMENT '操作人',
    module          VARCHAR(64) COMMENT '模块',
    operation       VARCHAR(255) COMMENT '操作描述',
    request_url     VARCHAR(512) COMMENT '请求地址',
    request_method  VARCHAR(16) COMMENT '请求方法',
    request_params  TEXT COMMENT '请求参数',
    response_data   TEXT COMMENT '响应数据',
    error_message   TEXT COMMENT '错误信息',
    ip              VARCHAR(64) COMMENT '来源IP',
    address         VARCHAR(128) COMMENT '地点',
    `system`        VARCHAR(64) COMMENT '操作系统',
    browser         VARCHAR(64) COMMENT '浏览器',
    takes_time      INT DEFAULT 0 COMMENT '请求耗时(ms)',
    status          TINYINT DEFAULT 0 COMMENT '状态(1成功 0异常)',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志表';

-- ----------------------------
-- 9. 系统日志详情表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_system_log_details (
    id                INT PRIMARY KEY AUTO_INCREMENT COMMENT '详情ID',
    log_id            INT NOT NULL COMMENT '关联系统日志ID',
    request_body      TEXT COMMENT '请求体',
    request_headers   TEXT COMMENT '请求头',
    response_headers  TEXT COMMENT '响应头',
    response_body     TEXT COMMENT '响应体',
    stack_trace       TEXT COMMENT '异常堆栈',
    trace_id          VARCHAR(64) COMMENT '链路追踪ID',
    request_time      DATETIME COMMENT '请求时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志详情表';

-- ----------------------------
-- 10. 在线用户表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_online_users (
    id          INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    user_id     INT DEFAULT 0 COMMENT '用户ID',
    username    VARCHAR(64) NOT NULL COMMENT '用户名',
    ip          VARCHAR(64) COMMENT '来源IP',
    address     VARCHAR(128) COMMENT '地点',
    `system`    VARCHAR(64) COMMENT '操作系统',
    browser     VARCHAR(64) COMMENT '浏览器',
    login_time  DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='在线用户表';

-- ============================================================
-- Seed Data
-- ============================================================

INSERT IGNORE INTO sys_configs (config_key, config_value, description) VALUES
('Version', '7.0.0', '系统版本'),
('Title', 'PureAdmin', '系统标题'),
('FixedHeader', 'true', '固定头部'),
('HiddenSideBar', 'false', '隐藏侧边栏'),
('MultiTagsCache', 'false', '多标签缓存'),
('KeepAlive', 'true', '页面缓存'),
('Locale', 'zh', '默认语言'),
('Layout', 'vertical', '布局模式'),
('Theme', 'light', '主题色'),
('DarkMode', 'false', '深色模式'),
('ThemeMode', 'light', '主题模式'),
('Grey', 'false', '灰色模式'),
('Weak', 'false', '色弱模式'),
('HideTabs', 'false', '隐藏标签页'),
('HideFooter', 'false', '隐藏底部'),
('Stretch', 'false', '内容拉伸'),
('SidebarStatus', 'true', '侧边栏状态'),
('EpThemeColor', '#409EFF', 'Element主题色'),
('ShowLogo', 'true', '显示Logo'),
('Watermark', 'false', '水印'),
('TagsStyle', 'chrome', '标签风格'),
('TooltipEffect', 'light', '提示效果'),
('ResponsiveStorageNameSpace', 'responsive-', '存储命名空间'),
('MenuSearchHistory', '6', '菜单搜索历史'),
('CachingAsyncRoutes', 'false', '缓存动态路由');

-- 密码: admin123
INSERT IGNORE INTO sys_users (id, username, password, avatar, email, status, remark) VALUES
(1, 'admin', '$2a$10$dvAenDGUE2prXBAKMuhpj.ALgUIIZP59GeeMp/QXqh5QonPgYsZMK', 'https://avatars.githubusercontent.com/u/44761321', 'admin@pureadmin.cn', 1, '管理员'),
(2, 'common', '$2a$10$dvAenDGUE2prXBAKMuhpj.ALgUIIZP59GeeMp/QXqh5QonPgYsZMK', 'https://avatars.githubusercontent.com/u/52823142', 'common@pureadmin.cn', 1, '普通用户');

INSERT IGNORE INTO sys_roles (id, name, code, status, remark) VALUES
(1, '超级管理员', 'admin', 1, '超级管理员，拥有全部权限'),
(2, '普通角色', 'common', 1, '普通角色，拥有有限的权限');

INSERT IGNORE INTO sys_user_roles (user_id, role_id) VALUES
(1, 1),
(2, 2);

INSERT IGNORE INTO sys_api_permissions
    (code, name, module, method, path, sort)
VALUES
('api:auth:logout', '退出登录', '认证', 'POST', '/logout', 10),
('api:user:list', '查询用户', '用户管理', 'POST', '/user', 10),
('api:user:create', '创建用户', '用户管理', 'POST', '/user/create', 20),
('api:user:update', '修改用户', '用户管理', 'POST', '/user/update', 30),
('api:user:delete', '删除用户', '用户管理', 'POST', '/user/delete', 40),
('api:user:batch-delete', '批量删除用户', '用户管理', 'POST', '/user/batch-delete', 50),
('api:user:reset-password', '重置用户密码', '用户管理', 'POST', '/user/reset-password', 60),
('api:user:list-roles', '查询角色选项', '用户管理', 'GET', '/list-all-role', 70),
('api:user:list-role-ids', '查询用户角色', '用户管理', 'POST', '/list-role-ids', 80),
('api:user:upload-avatar', '上传用户头像', '用户管理', 'POST', '/upload/avatar', 90),
('api:role:list', '查询角色', '角色管理', 'POST', '/role', 10),
('api:role:create', '创建角色', '角色管理', 'POST', '/role/create', 20),
('api:role:update', '修改角色', '角色管理', 'POST', '/role/update', 30),
('api:role:delete', '删除角色', '角色管理', 'POST', '/role/delete', 40),
('api:role:list-menu', '查询角色菜单', '角色管理', 'POST', '/role-menu', 50),
('api:role:get-menu-ids', '查询角色菜单ID', '角色管理', 'POST', '/role-menu-ids', 60),
('api:role:list-api-permissions', '查询接口权限', '角色管理', 'GET', '/role-api-permissions', 70),
('api:role:create-api-permission', '新增接口权限', '角色管理', 'POST', '/role-api-permissions/create', 80),
('api:role:update-api-permission', '修改接口权限', '角色管理', 'POST', '/role-api-permissions/update', 90),
('api:role:save-menu', '保存角色菜单', '角色管理', 'POST', '/role/save-menu', 110),
('api:role:save-api-permissions', '保存角色接口权限', '角色管理', 'POST', '/role/save-api-permissions', 120),
('api:menu:list', '查询菜单', '菜单管理', 'POST', '/menu', 10),
('api:menu:create', '创建菜单', '菜单管理', 'POST', '/menu/create', 20),
('api:menu:update', '修改菜单', '菜单管理', 'POST', '/menu/update', 30),
('api:menu:delete', '删除菜单', '菜单管理', 'POST', '/menu/delete', 40),
('api:menu:get-routes', '查询动态路由', '菜单管理', 'GET', '/get-async-routes', 50),
('api:monitor:online-list', '查询在线用户', '在线用户', 'POST', '/online-logs', 10),
('api:monitor:force-offline', '强制下线用户', '在线用户', 'POST', '/online-logs/force-offline', 20),
('api:monitor:login-list', '查询登录日志', '登录日志', 'POST', '/login-logs', 10),
('api:monitor:login-delete', '删除登录日志', '登录日志', 'POST', '/login-logs/delete', 20),
('api:monitor:login-clear', '清空登录日志', '登录日志', 'POST', '/login-logs/clear', 30),
('api:monitor:system-list', '查询系统日志', '系统日志', 'POST', '/system-logs', 10),
('api:monitor:system-detail', '查询系统日志详情', '系统日志', 'POST', '/system-logs-detail', 20),
('api:monitor:system-delete', '删除系统日志', '系统日志', 'POST', '/system-logs/delete', 30),
('api:monitor:system-clear', '清空系统日志', '系统日志', 'POST', '/system-logs/clear', 40),
('api:dashboard:cards', '查询首页卡片', '首页', 'POST', '/get-card-list', 10),
('api:dashboard:map', '查询首页地图', '首页', 'GET', '/get-map-info', 20),
('api:mine:get', '查询个人信息', '个人中心', 'GET', '/mine', 10),
('api:mine:update', '修改个人信息', '个人中心', 'POST', '/mine/update', 20),
('api:mine:reset-password', '修改个人密码', '个人中心', 'POST', '/mine/reset-password', 30),
('api:mine:upload-avatar', '上传个人头像', '个人中心', 'POST', '/mine/upload/avatar', 40);

INSERT IGNORE INTO sys_role_api_permissions (role_id, api_permission_id)
SELECT r.id, p.id
FROM sys_roles r
JOIN sys_api_permissions p ON r.code = 'admin';

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

INSERT IGNORE INTO sys_pages (id, parent_id, menu_type, title, name, path, component, `rank`, icon, auths, status) VALUES
(1, 0, 0, 'menus.pureHome', 'Home', '/', 'layout/index.vue', 0, 'ep/home-filled', NULL, 1),
(2, 1, 0, 'menus.pureHome', 'Welcome', '/welcome', 'views/welcome/index.vue', 0, NULL, NULL, 1),
(5, 0, 0, 'menus.pureSysManagement', NULL, '/system', NULL, 2, 'ri/settings-3-line', NULL, 1),
(6, 5, 0, 'menus.pureUser', 'SystemUser', '/system/user/index', 'views/system/user/index.vue', 1, 'ri/admin-line', NULL, 1),
(7, 5, 0, 'menus.pureRole', 'SystemRole', '/system/role/index', 'views/system/role/index.vue', 2, 'ri/admin-fill', NULL, 1),
(8, 5, 0, 'menus.pureSystemMenu', 'SystemMenu', '/system/menu/index', 'views/system/menu/index.vue', 3, 'ep/menu', NULL, 1),
(9, 0, 0, 'menus.pureSysMonitor', NULL, '/monitor', NULL, 3, 'ep/monitor', NULL, 1),
(10, 9, 0, 'menus.pureOnlineUser', 'OnlineUser', '/monitor/online-user', 'views/monitor/online/index.vue', 1, 'ri/user-voice-line', NULL, 1),
(11, 9, 0, 'menus.pureLoginLog', 'LoginLog', '/monitor/login-logs', 'views/monitor/logs/login/index.vue', 2, 'ri/window-line', NULL, 1),
(13, 9, 0, 'menus.pureSystemLog', 'SystemLog', '/monitor/system-logs', 'views/monitor/logs/system/index.vue', 4, 'ri/file-search-line', NULL, 1);

INSERT IGNORE INTO sys_pages (id, parent_id, menu_type, title, `rank`, auths, status) VALUES
(100, 2, 1, '查看详情', 1, 'welcome:view', 1),
(101, 6, 1, '新增用户', 1, 'system-user:add', 1),
(102, 6, 1, '批量删除', 2, 'system-user:batch-delete', 1),
(103, 6, 1, '修改', 3, 'system-user:edit', 1),
(104, 6, 1, '删除', 4, 'system-user:delete', 1),
(105, 6, 1, '上传头像', 5, 'system-user:upload-avatar', 1),
(106, 6, 1, '重置密码', 6, 'system-user:reset-password', 1),
(122, 6, 1, '分配角色', 7, 'system-user:assign-role', 1),
(107, 7, 1, '新增角色', 1, 'system-role:add', 1),
(108, 7, 1, '修改', 2, 'system-role:edit', 1),
(109, 7, 1, '删除', 3, 'system-role:delete', 1),
(110, 7, 1, '权限', 4, 'system-role:configure-permission', 1),
(111, 7, 1, '保存权限配置', 5, 'system-role:save-permission', 1),
(112, 8, 1, '新增菜单', 1, 'system-menu:add', 1),
(113, 8, 1, '修改', 2, 'system-menu:edit', 1),
(114, 8, 1, '新增子菜单', 3, 'system-menu:add-child', 1),
(115, 8, 1, '删除', 4, 'system-menu:delete', 1),
(116, 11, 1, '清空日志', 1, 'login-log:clear', 1),
(117, 11, 1, '批量删除', 2, 'login-log:batch-delete', 1),
(118, 13, 1, '清空日志', 1, 'system-log:clear', 1),
(119, 13, 1, '批量删除', 2, 'system-log:batch-delete', 1),
(120, 13, 1, '详情', 3, 'system-log:view', 1),
(121, 10, 1, '强退', 1, 'online-user:force-logout', 1);

INSERT IGNORE INTO sys_role_pages (role_id, page_id)
SELECT 1, id FROM sys_pages;

INSERT IGNORE INTO sys_role_pages (role_id, page_id) VALUES
(2, 1),
(2, 2);

INSERT IGNORE INTO sys_login_logs (id, user_id, username, ip, address, `system`, browser, status, login_time) VALUES
(1, 1, 'admin', '192.168.1.100', '中国河南省信阳市', 'macOS', 'Chrome', 1, '2025-01-01 09:00:00'),
(2, 2, 'common', '192.168.1.101', '中国广东省深圳市', 'Windows', 'Firefox', 1, '2025-01-01 09:30:00');

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_configs_key ON sys_configs(config_key);
CREATE INDEX idx_users_username ON sys_users(username);
CREATE INDEX idx_roles_code ON sys_roles(code);
CREATE INDEX idx_roles_home_page_id ON sys_roles(home_page_id);
CREATE INDEX idx_user_roles_user_id ON sys_user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON sys_user_roles(role_id);
CREATE INDEX idx_pages_parent_id ON sys_pages(parent_id);
CREATE INDEX idx_role_pages_role_id ON sys_role_pages(role_id);
CREATE INDEX idx_role_pages_page_id ON sys_role_pages(page_id);
CREATE INDEX idx_login_logs_username ON sys_login_logs(username);
CREATE INDEX idx_system_logs_username ON sys_system_logs(username);
CREATE INDEX idx_system_logs_module ON sys_system_logs(module);
CREATE INDEX idx_system_log_details_log_id ON sys_system_log_details(log_id);
CREATE INDEX idx_online_users_username ON sys_online_users(username);
