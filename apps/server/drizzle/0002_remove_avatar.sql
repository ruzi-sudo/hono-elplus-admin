ALTER TABLE `sys_users` DROP COLUMN `avatar`;
--> statement-breakpoint
UPDATE `auth_users` SET `image` = NULL WHERE `image` IS NOT NULL;
--> statement-breakpoint
DELETE role_permission
FROM `sys_role_api_permissions` role_permission
INNER JOIN `sys_api_permissions` permission
  ON permission.id = role_permission.api_permission_id
WHERE permission.code IN ('api:user:upload-avatar', 'api:mine:upload-avatar');
--> statement-breakpoint
DELETE FROM `sys_api_permissions`
WHERE code IN ('api:user:upload-avatar', 'api:mine:upload-avatar');
--> statement-breakpoint
DELETE role_page
FROM `sys_role_pages` role_page
INNER JOIN `sys_pages` page_row ON page_row.id = role_page.page_id
WHERE page_row.auths = 'system-user:upload-avatar';
--> statement-breakpoint
DELETE FROM `sys_pages`
WHERE auths = 'system-user:upload-avatar';
