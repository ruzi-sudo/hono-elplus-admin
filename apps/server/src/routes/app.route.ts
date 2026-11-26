import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { route as authRoute } from "./auth/auth.handlers";
import { route as userRoute } from "./user/user.handlers";
import { route as roleRoute } from "./role/role.handlers";
import { route as menuRoute } from "./menu/menu.handlers";
import { route as monitorRoute } from "./monitor/monitor.handlers";
import { route as dashboardRoute } from "./dashboard/dashboard.handlers";
import { authMiddleware } from "../middlewares/auth";
import { requireApiPermission } from "../middlewares/rbac";
import { systemLogMiddleware } from "../middlewares/systemLog";
import { avatarUploadLimitMiddleware } from "../middlewares/uploadLimit";
import { errorHandler } from "../middlewares/error";
import { setupOpenapi } from "../common/openapi";
const app = new OpenAPIHono().basePath("/api");

// CORS
app.use(
  "*",
  cors({
    origin: ["http://localhost:8848", "http://127.0.0.1:8848"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Client-Public-IP"],
  }),
);

// Auth routes (no auth required)
app.route("/", authRoute);

// Protected routes - user
app.use("/user/*", authMiddleware);
app.use("/user/*", systemLogMiddleware);
app.use("/list-all-role", authMiddleware);
app.use("/list-role-ids", authMiddleware);
app.use("/upload/*", authMiddleware);
app.use("/upload/avatar", avatarUploadLimitMiddleware);
app.use("/user", requireApiPermission());
app.use(
  "/user/create",
  requireApiPermission(),
);
app.use(
  "/user/update",
  requireApiPermission(),
);
app.use(
  "/user/delete",
  requireApiPermission(),
);
app.use(
  "/user/batch-delete",
  requireApiPermission(),
);
app.use(
  "/user/reset-password",
  requireApiPermission(),
);
app.use("/list-all-role", requireApiPermission());
app.use("/list-role-ids", requireApiPermission());
app.use(
  "/upload/avatar",
  requireApiPermission(),
);
app.route("/", userRoute);

app.get("/uploads/*", serveStatic({ root: "./public" }));

// Protected routes - role
app.use("/role/*", authMiddleware);
app.use("/role/*", systemLogMiddleware);
app.use("/role-menu", authMiddleware);
app.use("/role-menu-ids", authMiddleware);
app.use("/role-api-permissions", authMiddleware, requireApiPermission());
app.use("/role-api-permissions/roles", authMiddleware, requireApiPermission());
app.use("/role-api-permissions/create", authMiddleware, requireApiPermission());
app.use("/role-api-permissions/update", authMiddleware, requireApiPermission());
app.use("/role-api-permission-ids", authMiddleware, requireApiPermission());
app.use("/role", requireApiPermission());
app.use(
  "/role/create",
  requireApiPermission(),
);
app.use(
  "/role/update",
  requireApiPermission(),
);
app.use(
  "/role/delete",
  requireApiPermission(),
);
app.use("/role-menu", requireApiPermission());
app.use("/role-menu-ids", requireApiPermission());
app.use(
  "/role/save-menu",
  requireApiPermission(),
);
app.use(
  "/role/save-api-permissions",
  requireApiPermission(),
);
app.route("/", roleRoute);

// Protected routes - menu
app.use("/menu/*", authMiddleware);
app.use("/menu/*", systemLogMiddleware);
app.use("/get-async-routes", authMiddleware);
app.use("/menu", requireApiPermission());
app.use(
  "/menu/create",
  requireApiPermission(),
);
app.use(
  "/menu/update",
  requireApiPermission(),
);
app.use(
  "/menu/delete",
  requireApiPermission(),
);
app.use(
  "/get-async-routes",
  requireApiPermission(),
);
app.route("/", menuRoute);

// Protected routes - monitor (跳过系统日志本身，避免递归)
app.use("/online-logs", authMiddleware);
app.use("/online-logs/force-offline", authMiddleware);
app.use("/login-logs/*", authMiddleware);
app.use("/system-logs/*", authMiddleware);
app.use("/system-logs-detail", authMiddleware);
app.use("/logout", authMiddleware, requireApiPermission());
app.use(
  "/online-logs",
  requireApiPermission(),
);
app.use(
  "/online-logs/force-offline",
  requireApiPermission(),
);
app.use(
  "/login-logs",
  requireApiPermission(),
);
app.use(
  "/login-logs/delete",
  requireApiPermission(),
);
app.use(
  "/login-logs/clear",
  requireApiPermission(),
);
app.use(
  "/system-logs",
  requireApiPermission(),
);
app.use("/system-logs-detail", requireApiPermission());
app.use(
  "/system-logs/delete",
  requireApiPermission(),
);
app.use(
  "/system-logs/clear",
  requireApiPermission(),
);
app.route("/", monitorRoute);

// Protected routes - dashboard
app.use("/mine/*", authMiddleware);
app.use("/mine/upload/avatar", avatarUploadLimitMiddleware);
app.use("/mine/*", systemLogMiddleware);
app.use("/mine", requireApiPermission());
app.use(
  "/mine/update",
  requireApiPermission(),
);
app.use(
  "/mine/reset-password",
  requireApiPermission(),
);
app.use(
  "/mine/upload/avatar",
  requireApiPermission(),
);
app.use("/get-card-list", authMiddleware);
app.use("/get-map-info", authMiddleware);
app.use(
  "/get-card-list",
  requireApiPermission(),
);
app.use(
  "/get-map-info",
  requireApiPermission(),
);
app.route("/", dashboardRoute);

// 404
app.notFound((c) =>
  c.json({ code: 10004, message: "接口不存在", data: {} }, 404),
);

// Error handler
app.onError(errorHandler);

// OpenAPI docs
setupOpenapi(app, "PureAdmin API", "7.0.0");

export { app };
