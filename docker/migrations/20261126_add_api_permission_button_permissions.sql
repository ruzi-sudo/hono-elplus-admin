-- 接口权限管理页按钮权限
START TRANSACTION;

INSERT INTO sys_pages (parent_id, menu_type, title, `rank`, auths, status)
SELECT parent.id, 1, seed.title, seed.rank_value, seed.auths, 1
FROM (
  SELECT '新增接口' AS title, 1 AS rank_value, 'system-api-permission:add' AS auths
  UNION ALL
  SELECT '保存授权', 2, 'system-api-permission:save'
) AS seed
JOIN sys_pages parent
  ON parent.name = 'SystemApiPermission'
 AND parent.menu_type = 0
LEFT JOIN sys_pages existing ON existing.auths = seed.auths
WHERE existing.id IS NULL;

INSERT IGNORE INTO sys_role_pages (role_id, page_id)
SELECT role_row.id, page_row.id
FROM sys_roles role_row
JOIN sys_pages page_row
  ON page_row.auths IN (
    'system-api-permission:add',
    'system-api-permission:save'
  )
WHERE role_row.code = 'admin';

COMMIT;
