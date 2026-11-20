CREATE TABLE `sys_api_permissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `code` varchar(128) NOT NULL,
  `name` varchar(128) NOT NULL,
  `module` varchar(64) NOT NULL,
  `method` varchar(16) NOT NULL,
  `path` varchar(255) NOT NULL,
  `status` tinyint DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `description` varchar(255),
  `sort` int DEFAULT 0,
  CONSTRAINT `sys_api_permissions_id` PRIMARY KEY(`id`),
  CONSTRAINT `uk_api_permissions_code` UNIQUE(`code`),
  CONSTRAINT `uk_api_permissions_method_path` UNIQUE(`method`,`path`)
);
--> statement-breakpoint
CREATE TABLE `sys_role_api_permissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `role_id` int NOT NULL,
  `api_permission_id` int NOT NULL,
  CONSTRAINT `sys_role_api_permissions_id` PRIMARY KEY(`id`),
  CONSTRAINT `uk_role_api_permission` UNIQUE(`role_id`,`api_permission_id`)
);
--> statement-breakpoint
ALTER TABLE `sys_role_api_permissions`
  ADD CONSTRAINT `sys_role_api_permissions_role_id_sys_roles_id_fk`
  FOREIGN KEY (`role_id`) REFERENCES `sys_roles`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `sys_role_api_permissions`
  ADD CONSTRAINT `sys_role_api_permissions_api_permission_id_sys_api_permissions_id_fk`
  FOREIGN KEY (`api_permission_id`) REFERENCES `sys_api_permissions`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `idx_api_permissions_module` ON `sys_api_permissions` (`module`);
--> statement-breakpoint
CREATE INDEX `idx_role_api_permissions_role_id` ON `sys_role_api_permissions` (`role_id`);
--> statement-breakpoint
CREATE INDEX `idx_role_api_permissions_api_id` ON `sys_role_api_permissions` (`api_permission_id`);
--> statement-breakpoint
INSERT INTO `sys_api_permissions`
  (`code`, `name`, `module`, `method`, `path`, `sort`)
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
--> statement-breakpoint
INSERT INTO `sys_role_api_permissions` (`role_id`, `api_permission_id`)
SELECT r.id, p.id
FROM `sys_roles` r
JOIN `sys_api_permissions` p ON r.code = 'admin';
--> statement-breakpoint
INSERT INTO `sys_role_api_permissions` (`role_id`, `api_permission_id`)
SELECT r.id, p.id
FROM `sys_roles` r
JOIN `sys_api_permissions` p ON r.code = 'common'
WHERE p.code IN (
  'api:auth:logout',
  'api:menu:get-routes',
  'api:dashboard:cards',
  'api:dashboard:map',
  'api:mine:get',
  'api:mine:update',
  'api:mine:reset-password',
  'api:mine:upload-avatar'
);