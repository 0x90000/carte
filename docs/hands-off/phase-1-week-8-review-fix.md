# Carte Hands-off: Phase 1, Week 8 Review Fix

**状态**: 已完成报告核验、兼容修复和测试服务器验收
**日期**: 2026-09-02
**依据**: `docs/week8-review-report.md`、`docs/tech-spec-detailed.md` Week 8 规范及 Week 8A-C2 hands-off 文档

## Review 结论

`docs/week8-review-report.md` 的 Review 日期为 2026-08-30，报告中的“编辑器、H5、RSVP、支付均缺失”和访客草稿无法读取等结论对应的是旧部署状态。当前 Week 8A-C2 已实现这些页面和接口，访客数据也已正确写入 `guest_drafts` 并通过 HttpOnly `carte_session_id` Cookie 隔离访问。

报告中 RSVP 请求使用了第一版字段名，和当前技术规范的 canonical 字段不同。由于项目仍在开发阶段，本阶段不保留旧字段或旧接口兼容；报告中的旧请求仅作为问题定位依据，最终实现严格遵循当前规范。

## 本阶段代码变更

- `refactor: enforce Week 8 canonical contracts`
  - `POST /api/rsvp` 仅接受技术规范字段：`invitationSlug`、`guestName`、`guestEmail`、`guestPhone`、`status`、`partySize`、`dietaryPreferences`、`message`。
  - 删除未纳入当前规范的 `/api/webhooks/stripe` 别名；Webhook 规范路径为 `/api/payment/webhook`。
  - RSVP API 直接使用 `rsvpSchema` 校验，并只按已发布邀请函的 `slug` 查询。

## 本地代码验证

以下检查均在本机执行，未启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint       PASS
npx tsc --noEmit   PASS
npm run build      PASS
```

生产构建确认包含 RSVP、规范支付 Webhook、H5、编辑器、Dashboard 和分享路由，且不包含旧 Webhook 别名。

## 测试服务器验收

目标为 Ubuntu 测试服务器，Carte 仅通过 `3010` 对外提供服务，运行时为 Node.js `v24.20.0`。数据库和 Redis 使用现有数据卷，未删除任何 PostgreSQL/Redis volume。

- 访客创建草稿后，使用同一 `carte_session_id` Cookie：`GET /api/invitations/:id` 返回 200，`GET /api/invitations` 返回草稿。
- canonical RSVP 请求返回 HTTP 201。
- 使用旧字段名的请求返回 HTTP 400，不会写入 RSVP 数据。
- 缺少邮箱和手机号的 RSVP 请求返回 HTTP 400。
- 以临时已发布邀请函验证 H5 和 RSVP 数据写入；验收后已删除临时邀请函及 RSVP。
- 使用临时 Node 24 容器和合成 Stripe 测试签名验证：
  - 相同 `checkout.session.completed` 事件重复发送到规范 Webhook 仍返回 HTTP 200，数据库只保留 1 条支付记录。
  - 邀请函从 `draft` 更新为 `published`，并可通过 H5 页面访问。
  - 无效签名返回 HTTP 400。
- 主服务未配置 Stripe 密钥时，Webhook 返回明确的 HTTP 503；这是配置边界，不是代码错误。
- `/api/webhooks/stripe` 不再存在，访问返回 HTTP 404；Stripe Webhook 必须使用 `/api/payment/webhook`。
- 验收结束后已删除临时 Webhook 容器、测试邀请函、支付记录、Redis 测试 key 和临时 runtime 文件。

## 服务器空间恢复

验收期间服务器曾因磁盘满导致 PostgreSQL recovery。仅清理了明确的临时资源：Docker 事件日志内容、临时 runtime 归档、builder cache、旧 dangling image 和未挂载的匿名 hash volume；保留 Carte PostgreSQL/Redis 及其他正在使用的业务卷。清理后根分区从 100% 恢复到约 78%（约 14GB 可用），PostgreSQL、Redis 和 app 均 healthy。

## 未完成项与后续边界

- 服务器 `.env` 尚未配置 `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET` 和 Stripe Price ID，因此真实 Stripe Checkout 页面及 Stripe Dashboard 回调仍需凭据后验收。
- RSVP 去重、限流、邮件通知不在本阶段范围内。
- 测试服务器 root 密码曾在协作信息中暴露，完成部署后应立即轮换密码，并改用 SSH key。
