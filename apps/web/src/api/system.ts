import { http } from "@/utils/http";

type Result<T = unknown> = {
  code: number;
  message: string;
  data?: T;
};

type ResultTable = {
  code: number;
  message: string;
  data?: {
    /** 列表数据 */
    list: Array<any>;
    /** 总条目数 */
    total?: number;
    /** 每页显示条目个数 */
    pageSize?: number;
    /** 当前页数 */
    currentPage?: number;
  };
};

type RoleMenuPermissionResult = {
  code: number;
  message: string;
  data?: {
    menuIds: number[];
    homePageId: number | null;
  };
};
type RoleApiPermissionResult = {
  code: number;
  message: string;
  data?: {
    apiPermissionIds: number[];
  };
};

export type ApiPermission = {
  id: number;
  code: string;
  name: string;
  module: string;
  method: string;
  path: string;
  description?: string | null;
  sort?: number | null;
  status?: number | null;
  assignable: boolean;
};

export type ApiPermissionRole = {
  id: number;
  name: string;
  code: string;
  status: number;
};

export type ApiPermissionRolesResult = Result<ApiPermissionRole[]>;

type ApiPermissionDefinition = {
  code: string;
  name: string;
  module: string;
  method: string;
  path: string;
  description?: string;
  sort?: number;
  status?: number;
};

/** 获取系统管理-用户管理列表 */
export const getUserList = (data?: object) => {
  return http.request<ResultTable>("post", "/api/user", { data });
};

/** 新增用户 */
export const createUser = (data?: object) => {
  return http.request<Result>("post", "/api/user/create", { data });
};

/** 修改用户 */
export const updateUser = (data?: object) => {
  return http.request<Result>("post", "/api/user/update", { data });
};

/** 删除用户 */
export const deleteUser = (data?: object) => {
  return http.request<Result>("post", "/api/user/delete", { data });
};

/** 批量删除用户 */
export const batchDeleteUser = (data?: object) => {
  return http.request<Result>("post", "/api/user/batch-delete", { data });
};

/** 重置密码 */
export const resetPassword = (data?: object) => {
  return http.request<Result>("post", "/api/user/reset-password", { data });
};

/** 获取系统管理-用户管理-获取所有角色列表 */

/** 系统管理-用户管理-获取所有角色列表 */
export const getAllRoleList = () => {
  return http.request<Result>("get", "/api/list-all-role");
};

/** 系统管理-用户管理-根据userId，获取对应角色id列表（userId：用户id） */
export const getRoleIds = (data?: object) => {
  return http.request<Result>("post", "/api/list-role-ids", { data });
};

/** 获取系统管理-角色管理列表 */
export const getRoleList = (data?: object) => {
  return http.request<ResultTable>("post", "/api/role", { data });
};

/** 新增角色 */
export const createRole = (data?: object) => {
  return http.request<Result>("post", "/api/role/create", { data });
};

/** 修改角色 */
export const updateRole = (data?: object) => {
  return http.request<Result>("post", "/api/role/update", { data });
};

/** 删除角色 */
export const deleteRole = (data?: object) => {
  return http.request<Result>("post", "/api/role/delete", { data });
};

/** 保存角色菜单权限 */
export const saveRoleMenu = (data: { id: number; menuIds: number[]; homePageId: number | null }) => {
  return http.request<Result>("post", "/api/role/save-menu", { data });
};

/** 获取角色菜单权限ID */
export const getRoleMenuIds = (data: { id: number }) => {
  return http.request<RoleMenuPermissionResult>(
    "post",
    "/api/role-menu-ids",
    { data },
  );
};

/** 获取接口权限目录。 */
export const listApiPermissions = () => {
  return http.request<Result<ApiPermission[]>>("get", "/api/role-api-permissions");
};

export const createApiPermission = (data: ApiPermissionDefinition) => {
  return http.request<Result>("post", "/api/role-api-permissions/create", { data });
};

export const updateApiPermission = (data: Partial<ApiPermissionDefinition> & { id: number }) => {
  return http.request<Result>("post", "/api/role-api-permissions/update", { data });
};

/** 获取可配置的角色列表。 */
export const listApiPermissionRoles = () => {
  return http.request<ApiPermissionRolesResult>("get", "/api/role-api-permissions/roles");
};

/** 查询角色已分配的接口权限。 */
export const getRoleApiPermissionIds = (data: { id: number }) => {
  return http.request<RoleApiPermissionResult>(
    "post",
    "/api/role-api-permission-ids",
    { data },
  );
};

/** 保存角色接口权限。 */
export const saveRoleApiPermissions = (data: { id: number; apiPermissionIds: number[] }) => {
  return http.request<Result>("post", "/api/role/save-api-permissions", { data });
};

/** 获取系统管理-菜单管理列表 */
export const getMenuList = (data?: object) => {
  return http.request<Result>("post", "/api/menu", { data });
};

/** 新增菜单 */
export const createMenu = (data?: object) => {
  return http.request<Result>("post", "/api/menu/create", { data });
};

/** 修改菜单 */
export const updateMenu = (data?: object) => {
  return http.request<Result>("post", "/api/menu/update", { data });
};

/** 删除菜单 */
export const deleteMenu = (data?: object) => {
  return http.request<Result>("post", "/api/menu/delete", { data });
};

/** 获取系统监控-在线用户列表 */
export const getOnlineLogsList = (data?: object) => {
  return http.request<ResultTable>("post", "/api/online-logs", { data });
};

/** 获取系统监控-登录日志列表 */
export const getLoginLogsList = (data?: object) => {
  return http.request<ResultTable>("post", "/api/login-logs", { data });
};

/** 获取系统监控-系统日志列表 */
export const getSystemLogsList = (data?: object) => {
  return http.request<ResultTable>("post", "/api/system-logs", { data });
};

/** 获取系统监控-系统日志-根据 id 查日志详情 */
export const getSystemLogsDetail = (data?: object) => {
  return http.request<Result>("post", "/api/system-logs-detail", { data });
};

/** 强退在线用户 */
export const forceOffline = (data?: object) => {
  return http.request<Result>("post", "/api/online-logs/force-offline", {
    data,
  });
};

/** 删除系统日志 */
export const deleteSystemLogs = (data?: object) => {
  return http.request<Result>("post", "/api/system-logs/delete", { data });
};

/** 清空系统日志 */
export const clearSystemLogs = () => {
  return http.request<Result>("post", "/api/system-logs/clear");
};

/** 删除登录日志 */
export const deleteLoginLogs = (data?: object) => {
  return http.request<Result>("post", "/api/login-logs/delete", { data });
};

/** 清空登录日志 */
export const clearLoginLogs = () => {
  return http.request<Result>("post", "/api/login-logs/clear");
};

/** 获取角色管理-权限-菜单权限 */
export const getRoleMenu = (data?: object) => {
  return http.request<Result>("post", "/api/role-menu", { data });
};
