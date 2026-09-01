# Carte Hands-off: Phase 1, Week 8C-2 发布与分享

**状态**: 已完成本地开发、Docker 部署和测试服务器 HTTP 验收
**日期**: 2026-09-01
**依据**: `docs/tech-spec-detailed.md` Week 8 支付成功、短链接分享和二维码验收标准

## 本阶段交付

- 编辑器发布按钮改为调用 `POST /api/payment/create-checkout`，兼容规范响应 `data.checkoutUrl`；访客仍先跳转登录并保留 `continue` 参数。
- Dashboard 从数据库读取用户邀请函、真实草稿/发布数量、RSVP 数量、浏览量和最近支付历史。
- 支付成功回到 `/dashboard?payment=success` 时显示成功状态；实际邀请函发布状态由 Stripe Webhook 事务更新，避免只相信浏览器回跳。
- 新增 `/dashboard/invitations/[id]/share`：已发布邀请函显示公网短链接、打开 H5、复制链接、系统分享和二维码。
- 二维码由服务端 `qrcode` 生成 PNG Data URL，不依赖第三方二维码接口。
- 草稿访问分享页会回到编辑器，其他用户只能访问自己的 Dashboard/分享入口。
- 新增 `Dockerfile.standalone`，用于低磁盘服务器以 Node.js 24 standalone 产物构建轻量 runtime 镜像。

## 本地代码验证

以下检查均在本机执行，未启动 Docker、PostgreSQL、Redis 或应用服务器：

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

以上命令均通过；生产构建包含 Dashboard 分享路由和三个支付 API 路由。

## 测试服务器验收结果

部署目标为 Ubuntu 测试服务器 `/root/carte`，应用通过 `3010` 对外访问，没有使用 80/443。由于服务器磁盘空间紧张，使用本地已验证的 standalone 产物，以 Node.js 24 runtime 镜像重建 app；PostgreSQL/Redis 数据卷未删除。

使用服务器现有测试账户 `carte.tester@carte.test` 完成邮箱验证码登录后验证：

- Dashboard 返回 HTTP 200，显示支付成功提示、`published` 邀请函、Payment history 和 Share 入口。
- 分享页返回 HTTP 200，SSR HTML 含公网短链接 `http://139.180.215.236:3010/i/...` 和 `data:image/png;base64` 二维码。
- 已登录草稿调用 Checkout API，在 Stripe 环境变量缺失时返回 HTTP 503；旧发布接口也返回 HTTP 503。
- 未登录 Checkout/支付历史返回 HTTP 401；无效 Webhook 签名返回 HTTP 400。
- 临时启动回环地址 `127.0.0.1:3011` 的 Node 24 容器，使用合成 Stripe 测试签名发送同一 `checkout.session.completed` 事件两次；两次均返回 HTTP 200，数据库只保留 1 条支付记录，邀请函状态变为 `published`，公网 H5 返回 HTTP 200。
- 验收后已删除临时邀请函、支付记录、Redis key、认证 cookie、Webhook 容器和旧 runtime 标签；未删除任何数据库/Redis volume。app、PostgreSQL、Redis 仍 healthy，Node.js 为 `v24.20.0`。

## 未完成的真实外部验收

服务器 `.env` 当前未配置 `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET` 和 `STRIPE_PRICE_ID`（仅检查变量是否存在，未读取密钥值）。因此真实 Stripe Checkout 页面、Stripe CLI/Stripe Dashboard 回调和银行卡支付尚未执行；合成签名只覆盖本地签名校验及幂等发布事务。配置 Stripe 测试模式凭据后，应重新验收完整的 Checkout → Webhook → Dashboard → 分享闭环。

## 后续边界

- 真实环境需要将 Stripe Webhook URL 配置为 `/api/payment/webhook`，并使用 HTTPS 与生产密钥。
- 当前只支持单次 Stripe Price；3-pack/10-pack 价格变量已预留，套餐次数扣减属于后续账户计费阶段。
- RSVP 反滥用限流、邮件通知和批量发送仍属于后续阶段。
