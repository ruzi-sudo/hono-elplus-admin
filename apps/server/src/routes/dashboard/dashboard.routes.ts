import { createRoute } from "@hono/zod-openapi";
import { ErrorResponseSchema, ForbiddenResponse } from "../../common/schemas";
import {
  ResetMinePasswordSchema,
  UpdateMineSchema,
} from "./dashboard.schemas";

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
    "403": ForbiddenResponse,
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
    "403": ForbiddenResponse,
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
          schema: UpdateMineSchema,
        },
      },
    },
  },
  responses: {
    "200": { description: "更新个人信息成功" },
    "400": {
      description: "参数错误",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
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
          schema: ResetMinePasswordSchema,
        },
      },
    },
  },
  responses: {
    "200": { description: "更新密码成功" },
    "400": {
      description: "参数错误",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    "401": {
      description: "未授权",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});
