# Carte Hands-off: Phase 1, Week 1-2 登录态修订

**状态**: 已完成本轮 v2.1 登录态修订，代码已部署到测试服务器并通过远程基础验收
**日期**: 2026-09-01
**依据**: `docs/tech-spec-detailed.md` v2.1、`docs/feature-supplement.md`、`docs/review-report.md`

## 本轮交付

- 首页创建 CTA 改为公开进入 `/create`；已登录用户导航显示 `Dashboard`，访客显示 `Sign in`。
- 新增公开场景选择页 `/create`，包含 Wedding、Birthday、Business event、Other gathering 四个入口，均跳转到 `/templates?scene=...`。
- 新增 `carte_session_id` HttpOnly Cookie，会话有效期 7 天；HTTP 测试环境不会错误设置 `Secure`，HTTPS 环境才启用 `Secure`。
- 新增 `GuestDraft` Prisma 模型、`0002_guest_drafts` 迁移及 session/expires 索引。
- 新增访客/登录用户统一邀请函 API：
  - `POST /api/invitations`：登录用户写入 `invitations`，访客写入 `guest_drafts`。
  - `GET /api/invitations`：按登录用户或当前访客 Cookie 返回数据。
  - `GET/PATCH /api/invitations/:id`：按用户 ID 或访客 Cookie 做访问隔离，并拒绝过期草稿。
  - `DELETE /api/invitations/:id`：仅登录用户可用。
- 新增 `POST /api/auth/migrate-guest-data`，登录后将当前 Cookie 下未过期访客草稿迁移到用户账户并删除原草稿。
- 登录页安全保留内部 `continue` 参数；邮箱登录完成迁移后回到原路径，Google OAuth 经过迁移完成回调路径。
- `continue` 仅允许站内绝对路径，拒绝外部 URL、协议相对 URL 和反斜杠路径，避免开放重定向。

## 本地代码验证

以下检查均在本机执行，未启动本地 Docker：

```text
npx prisma format       PASS
npx prisma validate     PASS（使用临时 DATABASE_URL，仅校验 schema）
npx prisma generate     PASS
npm run lint            PASS
npx tsc --noEmit        PASS
npm run build           PASS
```

生产构建包含 `/create`、会话 API、访客邀请函 API 和迁移 API；Next.js Middleware 已纳入构建产物。

## 测试服务器验证

服务器：Ubuntu 22.04，Carte 工作目录 `/root/carte`，应用地址 `http://139.180.215.236:3010`。

- 服务器已应用 Prisma 迁移 `0002_guest_drafts`。
- `GET /create`：HTTP 200，页面标题存在，并下发 7 天 `HttpOnly` `carte_session_id` Cookie。
- `GET /login?continue=/editor/demo?action=publish`：HTTP 200，页面保留内部 continue 参数。
- 未登录 `GET /dashboard`：HTTP 307，Location 为 `/login`。
- 使用测试 Cookie 调用 `POST /api/invitations`：HTTP 201，返回 `isGuest: true`。
- 使用同一 Cookie 调用 `GET /api/invitations`：返回创建的访客草稿。
- 使用同一 Cookie 调用 `PATCH /api/invitations/:id`：更新成功并返回 `isGuest: true`。
- 远程验收产生的测试草稿已清理，数据库返回 `DELETE 1`。
- Docker/数据库/Redis 联调均在服务器执行，本机未运行 Docker。

## 当前限制与下一步

- 模板库当前仍为占位页；Week 3-4 需要导入婚礼、生日、商务三个 demo 模板并实现筛选。
- 编辑器、完整 localStorage 草稿恢复、发布支付、Stripe、H5/RSVP 和登录后迁移的真实邮箱端到端流程尚未完成，按路线图在后续阶段实现。
- 测试服务器磁盘剩余空间较低；本次使用本机已验证的 standalone 产物更新应用容器，并清理了本次失败构建缓存，未更改其他服务或 80 端口。
