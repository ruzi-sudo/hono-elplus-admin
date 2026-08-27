import { createRoute, z } from "@hono/zod-openapi";
import { ErrorResponseSchema } from "../../common/schemas";

export const getCardList = createRoute({
  method: "post",
  path: "/get-card-list",
  tags: ["dashboard"],
  responses: {
    "200": { description: "卡片列表" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const getMapInfo = createRoute({
  method: "get",
  path: "/get-map-info",
  tags: ["dashboard"],
  responses: {
    "200": { description: "地图信息" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const getMine = createRoute({
  method: "get",
  path: "/mine",
  tags: ["dashboard"],
  responses: {
    "200": { description: "个人信息" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const updateMine = createRoute({
  method: "post",
  path: "/mine/update",
  tags: ["dashboard"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            username: z.string().min(2).max(64).optional(),
            avatar: z.string().optional(),
            email: z.string().email().optional(),
            remark: z.string().max(255).optional(),
          }),
        },
      },
    },
  },
  responses: {
    "200": { description: "更新个人信息成功" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const resetMinePassword = createRoute({
  method: "post",
  path: "/mine/reset-password",
  tags: ["dashboard"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ password: z.string().min(6).max(64) }),
        },
      },
    },
  },
  responses: {
    "200": { description: "更新密码成功" },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});
