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
import { requirePageAccess, requirePermission } from "../middlewares/rbac";
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
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Auth routes (no auth required)
app.route("/", authRoute);

// 系统日志中间件（标记需要记录到系统日志的接口）
app.use("/user/*", authMiddleware);
app.use("/user/*", systemLogMiddleware);
app.use("/list-all-role", authMiddleware);
app.use("/list-role-ids", authMiddleware);
app.use("/upload/*", authMiddleware);
app.use("/upload/avatar", avatarUploadLimitMiddleware);
app.use("/user", requirePageAccess("SystemUser"));
app.use("/user/create", requirePermission("system-user:add"));
app.use("/user/update", requirePermission("system-user:edit"));
app.use("/user/delete", requirePermission("system-user:delete"));
app.use("/user/batch-delete", requirePermission("system-user:batch-delete"));
app.use(
  "/user/reset-password",
  requirePermission("system-user:reset-password"),
);
app.use("/list-all-role", requirePageAccess("SystemUser"));
app.use("/list-role-ids", requirePageAccess("SystemUser"));
app.use("/upload/avatar", requirePermission("system-user:upload-avatar"));
app.route("/", userRoute);

app.get("/uploads/*", serveStatic({ root: "./public" }));

// Protected routes - role
app.use("/role/*", authMiddleware);
app.use("/role/*", systemLogMiddleware);
app.use("/role-menu", authMiddleware);
app.use("/role-menu-ids", authMiddleware);
app.use("/role", requirePageAccess("SystemRole"));
app.use("/role/create", requirePermission("system-role:add"));
app.use("/role/update", requirePermission("system-role:edit"));
app.use("/role/delete", requirePermission("system-role:delete"));
app.use("/role-menu", requirePermission("system-role:configure-permission"));
app.use(
  "/role-menu-ids",
  requirePermission("system-role:configure-permission"),
);
app.use("/role/save-menu", requirePermission("system-role:save-permission"));
app.route("/", roleRoute);

// Protected routes - menu
app.use("/menu/*", authMiddleware);
app.use("/menu/*", systemLogMiddleware);
app.use("/get-async-routes", authMiddleware);
app.use("/menu", requirePageAccess("SystemMenu"));
app.use("/menu/update", requirePermission("system-menu:edit"));
app.use("/menu/delete", requirePermission("system-menu:delete"));
app.route("/", menuRoute);

// Protected routes - monitor (跳过系统日志本身，避免递归)
app.use("/online-logs", authMiddleware);
app.use("/online-logs/force-offline", authMiddleware);
app.use("/login-logs/*", authMiddleware);
app.use("/system-logs/*", authMiddleware);
app.use("/system-logs-detail", authMiddleware);
app.use("/logout", authMiddleware);
app.use("/online-logs", requirePageAccess("OnlineUser"));
app.use(
  "/online-logs/force-offline",
  requirePermission("online-user:force-logout"),
);
app.use("/login-logs", requirePageAccess("LoginLog"));
app.use("/login-logs/delete", requirePermission("login-log:batch-delete"));
app.use("/login-logs/clear", requirePermission("login-log:clear"));
app.use("/system-logs", requirePageAccess("SystemLog"));
app.use("/system-logs-detail", requirePermission("system-log:view"));
app.use("/system-logs/delete", requirePermission("system-log:batch-delete"));
app.use("/system-logs/clear", requirePermission("system-log:clear"));
app.route("/", monitorRoute);

// Protected routes - dashboard
app.use("/mine/*", authMiddleware);
app.use("/mine/upload/avatar", avatarUploadLimitMiddleware);
app.use("/mine/*", systemLogMiddleware);
app.use("/get-card-list", authMiddleware);
app.use("/get-map-info", authMiddleware);
app.use("/get-card-list", requirePageAccess("Welcome"));
app.use("/get-map-info", requirePageAccess("Welcome"));
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
