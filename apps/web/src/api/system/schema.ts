export type Result<T = Record<string, unknown>> = {
  code: number;
  message: string;
  data: T;
};

export type ResultTable<T> = Result<{
  list: T[];
  total: number;
  pageSize: number;
  currentPage: number;
}>;

export type SortOrder = "asc" | "desc";

export type IdResult = Result<{ id: number }>;
export type OperationResult = Result<Record<string, unknown>>;

export type UserListQuery = {
  username?: string;
  status?: number | string;
  email?: string | null;
  sortBy?: "createTime";
  sortOrder?: SortOrder;
  pageNum?: number;
  pageSize?: number;
};

export type UserListItem = {
  id: number;
  username: string;
  email: string;
  status: number;
  roleIds: number[];
  roles: string[];
  remark: string;
  createTime: number;
};

export type CreateUserRequest = {
  username: string;
  password: string;
  email: string;
  status?: number;
  roleIds?: number[];
  remark?: string;
};

export type UpdateUserRequest = {
  id: number;
  username?: string;
  email?: string;
  status?: number;
  roleIds?: number[];
  remark?: string;
};

export type UserIdRequest = { id: number };
export type BatchUserRequest = { ids: number[] };
export type ResetUserPasswordRequest = { id: number; password: string };

export type RoleOption = { id: number; name: string };
export type UserRoleIdsRequest = { userId: number };

export type RoleListQuery = {
  name?: string;
  status?: number | string;
  code?: string | string[];
  sortBy?: "createTime";
  sortOrder?: SortOrder;
  pageNum?: number;
  pageSize?: number;
};

export type RoleListItem = {
  id: number;
  name: string;
  code: string;
  status: number;
  remark: string;
  createTime: number;
  updateTime: number;
};

export type CreateRoleRequest = {
  name: string;
  code: string;
  status?: number;
  remark?: string;
};

export type UpdateRoleRequest = {
  id: number;
  name?: string;
  code?: string;
  status?: number;
  remark?: string;
};

export type RoleMenuRequest = {
  id: number;
  menuIds: number[];
  homePageId: number | null;
};

export type RolePermissionRequest = { id: number };
export type RoleMenuPermissionData = {
  menuIds: number[];
  homePageId: number | null;
};
export type RoleMenuPermissionResult = Result<RoleMenuPermissionData>;

export type ApiPermissionRole = {
  id: number;
  name: string;
  code: string;
  status: number;
};

export type ApiPermission = {
  id: number;
  code: string;
  name: string;
  module: string;
  method: string;
  path: string;
  description: string | null;
  sort: number | null;
  status: number | null;
  assignable: boolean;
};

export type ApiPermissionRolesResult = Result<ApiPermissionRole[]>;

export type ApiPermissionDefinition = {
  code: string;
  name: string;
  module: string;
  method: string;
  path: string;
  description?: string;
  sort?: number;
  status?: number;
};

export type RoleApiPermissionData = { apiPermissionIds: number[] };
export type RoleApiPermissionResult = Result<RoleApiPermissionData>;

export type MenuFlag = boolean | number;

export type MenuItem = {
  parentId: number;
  id: number;
  menuType: number;
  title: string;
  name: string;
  path: string;
  component: string;
  rank: number | null;
  redirect: string;
  icon: string;
  extraIcon: string;
  enterTransition: string;
  leaveTransition: string;
  activePath: string;
  auths: string;
  keepAlive: boolean;
  hiddenTag: boolean;
  fixedTag: boolean;
  showLink: boolean;
  showParent: boolean;
  status: number;
  children?: MenuItem[];
};

export type RoleMenuItem = {
  parentId: number;
  id: number;
  menuType: number;
  title: string;
  path: string;
  component: string;
  status: number;
  children?: RoleMenuItem[];
};

export type CreateMenuRequest = {
  parentId?: number;
  menuType?: number;
  title: string;
  name?: string;
  path?: string;
  component?: string;
  rank?: number;
  redirect?: string;
  icon?: string;
  extraIcon?: string;
  enterTransition?: string;
  leaveTransition?: string;
  activePath?: string;
  auths?: string;
  keepAlive?: MenuFlag;
  hiddenTag?: MenuFlag;
  fixedTag?: MenuFlag;
  showLink?: MenuFlag;
  showParent?: MenuFlag;
  status?: number;
};

export type UpdateMenuRequest = Partial<CreateMenuRequest> & { id: number };

export type MonitorListQuery = {
  username?: string;
  status?: number | string;
  module?: string;
  sortBy?: "loginTime" | "requestTime";
  sortOrder?: SortOrder;
  pageNum?: number;
  pageSize?: number;
};

export type OnlineUser = {
  id: number;
  userId: number;
  username: string;
  ip: string;
  address: string;
  system: string;
  browser: string;
  loginTime: string;
};

export type LoginLog = OnlineUser & {
  status: number;
  behavior: string;
};

export type SystemLog = {
  id: number;
  userId: number;
  username: string;
  level: number;
  module: string;
  url: string;
  method: string;
  ip: string;
  address: string;
  system: string;
  browser: string;
  takesTime: number;
  requestTime: string;
};

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type SystemLogDetail = SystemLog & {
  responseHeaders: Record<string, string>;
  responseBody: JsonValue;
  requestHeaders: Record<string, string>;
  requestBody: JsonValue;
  traceId: string;
};

export type SystemLogDetailResult = {
  code: number;
  message: string;
} & SystemLogDetail;
