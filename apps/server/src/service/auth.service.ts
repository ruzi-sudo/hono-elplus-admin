import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { eq, and, ne, isNotNull, sql, asc, inArray } from "drizzle-orm";
import {
  getAuth,
  getAuthEmail,
  PASSWORD_HASH_ROUNDS,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "../auth";
import { getDb } from "../db";
import {
  authAccounts,
  authSessions,
  authUsers,
  sysUsers,
  sysRoles,
  sysUserRoles,
  sysApiPermissions,
  sysRoleApiPermissions,
  sysPages,
  sysRolePages,
  sysOnlineUsers,
  sysLoginLogs,
} from "../db/schema";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  getUserCredentialByRefreshToken,
  removeUserCredentialByOnlineUserId,
  replaceUserCredential,
  storeUserCredential,
} from "./redis.service";

function formatExpires(expiresAt: Date): string {
  return expiresAt.toISOString().replace("T", " ").slice(0, 19);
}

function assertPasswordPolicy(password: string): void {
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    throw {
      code: 10001,
      message: `密码长度必须为 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 位`,
      status: 400,
    };
  }
}

async function persistPasswordAndRevokeSessions(
  userId: number,
  password: string,
  currentPassword?: string,
): Promise<void> {
  assertPasswordPolicy(password);

  const db = await getDb();
  const onlineUserIds = await db.transaction(async (tx) => {
    const [user] = await tx
      .select({ id: sysUsers.id, password: sysUsers.password })
      .from(sysUsers)
      .where(eq(sysUsers.id, userId))
      .limit(1);
    if (!user) {
      throw { code: 10003, message: "用户不存在", status: 404 };
    }

    if (
      currentPassword !== undefined &&
      !(await bcrypt.compare(currentPassword, user.password))
    ) {
      throw { code: 10001, message: "当前密码不正确", status: 400 };
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
    await tx
      .update(sysUsers)
      .set({ password: passwordHash, updatedAt: now })
      .where(eq(sysUsers.id, userId));

    const [authUser] = await tx
      .select({ id: authUsers.id })
      .from(authUsers)
      .where(eq(authUsers.legacyUserId, userId))
      .limit(1);
    if (authUser) {
      await tx
        .update(authAccounts)
        .set({ password: passwordHash, updatedAt: now })
        .where(
          and(
            eq(authAccounts.userId, authUser.id),
            eq(authAccounts.providerId, "credential"),
          ),
        );
      await tx
        .delete(authSessions)
        .where(eq(authSessions.userId, authUser.id));
    }

    const onlineUsers = await tx
      .select({ id: sysOnlineUsers.id })
      .from(sysOnlineUsers)
      .where(eq(sysOnlineUsers.userId, userId));
    await tx.delete(sysOnlineUsers).where(eq(sysOnlineUsers.userId, userId));
    return onlineUsers.map((onlineUser) => onlineUser.id);
  });

  await Promise.all(
    onlineUserIds.map((onlineUserId) =>
      removeUserCredentialByOnlineUserId(onlineUserId),
    ),
  );
}

export async function changeOwnPassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await persistPasswordAndRevokeSessions(userId, newPassword, currentPassword);
}

export async function resetUserPassword(
  userId: number,
  newPassword: string,
): Promise<void> {
  await persistPasswordAndRevokeSessions(userId, newPassword);
}

async function issueBetterAuthSession(
  user: {
    id: number;
    username: string;
    password: string;
    avatar: string | null;
  },
  password: string,
  request: Request,
): Promise<string> {
  const db = await getDb();
  const auth = await getAuth(request);
  const email = getAuthEmail(user.id);
  const [linkedUser] = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.legacyUserId, user.id))
    .limit(1);

  if (!linkedUser) {
    const signedUp = await auth.api.signUpEmail({
      body: {
        name: user.username,
        email,
        password,
        image: user.avatar || undefined,
        legacyUserId: user.id,
      },
    });
    if (!signedUp.token) {
      throw { code: 10002, message: "Better Auth 会话创建失败", status: 500 };
    }
    return signedUp.token;
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(authUsers)
      .set({
        name: user.username,
        email,
        image: user.avatar,
        updatedAt: now,
      } as Partial<typeof authUsers.$inferInsert>)
      .where(eq(authUsers.id, linkedUser.id));

    const [credentialAccount] = await tx
      .select({ id: authAccounts.id })
      .from(authAccounts)
      .where(
        and(
          eq(authAccounts.userId, linkedUser.id),
          eq(authAccounts.providerId, "credential"),
        ),
      )
      .limit(1);

    if (credentialAccount) {
      await tx
        .update(authAccounts)
        .set({ password: user.password, updatedAt: now } as Partial<
          typeof authAccounts.$inferInsert
        >)
        .where(eq(authAccounts.id, credentialAccount.id));
      return;
    }

    await tx.insert(authAccounts).values({
      id: randomUUID(),
      accountId: linkedUser.id,
      providerId: "credential",
      userId: linkedUser.id,
      password: user.password,
      createdAt: now,
      updatedAt: now,
    } as typeof authAccounts.$inferInsert);
  });

  const signedIn = await auth.api.signInEmail({
    body: { email, password, rememberMe: true },
  });
  if (!signedIn.token) {
    throw { code: 10002, message: "Better Auth 会话创建失败", status: 500 };
  }
  return signedIn.token;
}

