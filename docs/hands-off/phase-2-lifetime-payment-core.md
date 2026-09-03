# Carte Hands-off: Phase 2 终身买断支付核心

**状态**: 数据模型、Checkout、Webhook 和终身发布事务已完成本地代码验证;尚未部署
**日期**: 2026-09-03
**依据**: `docs/tech-spec-detailed.md` 终身买断计费规范

## 本阶段交付

- `User.lifetimeAccessAt` 记录终身权益首次生效时间。
- `Payment.purchaseType` 只接受 `single_publish` 或 `lifetime` 业务类型。
- 新增 `DailyPublishUsage`,通过 `(userId, usageDate)` 唯一约束记录 UTC 每日发布次数。
- Checkout API 不再接受客户端 Price ID,服务端按购买类型选择 `STRIPE_PRICE_ID_SINGLE` 或 `STRIPE_PRICE_ID_LIFETIME`。
- 单次购买必须关联一份当前用户的未发布邀请函;终身买断可以从 Dashboard 独立购买,也可以关联当前待发布邀请函。
- Stripe Checkout metadata 明确写入 `userId`、`purchaseType` 和可选 `invitationId`。
- Webhook 仅在 `payment_status=paid` 时写入支付结果;同一 Checkout Session 重放不会重复授予权益或发布。
- 终身权益关联发布采用串行化数据库事务和最多 3 次并发冲突重试,每日上限为 10 次。
- 已有终身权益的用户不能创建新的付费 Checkout,避免重复收费或通过按次付费绕过每日上限。

## 数据库迁移

- 新增 `prisma/migrations/0006_lifetime_billing/migration.sql`。
- 原支付记录在迁移时标记为 `single_publish`;应用代码不保留旧接口或套餐兼容分支。
- 新数据必须显式写入 `purchaseType`。

## 本地验证

以下检查在本机执行,没有启动 Docker、数据库或应用服务器:

```text
npx prisma format                       PASS
npx prisma generate                     PASS
npx prisma validate                     PASS
npx tsc --noEmit --incremental false    PASS
npm run lint                            PASS
git diff --check                        PASS
```

## 下一阶段

接入编辑器的按次/终身支付选择对话框,为终身用户直接发布并显示每日剩余额度;Dashboard 增加终身买断入口和购买状态。
