import { z } from "@hono/zod-openapi";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../../auth";

export const LoginBodySchema = z.object({
  username: z.string().min(1).openapi({ example: "admin" }),
  password: z.string().min(1).openapi({ example: "admin123" }),
});

export const RegisterBodySchema = z.object({
  username: z.string().min(1).openapi({ example: "new_user" }),
  email: z.string().email().openapi({ example: "user@example.com" }),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH)
    .max(PASSWORD_MAX_LENGTH)
    .openapi({ example: "Admin123" }),
  confirmPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH)
    .max(PASSWORD_MAX_LENGTH)
    .openapi({ example: "Admin123" }),
});

export const RefreshBodySchema = z.object({
  refreshToken: z
    .string()
    .min(1)
    .openapi({ example: "eyJhbGciOiJIUzUxMiJ9.adminRefresh" }),
});

export const LoginResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    avatar: z.string(),
    username: z.string(),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    homePath: z.string(),
    accessToken: z.string(),
    refreshToken: z.string(),
    expires: z.string(),
  }),
});

export const RefreshResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expires: z.string(),
  }),
});