export async function login(
  username: string,
  password: string,
  request: Request,
  clientInfo?: { ip?: string; ua?: string },
) {
  const db = await getDb();

  const [user] = await db
    .select({
      id: sysUsers.id,
      username: sysUsers.username,
      password: sysUsers.password,
      avatar: sysUsers.avatar,
      email: sysUsers.email,
      status: sysUsers.status,
    })
    .from(sysUsers)
    .where(eq(sysUsers.username, username))
    .limit(1);

  if (!user) {
    throw { code: 10001, message: "用户名或密码错误", status: 400 };
  }
  if (user.status !== 1) {
    throw { code: 10001, message: "账号已停用", status: 400 };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw { code: 10001, message: "用户名或密码错误", status: 400 };
  }

  const roles = await db
    .select({
      id: sysRoles.id,
      code: sysRoles.code,
    })
    .from(sysRoles)
    .innerJoin(sysUserRoles, eq(sysRoles.id, sysUserRoles.roleId))
    .where(and(eq(sysUserRoles.userId, user.id), eq(sysRoles.status, 1)))
    .orderBy(asc(sysRoles.id));

  const roleCodes = roles.map((r) => r.code);

  const [homePage] = await db
    .select({ path: sysPages.path })
    .from(sysRoles)
    .innerJoin(
      sysUserRoles,
      and(
        eq(sysRoles.id, sysUserRoles.roleId),
        eq(sysUserRoles.userId, user.id),
      ),
    )
    .innerJoin(
      sysRolePages,
      and(
        eq(sysRolePages.roleId, sysRoles.id),
        eq(sysRolePages.pageId, sysRoles.homePageId),
      ),
    )
    .innerJoin(sysPages, eq(sysPages.id, sysRoles.homePageId))
    .where(
      and(
        eq(sysRoles.status, 1),
        eq(sysPages.status, 1),
        ne(sysPages.menuType, 1),
        ne(sysPages.path, "/"),
        isNotNull(sysPages.path),
        isNotNull(sysPages.component),
        sql`${sysPages.path} != ''`,
        sql`${sysPages.component} != ''`,
      ),
    )
    .orderBy(asc(sysRoles.id))
    .limit(1);

  const buttonPerms = await db
    .selectDistinct({ auths: sysPages.auths })
    .from(sysPages)
    .innerJoin(sysRolePages, eq(sysPages.id, sysRolePages.pageId))
    .innerJoin(sysUserRoles, eq(sysRolePages.roleId, sysUserRoles.roleId))
    .innerJoin(sysRoles, eq(sysUserRoles.roleId, sysRoles.id))
    .where(
      and(
        eq(sysUserRoles.userId, user.id),
        eq(sysRoles.status, 1),
        eq(sysPages.menuType, 1),
        eq(sysPages.status, 1),
        isNotNull(sysPages.auths),
        sql`${sysPages.auths} != ''`,
      ),
    );
  const roleIds = roles.map((role) => role.id);
  const apiPerms = roleIds.length
    ? await db
        .selectDistinct({ code: sysApiPermissions.code })
        .from(sysRoleApiPermissions)
        .innerJoin(
          sysApiPermissions,
          eq(sysRoleApiPermissions.apiPermissionId, sysApiPermissions.id),
        )
        .where(
          and(
            inArray(sysRoleApiPermissions.roleId, roleIds),
            eq(sysApiPermissions.status, 1),
          ),
        )
    : [];
  const buttonPermissions = buttonPerms.map((p) => p.auths!).filter(Boolean);
  const apiPermissions = apiPerms.map((p) => p.code);

  const accessToken = await issueBetterAuthSession(user, password, request);
  const refreshToken = accessToken;
  let credentialStored = false;
  let onlineUserId: number | null = null;

  // 记录在线用户
  try {
    const ua = clientInfo?.ua || "";
    const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
    const browser = browserMatch ? browserMatch[0] : "未知";
    const systemMatch = ua.match(/\(([^)]+)\)/);
    let system = "未知";
    if (systemMatch) {
      const raw = systemMatch[1];
      if (/Windows NT/.test(raw)) system = "Windows";
      else if (/Mac OS X/.test(raw)) system = "macOS";
      else if (/Linux/.test(raw) && !/Android/.test(raw)) system = "Linux";
      else if (/Android/.test(raw)) system = "Android";
      else if (/iOS/.test(raw)) system = "iOS";
    }

    const ip = clientInfo?.ip || "127.0.0.1";
    // 异步查询 IP 归属地，不阻塞登录
    let address = "";
    const isPrivate =
      /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$)/.test(ip);
    if (ip && !isPrivate) {
      lookupIpAddress(ip)
        .then((addr) => {
          if (addr) {
            getDb()
              .then((db) =>
                db
                  .update(sysOnlineUsers)
                  .set({ address: addr } as Partial<
                    typeof sysOnlineUsers.$inferInsert
                  >)
                  .where(
                    and(
                      eq(sysOnlineUsers.username, user.username),
                      eq(sysOnlineUsers.ip, ip),
                    ),
                  ),
              )
              .catch(() => {});
          }
        })
        .catch(() => {});
    }

    const [onlineUser] = await db
      .insert(sysOnlineUsers)
      .values({
        userId: user.id,
        username: user.username,
        ip,
        address,
        system,
        browser,
        loginTime: new Date(),
      } as typeof sysOnlineUsers.$inferInsert)
      .$returningId();

    if (onlineUser?.id) {
      onlineUserId = onlineUser.id;
      credentialStored = await storeUserCredential({
        userId: user.id,
        username: user.username,
        onlineUserId: onlineUser.id,
        accessToken,
        refreshToken,
      });
    }

    // 写入登录日志
    await db.insert(sysLoginLogs).values({
      userId: user.id,
      username: user.username,
      ip,
      address,
      system,
      browser,
      status: 1,
      loginTime: new Date(),
    } as typeof sysLoginLogs.$inferInsert);
  } catch {
    /* 非关键 */
  }

  if (!credentialStored) {
    if (onlineUserId) {
      await db
        .delete(sysOnlineUsers)
        .where(eq(sysOnlineUsers.id, onlineUserId));
    }
    throw { code: 10002, message: "登录凭证写入失败，请稍后重试", status: 500 };
  }

  return {
    avatar: user.avatar || "",
    username: user.username,
    roles: roleCodes,
    permissions: roleCodes.includes("admin") ? ["*:*:*"] : buttonPermissions,
    apiPermissions: roleCodes.includes("admin") ? ["*"] : apiPermissions,
    accessToken,
    refreshToken,
    expires: formatExpires(
      new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000),
    ),
  };
}

