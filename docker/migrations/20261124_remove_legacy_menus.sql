-- 只识别旧版业务菜单和重复的动态账户设置入口。静态 /account-settings 路由不受影响。
CREATE TEMPORARY TABLE legacy_menu_ids (id INT PRIMARY KEY) ENGINE=InnoDB;

START TRANSACTION;

INSERT INTO legacy_menu_ids (id)
WITH RECURSIVE legacy_menus (id) AS (
  SELECT id
  FROM sys_pages
  WHERE menu_type = 0
    AND (
      (path = '/upstream' AND title = 'menus.Upstream')
      OR (path = '/tenant2' AND title = 'menus.pureTenant2')
      OR (path = '/workbench' AND title = 'menus.pureWorkbench')
      OR (path = '/reconciliation' AND title = 'menus.pureReconciliation')
      OR (path = '/system/service/index' AND title = 'menus.pureService')
      OR (path = '/upstream-config/index' AND title = 'menus.pureUpstreamConfig')
      OR (path = '/upstream-config/template-config' AND title = '模板配置')
      OR (path = '/system/account-settings' AND title = 'menus.pureAccountSettings')
    )
  UNION DISTINCT
  SELECT child.id
  FROM sys_pages child
  JOIN legacy_menus parent ON child.parent_id = parent.id
)
SELECT id FROM legacy_menus;

-- 移除失效的角色首页配置，登录时沿用首个可访问菜单的回退逻辑。
UPDATE sys_roles role_row
JOIN legacy_menu_ids legacy ON legacy.id = role_row.home_page_id
SET role_row.home_page_id = NULL;

DELETE role_page
FROM sys_role_pages role_page
JOIN legacy_menu_ids legacy ON legacy.id = role_page.page_id;

DELETE page
FROM sys_pages page
JOIN legacy_menu_ids legacy ON legacy.id = page.id;

COMMIT;

DROP TEMPORARY TABLE legacy_menu_ids;
