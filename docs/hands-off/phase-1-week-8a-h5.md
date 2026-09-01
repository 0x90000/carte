# Carte Hands-off: Phase 1, Week 8A H5 邀请函渲染

**状态**: 已完成本地开发与代码验证；测试服务器 Docker/HTTP 验收待执行
**日期**: 2026-09-01
**依据**: `docs/tech-spec-detailed.md` 第七章 7.1、7.2、7.4 及 Week 8 验收标准

## 本阶段交付

- 新增公开邀请函页面 `/i/[slug]`，只查询 `status = "published"` 的邀请函；不存在、未发布或非法 slug 返回 404。
- 新增本地化公开页面 `/[locale]/i/[slug]`，沿用同一发布状态和数据访问规则，并生成 SSR metadata（标题、描述、Open Graph 预览图）。
- 新增 `InvitationRenderer`：按画布比例自适应移动端宽度，支持颜色/渐变、图片、视频和 HTML 背景，支持文本、图片、形状图层、层级、隐藏、旋转和透明度。
- 新增 Redis 缓存 `invitation:{slug}`，TTL 为 1 小时；Redis 不可用或读写失败时回退 PostgreSQL。缓存命中时恢复 Prisma 日期字段，避免 JSON 序列化后的日期类型错误。
- 已登录用户 PATCH 编辑邀请函后清除对应 slug 缓存；删除邀请函后也清除缓存，避免公开页面继续展示旧内容。
- 公开页面异步增加 `viewCount`，不阻塞 SSR 响应。
- Redis 客户端连接设置 1 秒连接超时、失败不无限重连；连接失败返回 `null`，保留登录验证码的内存 fallback。

## 本地代码验证

以下命令在本机执行，未启动 Docker、PostgreSQL、Redis 或应用服务器：

```text
npm run lint       PASS
npx tsc --noEmit   PASS
npm run build      PASS
```

生产构建确认包含：

- `/i/[slug]`
- `/[locale]/i/[slug]`
- `/api/invitations/[id]`（编辑/删除缓存失效）

## 测试服务器验收待办

部署目标为 Ubuntu 测试服务器 `/root/carte`，应用端口固定为 `3010`，不使用 80/443。部署时使用 Node.js 24 的 Docker 镜像，并仅重建/重启 app 服务，不删除 PostgreSQL 数据卷。

需要准备一个临时的 `published` invitation（含文本图层以及图片、视频、HTML、颜色背景样例）后验证：

- `/i/{slug}` 返回 200，SSR HTML 包含邀请函标题和图层文本。
- `/en/i/{slug}` 返回 200；不存在或未发布 slug 返回 404。
- 图片、视频、HTML、颜色背景均能通过公开页面访问，移动端宽度不溢出。
- 连续访问命中 Redis，TTL 约为 3600 秒；停止/断开 Redis 后页面仍能从 PostgreSQL 返回。
- 访问后 `view_count` 异步递增；编辑和删除后旧缓存不可继续展示。
- 应用容器 Node.js 为 v24，PostgreSQL/Redis healthcheck 正常，外部端口为 3010。

临时邀请函和验收数据完成后应清理，保留正式测试数据前需确认。

## 已知边界

- RSVP 表单及 `/api/rsvp` 属于 Week 8B，本阶段页面尚未显示回执表单。
- Stripe Checkout、Webhook、支付成功发布状态和分享页属于 Week 8C。
- HTML 背景由邀请函内容直接注入，当前数据来源限于受信任的模板/编辑器内容；接入第三方内容前需要增加 HTML 清洗策略。
- 图片仍使用原生 `<img>`，便于支持编辑器中的任意 URL；生产环境可在确认远程图片域名后迁移到 `next/image`。
