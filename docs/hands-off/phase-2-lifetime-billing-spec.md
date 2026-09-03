# Carte Hands-off: Phase 2 终身买断计费规范

**状态**: 产品规则已确认并同步到技术规格,尚未进入代码实现
**日期**: 2026-09-03
**依据**: 用户确认取消套餐,仅保留按次付费和 $299 终身买断

## 本阶段决策

- 删除 3 次和 10 次套餐,不保留套餐余额或兼容逻辑。
- 保留单次发布,价格为 $9.90,每次支付关联并发布一份邀请函。
- 新增 $299 一次性终身买断,支付成功后账户权益永久生效。
- 终身用户每个 UTC 自然日最多发布 10 份此前未发布的邀请函。
- 编辑或保存已经发布的邀请函不占用每日额度。
- Dashboard 展示终身权益状态和当日剩余发布次数,不再展示套餐余额。
- Checkout 请求使用服务端定义的 `single_publish` 或 `lifetime` 类型选择 Stripe Price ID,客户端不提交任意 Price ID。
- 本阶段不自动处理退款后的终身权益撤销;退款规则需在启用退款流程前单独确认。

## 已更新文档

- `docs/tech-spec.md`
- `docs/tech-spec-detailed.md`
- `.env.example`

环境变量由 `STRIPE_PRICE_ID_SINGLE` 和 `STRIPE_PRICE_ID_LIFETIME` 组成,原 3-pack/10-pack 变量已删除。

## 下一阶段

实现 Prisma 数据模型、Stripe Checkout metadata、Webhook 幂等终身权益写入,随后实现每日发布限制和前端购买入口。
