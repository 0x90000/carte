# Carte Hands-off: Phase 2 批量邮件 API

**状态**: 数据模型、预览 API、Dashboard 交互和配置边界验收已完成；真实邮件投递待 provider 凭据
**日期**: 2026-09-02
**依据**: `docs/tech-spec-detailed.md` 批量邮件发送设计、`docs/feature-supplement.md` 第三章

## 本阶段交付

- `EmailSend` Prisma 模型和 `0004_email_sends` migration：
  - 记录邀请函、创建者、收件人、主题、渲染后的 HTML、状态、发送/追踪时间和错误信息。
  - 为邀请函、状态和发送时间建立查询索引；邀请函或用户删除时级联删除发送记录。
- 新增 `POST /api/invitations/:id/send-emails`：
  - 仅允许邀请函创建者操作自己的 `published` 邀请函。
  - 收件人邮箱规范化、校验、去重，单批最多 100 个收件人。
  - 默认创建 `pending` 预览记录；`sendImmediately: true` 时通过 Resend 发送并更新 `sent`/`failed` 状态。
  - 未配置 Resend 时立即发送返回明确的 `503 EMAIL_NOT_CONFIGURED`，不会假装投递成功。
  - 邮件主题、正文、邀请函标题、地点和链接均经过 HTML 转义，正文始终包含邀请函链接。
- 新增 `GET /api/invitations/:id/send-emails`：仅返回当前创建者该邀请函最近 100 条发送记录。
- 新增 Dashboard 客户端邮件对话框：
  - 已发布邀请函显示 “Send via email” 入口。
  - 支持每行一个邮箱、去重计数、主题、个人正文、预览、立即发送和最近状态刷新。
- 空字符串或带引号空字符串形式的 `RESEND_API_KEY` 均按未配置处理，避免把 provider 错误误报为成功。
- API 代码提交：`feat: add invitation email send API`；Dashboard 提交：`feat: add dashboard email composer`。

## 本地代码验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npx prisma generate                 PASS
DATABASE_URL=<temporary> npx prisma validate  PASS
npm run lint                        PASS
npx tsc --noEmit                    PASS
npm run build                       PASS
git diff --check                    PASS
```

构建路由清单确认包含 `/api/invitations/[id]/send-emails`；Dashboard 首屏包含邮件对话框客户端代码。

## 测试服务器验收

部署目标为 Ubuntu 测试服务器 `/root/carte`，Carte 继续通过 `3010` 对外访问，没有使用 80/443；Node.js runtime 为 `v24.20.0`。

- 上传并执行 `0004_email_sends` migration，Prisma 报告 4 个 migration 全部 applied。
- 使用 Node.js 24 standalone 产物构建并部署 `carte-app:standalone-dashboard-email-static-fix-20260902`，仅替换 app 容器。
- 部署归档同时包含 `.next/static`；缺失该目录会导致客户端 hydration 失败，交互表单退化为原生导航。
- 未登录 POST 请求返回 HTTP 401 和 `UNAUTHORIZED`，不会创建发送记录。
- PostgreSQL 查询确认 `email_sends` 表存在，验收前后记录数为 0。
- 首页返回 HTTP 200；PostgreSQL、Redis 继续 healthy；正式 app 未开启 `E2E_TEST_MODE`。
- 使用隔离测试用户和已发布邀请函执行服务器 Chromium E2E：登录、Dashboard 入口、预览 `pending` 记录和立即发送错误提示全部通过（1/1）。
- 服务器 `.env` 没有有效 `RESEND_API_KEY`；空值归一化修复后，立即发送明确提示 `Email delivery is not configured.`，不写入伪成功状态。
- 验收后已删除临时用户、邀请函、7 条发送记录、Redis key、临时容器和上传 staging；正式 app 仍为 3010。

## 下一子阶段

- 当前发送实现按请求同步调用 Resend；队列、重试、退信和打开/点击 webhook 属于后续可靠性增强，不伪装成已完成。
- 配置 Resend 测试凭据后需补做真实已登录投递、provider 回执和失败重试验收。
