# Carte Hands-off: Phase 2 按次与终身买断计费

**状态**: 已完成本地开发、Docker 部署、服务器浏览器验收和隔离数据清理
**日期**: 2026-09-04
**依据**: `docs/tech-spec.md`、`docs/tech-spec-detailed.md` 终身买断计费规则

## 本阶段交付

- 移除 3 次和 10 次套餐,只保留:
  - 单次发布 `$9.90`
  - 终身买断 `$299`
- 终身权益永久生效,每个 UTC 自然日最多发布 10 份此前未发布的邀请函;编辑已发布邀请函不计次。
- `User.lifetimeAccessAt` 记录权益状态,`DailyPublishUsage` 以用户和 UTC 日期唯一记录每日使用量。
- 发布事务使用 Serializable 隔离和并发冲突重试,第 11 次发布返回 HTTP 429,不会产生状态或计数变更。
- `POST /api/payment/create-checkout` 使用 `single_publish` / `lifetime` 购买类型,Price ID 仅从服务端环境变量读取:
  - `STRIPE_PRICE_ID_SINGLE`
  - `STRIPE_PRICE_ID_LIFETIME`
- 单次 Checkout 必须关联当前用户的未发布邀请函;终身 Checkout 可独立购买,也可关联当前邀请函。
- Webhook 仅处理 Stripe `payment_status=paid` 的 Checkout Session;重复 Session 不会重复写支付、授予权益、发布或计数。
- 编辑器按账户状态直接发布或显示两种付款选项;Dashboard 显示终身权益、每日额度和购买入口。
- 支付历史显示单次发布或终身权益,不再显示套餐余额。

## Git 提交

- `aac4e40 docs: replace packages with lifetime billing`
- `08b816e feat: add lifetime billing core`
- `2663ca9 feat: add lifetime publishing experience`
- `793f2b6 test: cover lifetime billing workflow`
- `cbce59d test: target visible billing dialog content`

## 本地验证

以下命令均在本机执行,没有启动 Docker、PostgreSQL、Redis 或应用服务器:

```text
npx prisma format                       PASS
npx prisma generate                     PASS
npx prisma validate                     PASS
npx tsc --noEmit --incremental false    PASS
npm run lint                            PASS
npm run build                           PASS
npx playwright test --list              PASS (15 tests)
git diff --check                        PASS
```

本机 Node.js 为 `v24.11.1`。

## 测试服务器验收

部署目标为 Ubuntu 测试服务器 `139.180.215.236`,正式应用继续使用 `3010`,没有使用 80/443。正式容器为 `carte-app-1`,镜像 `carte-app:lifetime-billing-20260904`,运行 Node.js `v24.20.0`。

- `0006_lifetime_billing` 已通过 Docker Prisma migrate deploy 应用。
- PostgreSQL、Redis 均 healthy;数据卷 `carte_carte_postgres_data` 和 `carte_carte_redis_data` 未删除。
- 服务器 Playwright Chromium 候选验收通过:
  - 普通账户显示按次和终身两个付款选项,无 3/10 次套餐文案。
  - 模拟 Stripe HMAC 签名的 lifetime `checkout.session.completed` 事件发送两次,两次均 HTTP 200,数据库只保留一条 `$299` 支付,权益只授予一次。
  - 终身账户第 1 至第 10 次新发布成功,第 11 次 HTTP 429 `DAILY_LIMIT_REACHED`。
  - Dashboard 显示 `0 of 10 publications remaining today (10 used)`。
- 正式 `3010` 服务器 Chromium smoke 通过:英文首页标题可见,未登录 Dashboard 重定向 `/en/login`,未登录 Checkout 返回 HTTP 401。
- 验收后已删除候选容器、临时归档、Playwright staging、隔离账户、11 份邀请函、支付记录、每日计数和相关 Redis key;保留现有测试账户 `carte.tester@carte.test`。

## 未完成的真实外部验收

服务器 `.env` 当前未配置 Stripe 测试模式密钥和两个 Price ID,因此真实 Stripe Checkout 页面、银行卡支付和 Stripe Dashboard Webhook 尚未执行。本阶段的 Webhook 验收使用服务器候选容器中的固定测试签名,仅覆盖签名校验、权益事务和幂等处理。配置真实 Stripe 测试凭据后,应补做单次支付和终身买断的完整 Checkout → Webhook → Dashboard → 分享闭环。

## 当前边界

- 退款后的终身权益撤销尚未自动化,启用退款流程前需要单独定义规则。
- 每日额度按 UTC 计算,不按用户 locale 或时区转换。
- 单次支付不计入终身用户的每日免费发布计数;终身用户不可通过按次 Checkout 绕过每日上限。
