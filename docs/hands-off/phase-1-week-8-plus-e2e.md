# Carte Hands-off: Phase 1, Week 8+ Playwright E2E

**状态**: 已完成本地实现、服务器 E2E 验收和测试环境清理
**日期**: 2026-09-02
**依据**: `docs/tech-spec-detailed.md` Week 8+ 测试任务、第 11.3 节 E2E 测试策略

## 本阶段交付

- 安装 `@playwright/test`，新增 `npm run test:e2e` 和 `npm run test:e2e:report`。
- 新增 `playwright.config.ts`：
  - 默认访问 `http://139.180.215.236:3010`，不启动本地 `webServer`。
  - 单 worker、Chromium 项目、失败保留 trace/screenshot/video，并设置导航/操作超时。
  - 可通过 `PLAYWRIGHT_BASE_URL` 覆盖目标地址。
- 新增 `tests/e2e/guest-invitation.spec.ts`，覆盖：
  - 访客从场景选择、模板详情进入编辑器。
  - 访客草稿保存、刷新后标题保留。
  - 访客点击 Publish 跳转 `/login`，并保留内部 `continue=/editor/:id?action=publish`。
- 新增 `tests/e2e/guest-migration.spec.ts`，覆盖：
  - 访客草稿登录后自动迁移到 `invitations`。
  - 迁移后 API 返回 `isGuest: false`，Dashboard 可见该邀请函。
- 新增 `tests/e2e/helpers.ts`，统一场景创建、测试邮箱和验证码登录步骤。
- 新增仅测试环境验证码注入：当且仅当 `E2E_TEST_MODE=1` 且 `E2E_TEST_EMAIL_CODE` 为六位数字时使用固定验证码，并跳过 Resend 发送；默认随机验证码、Redis TTL、60 秒冷却和生产邮件逻辑不变。
- `.env.example` 增加测试变量说明，Playwright 输出目录加入 `.gitignore`。

## 本地代码验证

以下命令均在本机执行，未启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint             PASS
npx tsc --noEmit         PASS
npm run build            PASS
npx playwright test --list  PASS（2 个测试）
```

本机未执行真实 E2E；真实浏览器测试按约束在 Ubuntu 测试服务器执行。

## 测试服务器验收

部署目标为 Ubuntu 测试服务器。验收期间：

- 使用本阶段 standalone 产物构建 Node.js 24 镜像，并临时启动 `127.0.0.1:3011` app；现有 `3010` 服务未中断。
- 临时 app 使用 Docker 网络内的 PostgreSQL/Redis 地址，并注入 `E2E_TEST_MODE=1`、固定测试码 `246810`；官方 `mcr.microsoft.com/playwright:v1.62.1-noble` 镜像执行测试。
- Playwright 结果：

```text
Running 2 tests using 1 worker
2 passed (10.6s)
```

- 验收覆盖 Chromium 下的访客创建、编辑保存、发布前登录跳转和登录后数据迁移。
- 清理了本轮生成的 `e2e-*` 测试用户、访客草稿和迁移邀请函；临时 app、测试目录和上传归档已删除。
- 正式测试 app 已切换到新镜像并继续使用 `3010`，返回 HTTP 200；PostgreSQL、Redis 保持 healthy，Node.js runtime 为 `v24.20.0`。
- 正式 `3010` app 未设置 `E2E_TEST_MODE`，不会使用固定验证码。
- 未删除 PostgreSQL/Redis 数据卷，未使用 80/443 端口。

## 当前边界

- 本阶段没有伪造 Stripe 支付，也没有把真实 Stripe Checkout 作为 E2E 前置；服务器当前未配置 Stripe 测试凭据。支付成功发布、分享页二维码、RSVP、SEO、Lighthouse 和备份仍需后续阶段验收。
- 当前只配置 Chromium；Safari、Firefox、移动设备和真实 Stripe 账户属于后续兼容性/生产验收。
- E2E 测试会创建短期测试数据；服务器执行后应按本文件的清理步骤删除，生产环境不得启用测试变量。

## 提交

- `3f21f89 test: add Playwright guest flow coverage`
- 本文档提交见后续 docs commit。
