export type Result<T> = {
  code: number;
  message: string;
  data: T;
};

export type OperationResult = Result<Record<string, never>>;

export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type LoginResult = {
  username: string;
  roles: string[];
  permissions: string[];
  apiPermissions: string[];
  homePath: string;
  accessToken: string;
  refreshToken: string;
  expires: string;
};

export type UserResult = Result<LoginResult>;

export type RefreshTokenResult = Result<{
  accessToken: string;
  refreshToken: string;
  expires: string;
}>;

export type UserInfo = {
  id: number;
  username: string;
  email: string;
  status: number;
  roleIds: number[];
  roles: string[];
  roleNames: string[];
  remark: string;
  description: string;
};

export type UserInfoResult = Result<UserInfo>;

export type UpdateMineRequest = {
  username?: string;
  email?: string;
  remark?: string;
};

export type ResetMinePasswordRequest = {
  currentPassword: string;
  password: string;
};
