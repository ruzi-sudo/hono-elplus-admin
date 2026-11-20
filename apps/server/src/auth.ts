import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import "./env";
import { getDb } from "./db";
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
} from "./db/schema";

const APP_NAME = "HonoElplusAdmin";
const AUTH_BASE_PATH = "/api/auth";
const AUTH_EMAIL_DOMAIN = "auth.local";
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_HASH_ROUNDS = 10;
const SESSION_EXPIRES_IN_SECONDS = 604800;
const SESSION_UPDATE_AGE_SECONDS = 86400;

let authPromise: ReturnType<typeof createAuth> | null = null;

function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "BETTER_AUTH_SECRET must be configured with at least 32 characters",
    );
  }
  return secret;
}

async function createAuth() {
  const db = await getDb();

  return betterAuth({
    appName: APP_NAME,
    basePath: AUTH_BASE_PATH,
    secret: getSecret(),
    database: drizzleAdapter(db, {
      provider: "mysql",
      schema: {
        user: authUsers,
        session: authSessions,
        account: authAccounts,
        verification: authVerifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      password: {
        hash: (password) => bcrypt.hash(password, PASSWORD_HASH_ROUNDS),
        verify: ({ hash, password }) => bcrypt.compare(password, hash),
      },
    },
    user: {
      additionalFields: {
        legacyUserId: {
          type: "number",
          required: true,
          input: true,
        },
      },
    },
    session: {
      expiresIn: SESSION_EXPIRES_IN_SECONDS,
      updateAge: SESSION_UPDATE_AGE_SECONDS,
    },
    advanced: {
      trustedProxyHeaders: true,
    },
    plugins: [bearer()],
  });
}

export function getAuth(_request?: Request) {
  authPromise ??= createAuth();
  return authPromise;
}

export function getAuthEmail(legacyUserId: number): string {
  return `user-${legacyUserId}@${AUTH_EMAIL_DOMAIN}`;
}
