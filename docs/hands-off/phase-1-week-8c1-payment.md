# Carte Hands-off: Phase 1, Week 8C-1 支付核心

**状态**: 已完成本地开发、Docker 部署和测试服务器基础 HTTP 验收
**日期**: 2026-09-01
**依据**: `docs/tech-spec-detailed.md` 第五章 5.2.6、第十章 10.1-10.2 及 Week 8 支付验收标准

## 本阶段交付

- 新增 `POST /api/payment/create-checkout`：登录用户创建 Stripe Checkout Session，验证邀请函归属、草稿状态和允许的价格 ID，返回 Checkout URL、Session ID 和 Payment Intent ID。
- 新增 `POST /api/payment/webhook`：读取原始请求体，校验 `stripe-signature`，处理 `checkout.session.completed`、异步支付成功和支付失败事件。
- 新增 `GET /api/payment/history`：登录用户按时间倒序查看自己的支付记录，并附带邀请函标题和短链接。
- 新增 `lib/stripe.ts` 统一 Stripe 客户端、价格配置和 Checkout 创建逻辑。
- 新增 `lib/payment.ts` 处理支付成功的数据库事务：创建或更新支付记录、将邀请函设为 `published`、保留首次发布时间并清理 H5 Redis 缓存；重复 Webhook 按 Checkout Session/Payment Intent 标识复用原记录。
- 旧的 `POST /api/invitations/:id/publish` 保留兼容，并改为复用统一 Stripe 创建服务。
- `Payment` 增加 `provider_session_id` 唯一字段，并新增 Prisma migration `0003_payment_provider_session_id`，用于 Webhook 幂等匹配。
- `.env.example` 补充 Stripe 测试模式变量。

## 本地代码验证

以下检查均在本机执行，未启动 Docker、PostgreSQL、Redis 或应用服务器：

- `npx prisma format`
- `npx prisma generate`
- `DATABASE_URL=... npx prisma validate`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

以上命令均通过。生产构建包含三个新 API 路由。

## 测试服务器验收结果

部署目标为 Ubuntu 测试服务器 `/root/carte`，应用端口固定为 `3010`，没有使用 80/443。由于完整 Compose builder 在低磁盘环境下中断，本次使用本地已通过构建的 standalone 产物，在服务器以 Node.js 24 runtime 镜像完成 Docker 部署；PostgreSQL/Redis 数据卷未删除。

已执行 Prisma migration `0003_payment_provider_session_id`，并验证：

- 未登录 `POST /api/payment/create-checkout` 返回 HTTP 401 和 `Unauthorized`。
- 未登录 `GET /api/payment/history` 返回 HTTP 401。
- 未登录旧发布接口返回 HTTP 401。
- Stripe 未配置时 `POST /api/payment/webhook` 返回 HTTP 503，不处理未签名请求。
- 首页返回 HTTP 200；app 容器 Node.js `v24.20.0`；PostgreSQL、Redis 均 healthy；外部端口为 `3010`。
- 删除了本次上传的 runtime 临时目录和失败 builder dangling image，未删除数据库/Redis volume。

服务器 Stripe 环境变量名称检查（未读取密钥值）结果：

- `STRIPE_SECRET_KEY`: 未配置
- `STRIPE_WEBHOOK_SECRET`: 未配置
- `STRIPE_PRICE_ID`/`STRIPE_PRICE_ID_SINGLE`: 未配置

因此真实 Stripe Checkout、签名 Webhook 和成功发布闭环需要配置 Stripe 测试模式凭据后再验收；当前代码已保留配置缺失时的明确 `503` 响应。

## 下一阶段

Week 8C-2 将让编辑器直接调用 `/api/payment/create-checkout`，补齐支付成功后的 Dashboard 状态、分享页、复制短链接和二维码入口，并在 Stripe 测试凭据可用后完成服务器 Docker/HTTP 联调。
