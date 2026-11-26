import { http } from "@/utils/http";

export type UserResult = {
  code: number;
  message: string;
  data: {
    /** 用户名 */
    username: string;
    /** 当前登录用户的角色 */
    /** 按钮级别权限 */
    permissions: Array<string>;
    /** 接口级别权限 */
    apiPermissions: Array<string>;
    /** 角色登录首页 */
    homePath: string;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type RefreshTokenResult = {
  code: number;
  message: string;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type UserInfo = {
  /** 用户ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 状态 */
  status: number;
  /** 角色ID */
  roleIds: number[];
  /** 当前登录用户的角色 */
  roles: string[];
  /** 当前登录用户的角色名称 */
  roleNames: string[];
  /** 备注 */
  remark: string;
  /** 简介 */
  description: string;
};

export type UserInfoResult = {
  code: number;
  message: string;
  data: UserInfo;
};

type Result = {
  code: number;
  message: string;
  data?: any;
};

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", "/api/login", { data });
};

/** 注册 */
export const registerApi = (data?: object) => {
  return http.request<Result>("post", "/api/register", { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/api/refresh-token", {
    data,
  });
};

/** 退出登录 */
export const logoutApi = () => {
  return http.request<Result>("post", "/api/logout");
};

/** 账户设置-个人信息 */
export const getMine = (data?: object) => {
  return http.request<UserInfoResult>("get", "/api/mine", { data });
};

/** 更新当前登录用户的个人信息 */
export const updateMine = (data?: object) => {
  return http.request<Result>("post", "/api/mine/update", { data });
};

/** 更新当前登录用户的密码 */
export const resetMinePassword = (data?: object) => {
  return http.request<Result>("post", "/api/mine/reset-password", { data });
};
