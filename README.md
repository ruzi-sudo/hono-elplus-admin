# hono-elplus-admin

`hono-elplus-admin` 是一个基于 **Pure Admin** 体系重构的全栈后台管理系统。项目保留了 Pure Admin 在前端工程、动态路由、权限菜单和管理后台交互上的成熟设计，同时将后端替换为基于 **Hono** 的 TypeScript API 服务，使前后端都以 TypeScript 作为主要开发语言。

项目目标是提供一个更轻量、更清晰、更容易二次开发的管理后台基础工程，适合用作 RBAC 后台、系统监控后台、业务运营后台或中小型 SaaS 管理端。

## 核心特点

- **基于 Pure Admin 重构**：沿用 Vue Pure Admin 的后台布局、权限菜单、动态路由和 Element Plus 组件体系，并清理演示功能，保留更贴近业务系统的骨架。
- **前后端全 TypeScript**：前端 Vue 3 + TypeScript，后端 Hono + TypeScript，接口 schema、业务服务、数据库 schema 都统一在 TS 生态内维护。
- **Hono 后端架构**：使用 Hono 构建轻量 API 服务，结合 `@hono/zod-openapi` 和 Zod 做接口定义、参数校验和 OpenAPI 文档生成。
- **Element Plus 管理端**：前端基于 Vue 3、Vite、Pinia、Element Plus 和 Pure Admin 组件体系构建。
- **RBAC 权限模型**：内置用户、角色、菜单、按钮权限、动态路由和角色菜单授权。
- **Redis 登录态管理**：登录凭证写入 Redis，支持在线用户管理、强制下线和凭证过期清理。
- **MySQL + Drizzle**：使用 Drizzle ORM 维护数据库 schema 与类型，数据库使用 MySQL。
- **Docker 本地环境**：提供 MySQL、Redis 和初始化 SQL，便于快速启动本地开发环境。

## 技术架构

### 前端

- Vue 3
- TypeScript
- Vite
- Element Plus
- Pinia
- Vue Router
- Pure Admin 组件体系
- Axios 请求封装
- SCSS / Tailwind CSS

### 后端

- Hono
- TypeScript
- `@hono/zod-openapi`
- Zod
- Drizzle ORM
- MySQL
- Redis
- Better Auth Session Token（Bearer 认证）
- OpenAPI / Scalar API Reference

### 工程结构

```text
hono-elplus-admin/
├── apps/
│   ├── web/              # 前端管理端，Vue 3 + Element Plus + Pure Admin
│   └── server/           # 后端 API 服务，Hono + Drizzle + Redis
├── packages/
│   └── config/           # 共享 ESLint / TypeScript 配置
├── docker/
│   ├── docker-compose.yml
│   └── init.sql          # MySQL 初始化表结构和基础数据
├── TODO.md               # 项目功能完成度和后续计划
└── README.md
```

## 已实现功能

- 用户名密码登录
- 用户注册
- JWT 登录认证和刷新
- Redis 凭证存储与过期处理
- 在线用户列表和强制下线
- 用户管理 CRUD
- 角色管理 CRUD
- 菜单管理 CRUD
- 多级动态菜单路由
- 菜单启用/停用
- 角色菜单授权
- 登录日志
- 系统操作日志
- 个人信息编辑
- 头像上传
- 个人密码重置
- Docker 初始化数据库和 Redis

## 快速开始

### 环境要求

- Node.js LTS
- pnpm
- Docker / Docker Compose

### 安装依赖

```bash
pnpm install
```

### 启动基础服务

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 启动开发环境

```bash
pnpm dev
```

等到终端同时显示 Vite 的访问地址和后端的 `[Server] Running on ...`，再打开前端。只有 Vite 就绪不代表 API 已经开始监听。

默认访问地址：

- 前端：`http://localhost:8848`
- 后端：`http://localhost:8080`
- OpenAPI 文档：`http://localhost:8080/docs`

## 默认账号

```text
管理员：admin / admin123
普通用户：common / admin123
```

## 环境配置

本地开发优先读取根目录 `.env.dev`，不存在时回退到 `.env`。后端会从该文件读取数据库、Redis、JWT 和 Better Auth 密钥等配置；Shell 或容器显式传入的环境变量优先级更高。可从 `.env.example` 复制配置模板，`BETTER_AUTH_SECRET` 必须替换为至少 32 个字符的随机密钥。Better Auth 服务地址会根据当前请求动态生成，无需单独配置。

本地开发时需要确认 MySQL 和 Redis 配置与 `docker/docker-compose.yml` 保持一致。

前端开发代理使用同一份配置中的 `PORT` 连接后端。若默认端口被其他项目占用，请在 `.env.dev` 中调整 `PORT` 和 `VITE_PORT`，再重启前后端；不要复用其他项目的 API。

## 数据库与初始化

初始化 SQL 位于：

```text
docker/init.sql
```

`docker/init.sql` 仅用于空数据卷首次初始化。已有数据库升级时，必须按文件名顺序执行 `docker/migrations/*.sql`，不要通过删除数据卷重新初始化。

当前权限模型分为三层：

- 页面权限：`sys_role_pages`，同时承载菜单和按钮权限。
- 接口权限：`sys_api_permissions` 与 `sys_role_api_permissions`，由服务端路由中间件强制校验。
- 角色首页：`sys_roles.home_page_id`，必须指向该角色已授权的启用页面。

已有数据库升级到接口权限模型时，执行：

```bash
mysql -h 127.0.0.1 -P 3308 -u root -p hono_elplus_admin \
  < docker/migrations/20261120_add_api_permissions.sql
```

如果旧库仍显示上游、租户、工作台、对账等已下线菜单，使用同样的命令执行 `docker/migrations/20261124_remove_legacy_menus.sql`，然后刷新页面。迁移会清除这些菜单的角色授权和首页引用；右上角的账户设置入口不受影响。

已有接口权限表的数据库，继续执行 `docker/migrations/20261124_add_api_permission_management.sql`，新增「系统管理 → 接口权限管理」入口和接口定义，不覆盖已有角色授权。新入口默认授予超级管理员。

在「角色管理」配置菜单、按钮和角色首页，在「接口权限管理」为角色配置具体的 HTTP 方法和路径。两处保存互不覆盖；页面或按钮可见不代表有权调用接口，缺少接口授权时服务端返回 HTTP 403。

接口权限页面支持按角色、接口名称/路径/编码、所属模块、HTTP 方法和授权状态筛选；「全选当前筛选结果」作用于全部匹配项，跨页保留勾选。修改后可撤销，切换角色或离开页面会提醒未保存内容。admin/common 内置角色的接口授权同样可编辑；超级管理员可维护接口定义，已分配的接口不允许改动请求方法或路径。

该文件包含：

- 用户表
- 角色表
- 用户角色关联表
- 菜单表
- 角色菜单关联表
- 角色接口权限关联表
- 在线用户表
- 登录日志表
- 系统日志表
- 基础 admin / common 账号
- 基础菜单和权限数据

## API 文档

后端启动后访问：

```text
http://localhost:8080/docs
```

接口由 Hono + Zod OpenAPI 定义生成，便于调试和后续前后端协作。

## 项目定位

这个项目不是单纯的 Pure Admin 模板拷贝，而是在其前端管理端基础上做了业务化整理：

- 删除演示性质较强的模块
- 补齐真实后端 API
- 加入 Redis 登录态管理
- 用 Hono 重建后端服务
- 用 Drizzle 维护数据库类型
- 统一前后端 TypeScript 开发体验

适合作为一个可继续扩展的现代 TypeScript 全栈后台管理系统。
