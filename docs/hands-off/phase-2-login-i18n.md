# Carte Hands-off: Phase 2 登录流程本地化

**状态**: 登录页、邮箱验证码流程、OAuth 辅助文案和认证错误提示已完成 `en`/`zh-CN` 本地化，并通过服务器验收
**日期**: 2026-09-03
**依据**: `docs/tech-spec-detailed.md` 第九章国际化与 SEO、Phase 2 多语言支持清单，以及前序 Phase 2 i18n 交接文档

## 本阶段交付

- 登录页服务端文案接入 `next-intl`：
  - 页面 metadata、左侧品牌介绍、返回首页链接和条款说明支持当前 locale。
  - `/en/login` 与 `/zh-CN/login` 的登录入口保持 locale 前缀。
- 登录表单客户端文案全部接入当前 locale：
  - 邮箱/验证码步骤、字段标签、提示、加载状态、切换邮箱、分隔文案和 Google 登录按钮。
  - 验证码无效、请求失败和频率限制提示支持英文/中文。
  - Google OAuth callback URL 保留当前 locale，登录后游客草稿迁移流程不变。
- `/api/auth/request-code` 错误响应改为稳定 `errorCode`：
  - `invalidEmail`（HTTP 400）。
  - `rateLimited`（HTTP 429）。
  - `requestFailed`（HTTP 503）。
  - 客户端根据当前 locale 映射展示文案，不再把服务端英文错误直接显示给用户。
- 新增 `tests/e2e/login-i18n.spec.ts`，覆盖双语登录界面、页面标题、表单控件、Google 按钮和无效邮箱错误码契约。

## 本地代码验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis、本地应用服务器或真实浏览器：

```text
npm run lint                      PASS
npx tsc --noEmit                  PASS（build 完成后单独复核）
npm run build                     PASS（32 个 locale 静态页面）
npx playwright test --list        PASS（13 个测试）
git diff --check                  PASS
```

## 测试服务器验收

部署目标为 Ubuntu 测试服务器，Carte 继续通过 `3010` 对外访问，没有使用 80/443；正式运行时为 Node.js `v24.20.0`。

- 使用 Node 24 standalone 产物构建 `carte-app:login-i18n-20260903`。
- 候选容器绑定 `127.0.0.1:3011`，服务器 Chromium 执行登录 E2E：

```text
1 passed (5.1s)
```

- 正式容器已切换到 `carte-app:login-i18n-20260903`，英文/中文登录页返回 HTTP 200。
- 正式 `3010` 使用服务器 Chromium 再次执行登录 E2E：

```text
1 passed (3.7s)
```

- PostgreSQL、Redis 容器保持运行且为 `healthy`；数据卷未修改。
- 候选容器、构建上下文、E2E 临时目录和上传归档已清理；被替代的模板镜像已删除。

## 当前边界与下一步

- 登录表单真实邮箱投递和 Google OAuth 仍依赖服务器上的 provider 配置；当前测试服务器未配置有效 Google/Resend 凭据，因此本阶段验证界面和错误码契约，不伪造成功登录。
- `/api/auth/request-code` 的错误码是当前开发阶段唯一响应契约，不保留旧 `error` 字段兼容。
- Dashboard、编辑器、H5、分享页和模板详情的主要界面文案已迁移；剩余硬编码主要是用户输入内容、日志和第三方 provider 文案。
- 套餐购买、更多模板、RSVP 通知、照片画廊和访问统计仍按 Phase 2 功能路线后续开发。

## 提交

- 功能提交：`d34b54b feat: localize login workflow`
- 测试提交：`14a9294 test: cover localized login workflow`
- 本文档提交：见后续 docs commit。
