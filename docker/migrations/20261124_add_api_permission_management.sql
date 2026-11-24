-- 独立接口权限管理：保留已有角色的页面、按钮和接口授权。
START TRANSACTION;

INSERT IGNORE INTO sys_api_permissions (code, name, module, method, path, sort) VALUES
  ('api:role:list-api-permission-roles', '查询接口授权角色', '接口权限管理', 'GET', '/role-api-permissions/roles', 10),
  ('api:role:get-api-permission-ids', '查询角色接口授权', '接口权限管理', 'POST', '/role-api-permission-ids', 20);

UPDATE sys_api_permissions
SET module = '接口权限管理'
WHERE module = '角色管理' AND code IN (
  'api:role:list-api-permissions',
  'api:role:create-api-permission',
  'api:role:update-api-permission',
  'api:role:save-api-permissions'
);

INSERT INTO sys_pages (parent_id, menu_type, title, name, path, component, `rank`, icon, status)
SELECT parent.id, 0, 'menus.pureApiPermission', 'SystemApiPermission',
       '/system/api-permission/index', 'views/system/api-permission/index.vue', 4,
       'ri/shield-keyhole-line', 1
FROM sys_pages parent
WHERE parent.menu_type = 0 AND parent.path = '/system'
  AND NOT EXISTS (
    SELECT 1 FROM sys_pages page
    WHERE page.name = 'SystemApiPermission' OR page.path = '/system/api-permission/index'
  )
ORDER BY parent.id
LIMIT 1;

INSERT IGNORE INTO sys_role_pages (role_id, page_id)
SELECT role_row.id, page.id
FROM sys_roles role_row
JOIN sys_pages page ON page.name = 'SystemApiPermission'
  AND page.path = '/system/api-permission/index'
WHERE role_row.code = 'admin';

INSERT IGNORE INTO sys_role_api_permissions (role_id, api_permission_id)
SELECT role_row.id, permission.id
FROM sys_roles role_row
JOIN sys_api_permissions permission ON permission.code IN (
  'api:role:list-api-permission-roles', 'api:role:get-api-permission-ids'
)
WHERE role_row.code = 'admin';

COMMIT;
