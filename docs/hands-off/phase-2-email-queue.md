# Carte Hands-off: Phase 2 批量邮件队列与重试

**状态**: Redis 队列、异步 worker 和最多 3 次失败重试已完成并通过服务器验收
**日期**: 2026-09-02
**依据**: `docs/feature-supplement.md` 第五章定时任务验收标准和批量邮件发送要求

## 本阶段交付

- 新增 `lib/invitation-email-queue.ts`：
  - 使用现有 Redis list `carte:email-send-queue` 保存发送任务。
  - app 启动 worker 后使用非阻塞 `LPOP` 轮询，避免占用认证和其他业务共享 Redis 连接。
  - 发送前将记录标记为 `sending`，增加 `attemptCount` 并写入 `lastAttemptAt`。
  - Resend 成功后标记 `sent` 并写入 `sentAt`；失败最多重试 3 次，最终标记 `failed` 并保留错误信息。
  - 重试采用递增短暂延迟，worker 异常会记录日志并继续工作。
- `POST /api/invitations/:id/send-emails` 的 `sendImmediately: true` 改为入队并返回 HTTP 202，不在请求中同步等待 provider。
- 生产环境默认启动邮件 worker；显式设置 `EMAIL_QUEUE_ENABLED=false` 可关闭，开发环境默认关闭。
- `EmailSend` 增加 `attempt_count`、`last_attempt_at` 字段及索引，迁移为 `0005_email_queue_retry`。
- Dashboard 提示改为 “Email delivery queued.”，不把入队误报为投递完成。

## 本地代码验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint                         PASS
npx tsc --noEmit --incremental false PASS
npx prisma validate                  PASS（临时 DATABASE_URL）
npm run build                        PASS
npx playwright test --list           PASS（6 个测试）
git diff --check                     PASS
```

## 测试服务器验收

部署目标为 Ubuntu 测试服务器 `/root/carte`，Carte 通过 `3010` 对外访问，没有使用 80/443；Node.js runtime 为 `v24.20.0`。

- 执行并应用 `0005_email_queue_retry` migration。
- 使用包含 `.next/static` 的 Node 24 standalone 产物构建并部署 `carte-app:standalone-email-queue-final-20260902`。
- app 启动日志包含 `[InvitationEmailQueue] worker started`；首页返回 HTTP 200。
- 在数据库插入隔离的 `pending` 发送记录并将 ID 写入 Redis 队列；因服务器未配置有效 `RESEND_API_KEY`，worker 依次重试 3 次。
- 最终状态检查：`status=failed`、`attempt_count=3`、`error_message=EMAIL_NOT_CONFIGURED`、`last_attempt_at` 非空，Redis 队列长度为 0。
- PostgreSQL、Redis 保持 healthy；正式 app 的 `E2E_TEST_MODE` 未开启；验收后已删除临时用户、邀请函、发送记录、Redis key、上传归档和 staging。

## 当前边界

- 服务器没有真实 Resend 凭据，因此未验证真实邮件送达、provider 回执、退信和打开/点击追踪。
- 当前重试在同一 app 进程内执行，进程崩溃恢复、任务可见性超时和多实例 worker 协调仍属于后续可靠性增强。
- 生产上线前应配置 Resend、限制发送频率，并对队列和失败记录增加监控告警。

## 提交

- 本阶段代码和 schema 提交：`feat: queue invitation email delivery`
