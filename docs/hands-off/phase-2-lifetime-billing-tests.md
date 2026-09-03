# Carte Hands-off: Phase 2 终身计费测试覆盖

**状态**: 自动化场景已编写并通过本地发现、类型检查和生产构建;服务器执行待部署阶段完成
**日期**: 2026-09-04
**依据**: `docs/tech-spec-detailed.md` 终身买断规则和支付 Webhook 验收要求

## 本阶段交付

新增 `tests/e2e/lifetime-billing.spec.ts`,包含两个隔离场景:

- 普通账户:
  - Dashboard 显示 `$299` 终身买断入口。
  - 编辑器发布时只出现 `$9.90` 按次发布和 `$299` 终身买断。
  - 缺少邀请函 ID 的按次 Checkout 请求返回 `INVALID_CHECKOUT`。
- 终身账户:
  - 发送有效 Stripe HMAC 签名的 `checkout.session.completed` 事件两次。
  - Dashboard 只显示一条 `$299` 终身支付记录,首次关联邀请函只计一次。
  - 当日第 10 次新发布成功,第 11 次返回 `DAILY_LIMIT_REACHED` 和 HTTP 429。
  - Dashboard 最终显示当日已使用 10 次、剩余 0 次。

用例默认跳过,仅在服务器候选环境显式设置 `LIFETIME_BILLING_TEST_MODE=1` 和隔离 fixture 变量时执行。

## 本地验证

以下检查在本机执行,没有启动 Docker、数据库或应用服务器:

```text
npx playwright test --list              PASS (15 tests / 12 files)
npx tsc --noEmit --incremental false     PASS
npm run lint                             PASS
npm run build                            PASS (Node.js v24.11.1)
git diff --check                         PASS
```

## 下一阶段

将 standalone 产物部署到测试服务器候选端口,应用 `0006_lifetime_billing` 迁移,创建并最终清理隔离用户、邀请函、支付和每日计数数据,使用服务器 Playwright 容器执行本用例。
