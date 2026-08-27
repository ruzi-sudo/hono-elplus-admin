SET @home_page_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sys_roles'
    AND COLUMN_NAME = 'home_page_id'
);
SET @add_home_page_column = IF(
  @home_page_column_exists = 0,
  'ALTER TABLE sys_roles ADD COLUMN home_page_id INT NULL COMMENT ''角色登录首页页面ID'' AFTER remark',
  'SELECT 1'
);
PREPARE add_home_page_column_stmt FROM @add_home_page_column;
EXECUTE add_home_page_column_stmt;
DEALLOCATE PREPARE add_home_page_column_stmt;

SET @home_page_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sys_roles'
    AND INDEX_NAME = 'idx_roles_home_page_id'
);
SET @add_home_page_index = IF(
  @home_page_index_exists = 0,
  'CREATE INDEX idx_roles_home_page_id ON sys_roles(home_page_id)',
  'SELECT 1'
);
PREPARE add_home_page_index_stmt FROM @add_home_page_index;
EXECUTE add_home_page_index_stmt;
DEALLOCATE PREPARE add_home_page_index_stmt;
