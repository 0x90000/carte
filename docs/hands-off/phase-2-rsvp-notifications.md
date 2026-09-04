# Carte Hands-off: RSVP 每小时汇总通知

**状态**: 已完成代码实现、服务器候选验收和正式部署
**日期**: 2026-09-05
**依据**: `docs/tech-spec-detailed.md`、`docs/feature-supplement.md` 及产品确认的 RSVP 可靠性规则

## 产品规则

- 同一邀请函内，规范化邮箱重复提交返回 HTTP `409 DUPLICATE_RSVP`。
- 没有邮箱时，规范化手机号重复提交返回 HTTP `409 DUPLICATE_RSVP`。
- 公开 RSVP API 按来源 IP 每分钟最多 3 次；Redis 不可用时返回 `503`，不会静默放行。
- 不逐条发送 RSVP 邮件。调度器每小时按邀请函汇总未通知 RSVP；没有新增记录时不创建通知。
- 摘要先写入 `rsvp_notifications` 和关联 `email_sends`，再进入现有 Redis 邮件队列。
- 摘要邮件使用创建者账户语言（中文或英文），包含宾客姓名、状态、人数、联系方式、饮食偏好和留言。

## 代码交付

- `lib/rsvp-notification.ts`
  - `runRsvpNotificationDigest()` 按邀请函汇总并事务性认领 RSVP。
  - `queuePendingNotifications()` 在 Redis 恢复后重试待投递摘要。
  - `startRsvpNotificationScheduler()` 默认每小时运行；测试可用 `RSVP_NOTIFICATION_INTERVAL_MS` 缩短间隔。
  - `RSVP_NOTIFICATION_ENABLED=true` 显式启用；生产环境默认启用；`RSVP_NOTIFICATION_RUN_ON_START=1` 仅用于隔离验收。
- `lib/invitation-email-queue.ts`
  - 摘要关联的 `EmailSend` 与 `RSVPNotification` 状态、尝试次数、时间和错误同步更新。
- `lib/redis.ts`
  - Redis 初次连接超时后销毁失效 socket，后续调用可重新连接。
- `prisma/migrations/0008_rsvp_notifications/migration.sql`
  - 增加 RSVP 通知标记、摘要通知表和 `EmailSend` 关联。
- `tests/e2e/rsvp-notification.spec.ts`
  - 覆盖两条 RSVP 合并为一条摘要、空周期不新增、后续 RSVP 仅生成增量摘要。

## 本地代码验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint                         PASS
npx tsc --noEmit --incremental false PASS
npx prisma validate                  PASS（临时 DATABASE_URL）
npm run build                        PASS（移除 next/font/google 构建期外网依赖后）
npx playwright test --list           PASS（21 个测试）
git diff --check                     PASS
```

## 测试服务器验收

目标服务器为 Ubuntu `139.180.215.236`。正式应用继续使用 `3010`，没有使用 80/443；候选只绑定服务器回环 `127.0.0.1:3011`；运行时 Node.js `v24.20.0`。

- 应用 `0007_rsvp_dedupe_indexes`、`0008_rsvp_notifications` 已成功执行；迁移表显示 `finished_at` 非空。
- 使用 Node 24 standalone 镜像启动候选，服务器 Chromium 执行 `rsvp-notification.spec.ts`：`1 passed`。
- 候选验证了两条 RSVP 生成单条 `rsvp_notifications`（`rsvp_count=2`），无新增周期不生成第二条；加入第三条后第二条摘要只包含该新增 RSVP。
- 开启邮件 worker 后，摘要关联 `EmailSend` 在无有效 Resend key 的服务器上完成 3 次重试，最终 `EmailSend.status=failed`、`attempt_count=3`、`error_message=EMAIL_NOT_CONFIGURED`；`RSVPNotification` 同步为 `failed`。
- 验收中服务器曾因磁盘满触发 PostgreSQL 自动恢复；已删除本阶段归档、staging、候选容器和隔离 fixture，PostgreSQL/Redis 恢复为 healthy，fixture 用户、邀请函、RSVP 和摘要均为 0 残留。
- 因构建服务器无法稳定访问 Google Fonts，`app/layout.tsx` 改用 CSS 系统字体栈（Inter 优先），不再产生构建期外网依赖；本机 Node 24 standalone 构建成功。
- 正式 `carte-app-1` 已切换至 `carte-app:rsvp-notification-fontfix-20260905`；英文/中文首页均 HTTP 200，Node.js `v24.20.0`，PostgreSQL/Redis healthy。
- 部署后已删除候选容器、旧正式容器/镜像、上传归档和 staging；服务器根分区约 90% 使用率，数据卷未删除。

## 当前边界

- 服务器未配置有效 `RESEND_API_KEY`，本阶段只验收队列记录、重试和失败状态，不宣称真实邮件送达。
- 调度器为每个 app 进程启动一个内存 timer；多实例部署仍需要外部 cron/锁协调。
- `notificationSentAt` 在摘要事务提交时写入，表示已纳入摘要，不依赖 provider 投递成功。

## 提交

- `d0efb36 feat: add hourly rsvp digest notifications`
- `5949c64 test: make rsvp notification fixture self contained`
- `c3e0c59 fix: retry redis connections after startup timeout`
- `65d903d fix: destroy failed redis sockets before retry`
- `b618ade test: clean up digest fixtures on assertion failure`
- `833b689 docs: document rsvp notification settings`
- `a2522c3 fix: allow redis reconnect after disconnect`
- `6a1ece9 fix: remove google fonts build dependency`
