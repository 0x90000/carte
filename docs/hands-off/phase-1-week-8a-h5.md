# Carte Hands-off: Phase 1, Week 8A H5 邀请函渲染

**状态**: 已完成本地开发、Docker 部署和测试服务器 HTTP 验收
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

## 测试服务器验收结果

部署目标为 Ubuntu 测试服务器 `/root/carte`，应用端口固定为 `3010`，不使用 80/443。部署时使用 Node.js 24 的 Docker 镜像，并仅重建/重启 app 服务，不删除 PostgreSQL 数据卷。

使用临时的 `published` invitation fixture（含文本图层以及图片、视频、HTML、颜色背景样例）完成验证：

- `/i/week8a-color`、`/i/week8a-image`、`/i/week8a-video`、`/i/week8a-html` 均返回 HTTP 200，SSR HTML 含对应标题和图层文本。
- `/en/i/week8a-color` 返回 HTTP 200；不存在 slug 和未发布 slug 均返回 HTTP 404。
- 图片、视频、HTML、颜色背景资源路径均出现在 SSR HTML 中，页面宽度按画布比例渲染。
- `invitation:week8a-color` Redis TTL 实测约 3549 秒（目标 3600 秒）。
- 访问后 `view_count` 从 0 增加到 2，确认异步浏览量更新执行。
- app 容器 Node.js `v24.20.0`；PostgreSQL、Redis 均 healthy；外部端口为 `3010`。
- 验收结束后已删除 4 条临时 invitation、Redis fixture key、临时归档和构建缓存；未删除任何数据库/Redis volume。

服务器磁盘在构建期间最低约 161 MB，完成 builder cache 和 dangling image 清理后恢复约 3.3 GB 可用空间。

## 已知边界

- RSVP 表单及 `/api/rsvp` 属于 Week 8B，本阶段页面尚未显示回执表单。
- Stripe Checkout、Webhook、支付成功发布状态和分享页属于 Week 8C。
- HTML 背景由邀请函内容直接注入，当前数据来源限于受信任的模板/编辑器内容；接入第三方内容前需要增加 HTML 清洗策略。
- 图片仍使用原生 `<img>`，便于支持编辑器中的任意 URL；生产环境可在确认远程图片域名后迁移到 `next/image`。
