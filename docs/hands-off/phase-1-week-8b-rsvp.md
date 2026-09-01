# Carte Hands-off: Phase 1, Week 8B RSVP

**状态**: 已完成本地开发、Docker 部署和测试服务器 HTTP 验收
**日期**: 2026-09-01
**依据**: `docs/tech-spec-detailed.md` 第七章 7.3、第五章 5.2.4、Week 8 RSVP 验收标准，以及 `docs/feature-supplement.md` RSVP 数据面板要求

## 本阶段交付

- 新增共享 `rsvpSchema`：校验邀请函 slug、姓名、邮箱/手机至少一个联系方式、出席状态（`attending`/`declined`/`maybe`）、人数（1–20 整数）、饮食偏好和 500 字以内留言。
- 新增公开 `POST /api/rsvp`：无需认证，只接受已发布邀请函；成功写入 `rsvps` 表并返回 RSVP ID，邀请函不存在/未发布返回 404，输入错误返回 400。
- 新增 H5 `RSVPForm` 客户端组件：邀请函 `settings.rsvpEnabled` 或内容 `settings.rsvpEnabled` 为 true 时展示；支持表单校验、提交状态、服务端错误和成功状态。
- 新增创建者接口 `GET /api/invitations/:id/rsvps`：必须登录且仅允许邀请函创建者查看，按提交时间倒序返回完整 RSVP 数据。
- 新增 `GET /api/invitations/:id/rsvps/export`：沿用创建者权限校验，返回 UTF-8 CSV，包含联系方式、状态、人数、饮食偏好、留言和提交时间。
- 新增 `/dashboard/invitations/[id]/rsvps` 数据页：显示回复/参加人数/party size/待定与拒绝汇总、详情表格及 CSV 导出入口。

## 本地代码验证

以下命令在本机执行，未启动 Docker、PostgreSQL、Redis 或应用服务器：

```text
npm run lint       PASS
npx tsc --noEmit   PASS
npm run build      PASS
```

生产构建确认包含：

- `/api/rsvp`
- `/api/invitations/[id]/rsvps`
- `/api/invitations/[id]/rsvps/export`
- `/dashboard/invitations/[id]/rsvps`
- H5 路由的 RSVP 客户端组件

## 测试服务器验收结果

部署目标为 Ubuntu 测试服务器 `/root/carte`，应用端口固定为 `3010`，不使用 80/443。部署时使用 Node.js 24 Docker 镜像，保留 PostgreSQL/Redis 数据卷。

使用临时的 published invitation（内容和 invitation settings 均开启 RSVP）完成验证：

- `/i/week8b-rsvp` 返回 HTTP 200，SSR HTML 包含 `Submit RSVP` 表单。
- 合法请求返回 HTTP 201，写入 `rsvps` 表的 `Alex Example / attending / partySize=2` 及饮食偏好、留言均正确。
- 缺少字段返回 HTTP 400；`partySize=21` 返回 HTTP 400；不存在 slug 返回 HTTP 404。
- 未登录访问列表和 CSV 接口均返回 HTTP 401。
- 使用测试账号登录后，列表返回 HTTP 200 和 RSVP 数据；CSV 返回 HTTP 200、`text/csv`、完整列名、UTF-8 BOM 和正确转义；Dashboard 数据页返回 HTTP 200 并显示访客。
- app 容器 Node.js `v24.20.0`；PostgreSQL、Redis 均 healthy；外部端口为 `3010`。
- 验收结束后已删除临时 invitation、RSVP、Redis key、认证 cookie、归档和构建缓存；未删除任何数据库/Redis volume。

服务器构建期间最低约 894 MB 可用空间；清理 builder cache 和 dangling image 后恢复约 3.3 GB 可用空间。

## 已知边界

- RSVP 接口当前没有邮件通知、重复提交去重或验证码/频率限制；正式上线前需增加反滥用策略。
- Dashboard 页面已提供单邀请函数据查看和 CSV 导出，Dashboard 总览统计卡片仍将在后续后台增强阶段接入真实聚合数据。
- Stripe Checkout、Webhook、支付成功发布状态和分享页属于 Week 8C。
