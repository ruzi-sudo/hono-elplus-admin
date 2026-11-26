-- 删除头像上传能力、头像存储内容和用户表头像字段。
ALTER TABLE sys_users DROP COLUMN avatar;

-- Better Auth 保留 image 字段以兼容其表结构，但不再存储用户头像内容。
UPDATE auth_users SET image = NULL WHERE image IS NOT NULL;

DELETE role_permission
FROM sys_role_api_permissions role_permission
INNER JOIN sys_api_permissions permission
  ON permission.id = role_permission.api_permission_id
WHERE permission.code IN ('api:user:upload-avatar', 'api:mine:upload-avatar');

DELETE FROM sys_api_permissions
WHERE code IN ('api:user:upload-avatar', 'api:mine:upload-avatar');

DELETE role_page
FROM sys_role_pages role_page
INNER JOIN sys_pages page_row ON page_row.id = role_page.page_id
WHERE page_row.auths = 'system-user:upload-avatar';

DELETE FROM sys_pages
WHERE auths = 'system-user:upload-avatar';
