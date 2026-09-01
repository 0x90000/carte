# Carte Hands-off: Phase 1, Week 8B RSVP

**状态**: 已完成本地开发与代码验证；测试服务器 Docker/HTTP 验收待执行
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

## 测试服务器验收待办

部署目标为 Ubuntu 测试服务器 `/root/carte`，应用端口固定为 `3010`，不使用 80/443。部署时使用 Node.js 24 Docker 镜像，保留 PostgreSQL/Redis 数据卷。

使用临时的 published invitation（内容 settings 开启 RSVP）验证：

- `/i/{slug}` SSR HTML 显示 RSVP 表单；提交合法姓名、邮箱、状态和人数后返回 HTTP 201，`rsvps` 表新增记录。
- 仅邮箱、仅手机、三种出席状态、人数边界 1/20 和可选留言均可提交。
- 缺少姓名/联系方式、非法邮箱、非法状态、人数超出 1–20、留言超过 500 字返回 HTTP 400。
- 不存在或未发布邀请函的 RSVP 请求返回 HTTP 404。
- 未登录访问列表和 CSV 接口返回 HTTP 401；非创建者访问返回 HTTP 404。
- 创建者访问列表返回 RSVP 数据，CSV 返回正确的 `text/csv`、列名和转义内容；Dashboard 数据页包含汇总和明细。
- app 容器 Node.js 为 v24，PostgreSQL/Redis healthcheck 正常，外部端口为 3010。

验收完成后清理临时 invitation、RSVP、Redis key 和临时文件，不删除数据库/Redis volume。

## 已知边界

- RSVP 接口当前没有邮件通知、重复提交去重或验证码/频率限制；正式上线前需增加反滥用策略。
- Dashboard 页面已提供单邀请函数据查看和 CSV 导出，Dashboard 总览统计卡片仍将在后续后台增强阶段接入真实聚合数据。
- Stripe Checkout、Webhook、支付成功发布状态和分享页属于 Week 8C。
