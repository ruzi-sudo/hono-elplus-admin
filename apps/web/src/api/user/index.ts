import { http } from "@/utils/http";
import type {
  LoginRequest,
  OperationResult,
  RefreshTokenRequest,
  RefreshTokenResult,
  RegisterRequest,
  ResetMinePasswordRequest,
  UpdateMineRequest,
  UserInfoResult,
  UserResult,
} from "./schema";

/** 登录 */
export const getLogin = (data: LoginRequest) => {
  return http.request<UserResult>("post", "/api/login", { data });
};

/** 注册 */
export const registerApi = (data: RegisterRequest) => {
  return http.request<OperationResult>("post", "/api/register", { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data: RefreshTokenRequest) => {
  return http.request<RefreshTokenResult>("post", "/api/refresh-token", {
    data,
  });
};

/** 退出登录 */
export const logoutApi = () => {
  return http.request<OperationResult>("post", "/api/logout");
};

/** 账户设置-个人信息 */
export const getMine = () => {
  return http.request<UserInfoResult>("get", "/api/mine");
};

/** 更新当前登录用户的个人信息 */
export const updateMine = (data: UpdateMineRequest) => {
  return http.request<OperationResult>("post", "/api/mine/update", { data });
};

/** 更新当前登录用户的密码 */
export const resetMinePassword = (data: ResetMinePasswordRequest) => {
  return http.request<OperationResult>("post", "/api/mine/reset-password", {
    data,
  });
};

export type * from "./schema";
