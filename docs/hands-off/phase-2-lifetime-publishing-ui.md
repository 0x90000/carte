# Carte Hands-off: Phase 2 终身发布界面

**状态**: 编辑器与 Dashboard 交互已完成本地代码验证;尚未部署
**日期**: 2026-09-03
**依据**: `docs/tech-spec-detailed.md` 终身买断与发布规则

## 本阶段交付

- 编辑器发布按钮先调用发布 API:
  - 终身用户在每日额度内直接发布并进入分享页。
  - 普通用户收到 `PAYMENT_REQUIRED` 后显示按次发布和终身买断选项。
  - 达到每日 10 次上限时显示明确的 UTC 重置提示。
- 付款对话框提供且只提供两种产品:
  - 按次发布 `$9.90`,关联当前邀请函。
  - 终身买断 `$299`,购买后终身每天最多发布 10 份新邀请函。
- Dashboard 新增终身权益区域:
  - 普通用户可独立购买终身权益。
  - 终身用户可查看当日已用、剩余和总上限。
- Dashboard 支付历史按 `single_publish` / `lifetime` 显示购买项目,不再显示套餐或套餐余额。
- 支付成功和取消提示区分按次发布与终身买断,并明确最终状态以 Stripe Webhook 确认为准。
- 英文与简体中文文案同步完成。

## 本地验证

以下检查在本机执行,没有启动 Docker、数据库或应用服务器:

```text
npx tsc --noEmit --incremental false    PASS
npm run lint                            PASS
git diff --check                        PASS
messages/en.json JSON parse             PASS
messages/zh-CN.json JSON parse          PASS
```

## 下一阶段

补充服务器 E2E 场景,覆盖按次 Checkout 请求、终身 Webhook 幂等写入、终身用户直接发布、第 10 次成功和第 11 次限流;完成后再部署正式测试容器。
