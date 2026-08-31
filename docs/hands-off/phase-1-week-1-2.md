# Carte Hands-off: Phase 1, Week 1-2

**状态**: 基础搭建代码完成，已部署到测试服务器并通过远程基础检查
**日期**: 2026-09-01
**范围**: Next.js/TypeScript、Tailwind、Prisma/PostgreSQL、Redis、Auth.js、基础 UI、Dashboard 空状态

## 已交付

- Next.js `15.5.24` + React `19.1.0` + TypeScript App Router 项目
- Tailwind CSS v4 主题变量与响应式基础样式，遵循设计规范的中性色、间距、圆角和字体栈
- shadcn 风格源码组件：`Button`、`Input`、`Card`、`Dialog`、`Label`
- Prisma schema（文档四章的 User/Auth、Template、Invitation、RSVP、Payment、AIGeneration 模型）
- 初始迁移：`prisma/migrations/0001_init/migration.sql`
- Redis 客户端与邮箱验证码服务（Redis TTL、60 秒请求冷却、开发环境无 Resend 时的服务端日志降级）
- Auth.js v5：邮箱验证码 Credentials 登录、可选 Google OAuth、JWT 会话
- 响应式首页、登录页、受保护 Dashboard 空状态和模板库占位页
- Docker Compose：PostgreSQL 15、Redis 7、应用；应用对外端口 `3010`，不使用 80
- Node 24 Dockerfile、`.env.example`、部署 README、`.dockerignore`

## 本地代码验证

以下命令均在本地执行，未启动本地 Docker：

```text
npm run lint       PASS
npx tsc --noEmit  PASS
npm run build     PASS
```

生产构建包含 9 个静态页面/路由，认证 API 与 Dashboard 为动态路由。

## 测试服务器验证

服务器：Ubuntu 22.04，Carte 工作目录 `/root/carte`。

- PostgreSQL 15 容器：healthy，端口仅绑定 `127.0.0.1:55432`
- Redis 7 容器：healthy，端口仅绑定 `127.0.0.1:56379`
- 初始迁移 `0001_init`：已成功应用
- Carte 应用：healthy，映射 `0.0.0.0:3010 -> 3000`
- 当前服务器使用本地生产构建产物更新 `carte-app:latest`，避免在低磁盘空间下重复复制完整 builder 层；后续正式部署仍可按 README 的 Compose 流程重建。
- `GET /`：HTTP 200，首页内容校验通过
- `GET /login`：HTTP 200，登录页内容校验通过
- 未登录 `GET /dashboard`：HTTP 307，Location `/login`
- 空 JSON `POST /api/auth/request-code`：HTTP 400，校验信息正确
- 80 端口未被 Carte 使用；服务器既有 80/443 服务未改动

访问地址：`http://139.180.215.236:3010`

## 配置注意事项

- 测试服务器 `.env` 已生成独立随机 `AUTH_SECRET`，未提交到仓库。
- 要完成真实邮箱登录，需要在服务器 `.env` 设置 `RESEND_API_KEY` 和 `EMAIL_FROM`；当前无 Resend key 时验证码只写入服务端日志（仅非生产降级）。
- 要启用 Google 登录，需要设置 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`，并将回调地址配置为 `http://139.180.215.236:3010/api/auth/callback/google`。
- 服务器根分区剩余约 3.1GB；未清理既有服务日志或 Docker 卷。后续构建应继续使用 `.dockerignore`，避免把 `node_modules` 放入构建上下文。

## 下一阶段交接（Week 3-4）

1. 使用 Prisma Template 模型导入婚礼、生日、商务 3 个 demo 模板。
2. 按详细版 2.1 JSON Schema 创建模板 JSON 与导入脚本。
3. 实现模板列表、详情和场景筛选 API/页面。
4. 在模板素材准备好后再接入对象存储；本阶段未伪造素材或支付配置。

## 未完成的本阶段外部验收

邮箱实际投递和 Google OAuth 端到端登录依赖产品方提供第三方凭据；代码路径已实现并通过构建检查，但当前服务器未配置这些凭据，因此尚未执行真实第三方登录闭环。
