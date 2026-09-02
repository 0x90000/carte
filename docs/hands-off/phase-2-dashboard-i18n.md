# Carte Hands-off: Phase 2 Dashboard 工作台本地化

**状态**: Dashboard 工作台文案、操作反馈、金额/日期格式和 locale 内部导航已完成，并通过测试服务器验收
**日期**: 2026-09-03
**依据**: `docs/tech-spec-detailed.md` 第九章国际化与 SEO、Phase 2 多语言支持清单

## 本阶段交付

- Dashboard 服务端页面接入 `next-intl`：
  - 统计卡片、筛选器、邀请函列表、空状态、付款记录和元数据支持 `en`/`zh-CN`。
  - 未登录访问按当前 locale 重定向到对应的 `/{locale}/login`。
- Dashboard 所有工作台导航保留当前语言前缀：
  - 首页、创建、编辑器、分享页、RSVP 页面和公开邀请函链接均通过统一 `localePath` 生成。
- Dashboard 交互组件接入双语消息：
  - 邀请函复制、删除确认和错误提示。
  - 邮件发送、预览、队列状态、发送历史和错误提示。
- 本地化格式：
  - 付款金额使用当前 locale 的 `Intl.NumberFormat` 货币格式。
  - 邀请函编辑时间和付款日期使用当前 locale 的 `Intl.DateTimeFormat`。
  - 付款状态在工作台显示本地化标签。

## 本地代码验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint                         PASS
npx tsc --noEmit --incremental false PASS
npm run build                        PASS（32 个静态 locale 页面）
git diff --check                     PASS
```

## 测试服务器验收

部署目标为 Ubuntu 测试服务器 `/root/carte`，Carte 通过 `3010` 对外访问，没有使用 80/443；Node.js runtime 为 `v24.20.0`。

- 使用 Node 24 standalone 产物构建并启动临时容器，服务器 Chromium 国际化 E2E：

```text
Running 1 test using 1 worker
1 passed (3.2s)
```

- 临时容器验证了英文/中文 locale 页面、语言切换链接和 `Accept-Language: zh-CN` 自动协商。
- 正式 app 已切换到 `carte-app:dashboard-i18n-20260903`：
  - `/en` 返回 HTTP 200。
  - `/zh-CN` 返回 HTTP 200。
  - `/` 返回 HTTP 307 并按默认语言跳转。
  - `/robots.txt` 返回 HTTP 200。
  - 未登录 `/en/dashboard` 按预期跳转 `/en/login`。
- PostgreSQL、Redis 保持 healthy；正式 app 未启用 `E2E_TEST_MODE`；临时容器、测试 staging、归档和旧 app 容器已清理。

## 当前边界与下一步

- RSVP 管理页、分享页、编辑器工具栏和 H5 RSVP 组件仍有独立英文文案，下一阶段逐页迁移。
- sitemap 尚未扩展为双 locale URL，canonical/hreflang 也尚未统一；公开页面 SEO 本地化单独处理。
- 邀请函用户输入内容不做自动翻译；H5 活动日期和编辑器更多日期字段的 locale 覆盖待后续统一 formatter 阶段处理。

## 提交

- 本阶段代码和文档提交信息：`feat: localize dashboard workspace`
