import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { getDb } from "./db";
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
} from "./db/schema";

const SESSION_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;
const DEVELOPMENT_SECRET =
  "9c574f179c3635b4ed46e41b0f8848d05a141ad56c64309a98fe51b154d5d5f7";

let authPromise: ReturnType<typeof createAuth> | null = null;

function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET must be configured in production");
  }
  return secret || DEVELOPMENT_SECRET;
}

async function createAuth() {
  const db = await getDb();

  return betterAuth({
    appName: "PureAdmin",
    baseURL:
      process.env.BETTER_AUTH_URL ||
      `http://127.0.0.1:${Number(process.env.PORT) || 8080}/api/auth`,
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
      minPasswordLength: 6,
      password: {
        hash: (password) => bcrypt.hash(password, 10),
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
      updateAge: 24 * 60 * 60,
    },
    plugins: [bearer()],
  });
}

export function getAuth() {
  authPromise ??= createAuth();
  return authPromise;
}

export function getAuthEmail(legacyUserId: number): string {
  return `user-${legacyUserId}@auth.local`;
}
