import { http } from "@/utils/http";
import type {
  ApiPermission,
  ApiPermissionDefinition,
  ApiPermissionRolesResult,
  BatchUserRequest,
  CreateMenuRequest,
  CreateRoleRequest,
  CreateUserRequest,
  IdResult,
  LoginLog,
  MenuItem,
  MonitorListQuery,
  OnlineUser,
  OperationResult,
  ResetUserPasswordRequest,
  Result,
  ResultTable,
  RoleListItem,
  RoleListQuery,
  RoleMenuItem,
  RoleMenuRequest,
  RoleApiPermissionResult,
  RoleOption,
  RolePermissionRequest,
  RoleMenuPermissionResult,
  SystemLog,
  SystemLogDetailResult,
  UpdateMenuRequest,
  UpdateRoleRequest,
  UpdateUserRequest,
  UserIdRequest,
  UserListItem,
  UserListQuery,
  UserRoleIdsRequest,
} from "./schema";

/** 获取系统管理-用户管理列表 */
export const getUserList = (data?: UserListQuery) => {
  return http.request<ResultTable<UserListItem>>("post", "/api/user", { data });
};

/** 新增用户 */
export const createUser = (data: CreateUserRequest) => {
  return http.request<IdResult>("post", "/api/user/create", { data });
};

/** 修改用户 */
export const updateUser = (data: UpdateUserRequest) => {
  return http.request<OperationResult>("post", "/api/user/update", { data });
};

/** 删除用户 */
export const deleteUser = (data: UserIdRequest) => {
  return http.request<OperationResult>("post", "/api/user/delete", { data });
};

/** 批量删除用户 */
export const batchDeleteUser = (data: BatchUserRequest) => {
  return http.request<OperationResult>("post", "/api/user/batch-delete", {
    data,
  });
};

/** 重置密码 */
export const resetPassword = (data: ResetUserPasswordRequest) => {
  return http.request<OperationResult>("post", "/api/user/reset-password", {
    data,
  });
};

/** 系统管理-用户管理-获取所有角色列表 */
export const getAllRoleList = () => {
  return http.request<Result<RoleOption[]>>("get", "/api/list-all-role");
};

/** 系统管理-用户管理-根据userId，获取对应角色id列表（userId：用户id） */
export const getRoleIds = (data: UserRoleIdsRequest) => {
  return http.request<Result<number[]>>("post", "/api/list-role-ids", { data });
};

/** 获取系统管理-角色管理列表 */
export const getRoleList = (data?: RoleListQuery) => {
  return http.request<ResultTable<RoleListItem>>("post", "/api/role", { data });
};

/** 新增角色 */
export const createRole = (data: CreateRoleRequest) => {
  return http.request<IdResult>("post", "/api/role/create", { data });
};

/** 修改角色 */
export const updateRole = (data: UpdateRoleRequest) => {
  return http.request<OperationResult>("post", "/api/role/update", { data });
};

/** 删除角色 */
export const deleteRole = (data: UserIdRequest) => {
  return http.request<OperationResult>("post", "/api/role/delete", { data });
};

/** 保存角色菜单权限 */
export const saveRoleMenu = (data: RoleMenuRequest) => {
  return http.request<OperationResult>("post", "/api/role/save-menu", { data });
};

/** 获取角色菜单权限ID */
export const getRoleMenuIds = (data: RolePermissionRequest) => {
  return http.request<RoleMenuPermissionResult>("post", "/api/role-menu-ids", {
    data,
  });
};

/** 获取接口权限目录。 */
export const listApiPermissions = () => {
  return http.request<Result<ApiPermission[]>>(
    "get",
    "/api/role-api-permissions",
  );
};

export const createApiPermission = (data: ApiPermissionDefinition) => {
  return http.request<IdResult>("post", "/api/role-api-permissions/create", {
    data,
  });
};

export const updateApiPermission = (
  data: Partial<ApiPermissionDefinition> & { id: number },
) => {
  return http.request<OperationResult>(
    "post",
    "/api/role-api-permissions/update",
    { data },
  );
};

/** 获取可配置的角色列表。 */
export const listApiPermissionRoles = () => {
  return http.request<ApiPermissionRolesResult>(
    "get",
    "/api/role-api-permissions/roles",
  );
};

/** 查询角色已分配的接口权限。 */
export const getRoleApiPermissionIds = (data: RolePermissionRequest) => {
  return http.request<RoleApiPermissionResult>(
    "post",
    "/api/role-api-permission-ids",
    { data },
  );
};

/** 保存角色接口权限。 */
export const saveRoleApiPermissions = (data: {
  id: number;
  apiPermissionIds: number[];
}) => {
  return http.request<OperationResult>(
    "post",
    "/api/role/save-api-permissions",
    { data },
  );
};

/** 获取系统管理-菜单管理列表 */
export const getMenuList = () => {
  return http.request<Result<MenuItem[]>>("post", "/api/menu");
};

/** 新增菜单 */
export const createMenu = (data: CreateMenuRequest) => {
  return http.request<IdResult>("post", "/api/menu/create", { data });
};

/** 修改菜单 */
export const updateMenu = (data: UpdateMenuRequest) => {
  return http.request<OperationResult>("post", "/api/menu/update", { data });
};

/** 删除菜单 */
export const deleteMenu = (data: UserIdRequest) => {
  return http.request<OperationResult>("post", "/api/menu/delete", { data });
};

/** 获取系统监控-在线用户列表 */
export const getOnlineLogsList = (data?: MonitorListQuery) => {
  return http.request<ResultTable<OnlineUser>>("post", "/api/online-logs", {
    data,
  });
};

/** 获取系统监控-登录日志列表 */
export const getLoginLogsList = (data?: MonitorListQuery) => {
  return http.request<ResultTable<LoginLog>>("post", "/api/login-logs", {
    data,
  });
};

/** 获取系统监控-系统日志列表 */
export const getSystemLogsList = (data?: MonitorListQuery) => {
  return http.request<ResultTable<SystemLog>>("post", "/api/system-logs", {
    data,
  });
};

/** 获取系统监控-系统日志-根据 id 查日志详情 */
export const getSystemLogsDetail = (data: UserIdRequest) => {
  return http.request<SystemLogDetailResult>(
    "post",
    "/api/system-logs-detail",
    { data },
  );
};

/** 强退在线用户 */
export const forceOffline = (data: UserIdRequest) => {
  return http.request<OperationResult>(
    "post",
    "/api/online-logs/force-offline",
    { data },
  );
};

/** 删除系统日志 */
export const deleteSystemLogs = (data: BatchUserRequest) => {
  return http.request<OperationResult>("post", "/api/system-logs/delete", {
    data,
  });
};

/** 清空系统日志 */
export const clearSystemLogs = () => {
  return http.request<OperationResult>("post", "/api/system-logs/clear");
};

/** 删除登录日志 */
export const deleteLoginLogs = (data: BatchUserRequest) => {
  return http.request<OperationResult>("post", "/api/login-logs/delete", {
    data,
  });
};

/** 清空登录日志 */
export const clearLoginLogs = () => {
  return http.request<OperationResult>("post", "/api/login-logs/clear");
};

/** 获取角色管理-权限-菜单权限 */
export const getRoleMenu = () => {
  return http.request<Result<RoleMenuItem[]>>("post", "/api/role-menu");
};

export type * from "./schema";