export async function register(
  username: string,
  email: string,
  password: string,
  confirmPassword: string,
) {
  assertPasswordPolicy(password);
  if (password !== confirmPassword) {
    throw { code: 10001, message: "两次输入的密码不一致", status: 400 };
  }

  const db = await getDb();
  const [existingUser] = await db
    .select({ id: sysUsers.id })
    .from(sysUsers)
    .where(eq(sysUsers.username, username))
    .limit(1);
  if (existingUser) {
    throw { code: 10001, message: "用户名已存在", status: 400 };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await db.insert(sysUsers).values({
    username,
    email,
    password: hashedPassword,
    status: 1,
  } as typeof sysUsers.$inferInsert);

  const userId = Number(result.insertId);
  const [commonRole] = await db
    .select({ id: sysRoles.id })
    .from(sysRoles)
    .where(eq(sysRoles.code, "common"))
    .limit(1);

  if (commonRole) {
    await db.insert(sysUserRoles).values({ userId, roleId: commonRole.id });
  }

  return { id: userId };
}

export async function refreshToken(token: string, request: Request) {
  if (!token) {
    throw { code: 10001, message: "请求参数缺失或格式不正确", status: 400 };
  }

  const oldCredential = await getUserCredentialByRefreshToken(token);
  if (!oldCredential) {
    throw { code: 10001, message: "登录状态已过期，请重新登录", status: 401 };
  }

  const auth = await getAuth(request);
  const session = await auth.api.getSession({
    headers: new Headers({ Authorization: `Bearer ${token}` }),
  });
  if (!session || Number(session.user.legacyUserId) !== oldCredential.userId) {
    throw { code: 10002, message: "登录状态已过期，请重新登录", status: 401 };
  }

  const replaced = await replaceUserCredential(oldCredential, {
    userId: oldCredential.userId,
    username: oldCredential.username,
    onlineUserId: oldCredential.onlineUserId,
    accessToken: token,
    refreshToken: token,
  });
  if (!replaced) {
    throw { code: 10002, message: "登录凭证刷新失败，请重新登录", status: 500 };
  }

  return {
    accessToken: token,
    refreshToken: token,
    expires: formatExpires(
      new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000),
    ),
  };
}

/** 通过 ip-api.com 免费接口查询 IP 归属地（中国区可正常返回中文地址） */
async function lookupIpAddress(ip: string): Promise<string> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as {
      status: string;
      country: string;
      regionName: string;
      city: string;
    };
    if (data.status === "success") {
      return `${data.country}${data.regionName}${data.city}`;
    }
  } catch {
    /* 超时或失败时跳过 */
  }
  return "";
}
