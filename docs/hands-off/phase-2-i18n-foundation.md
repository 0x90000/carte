# Carte Hands-off: Phase 2 国际化基础与公开页面

**状态**: `en`/`zh-CN` locale 路由、浏览器语言协商、语言切换器和公开创作入口已完成并通过测试服务器验收
**日期**: 2026-09-03
**依据**: `docs/tech-spec-detailed.md` 第九章国际化与 SEO、Phase 2 多语言支持清单

## 本阶段交付

- 接入 next-intl request config 和 middleware：
  - 支持 `en` 与 `zh-CN`
  - 页面 URL 强制包含语言前缀（如 `/en`、`/zh-CN/templates`）
  - 无前缀首次访问按 `Accept-Language` 协商并重定向
  - 保留 API 路由和访客 session cookie 行为
- 新增 `messages/en.json` 与 `messages/zh-CN.json`，覆盖首页、场景选择、模板库和登录页公开文案。
- 新增 locale layout 与语言切换器：
  - 当前语言使用明确状态样式和 `aria-current`
  - 切换时保留当前页面路径
- 为首页、场景选择、模板库、模板详情、登录、Dashboard、编辑器、分享、RSVP 和 H5 建立带语言前缀的入口；现有公开页面可在新入口下继续 SSR。
- 根布局根据 next-intl 当前 locale 设置 HTML `lang` 属性。

## 本地代码验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint                         PASS
npx tsc --noEmit --incremental false PASS
npm run build                        PASS（32 个静态 locale 页面）
npx playwright test --list           PASS（8 个测试）
git diff --check                     PASS
```

## 测试服务器验收

部署目标为 Ubuntu 测试服务器 `/root/carte`，Carte 通过 `3010` 对外访问，没有使用 80/443；Node.js runtime 为 `v24.20.0`。

- 使用 Node 24 standalone 产物构建并启动隔离候选容器，首页返回 307 并设置 `NEXT_LOCALE`；`/en` 与 `/zh-CN` 返回 200。
- 服务器 Chromium E2E 通过（1 passed）：英文首页显示英文标题，中文首页显示中文标题；语言切换链接分别指向 `/zh-CN` 与 `/en`；带 `Accept-Language: zh-CN` 请求 `/` 重定向到 `/zh-CN`。
- `/en/create`、`/zh-CN/create`、`/en/templates`、`/zh-CN/templates`、`/en/login`、`/zh-CN/login` 返回 200；未登录 `/en/dashboard` 按预期重定向到登录页。
- 正式 app 已切换到 `carte-app:i18n-20260903` 并通过 `3010` 返回 HTTP 200；PostgreSQL、Redis healthy，邮件队列 worker 仍正常启动。
- 验收后已删除隔离候选容器、locale E2E staging、归档和临时数据；正式 app 未开启 `E2E_TEST_MODE`。

## 后续子阶段边界

- 当前公开页面已翻译；Dashboard、登录表单内部、编辑器工具栏、分享页、RSVP 管理页和 H5 RSVP 组件仍保留部分英文硬编码文案，下一子阶段逐页迁移到 messages。
- 邀请函活动内容由用户输入，不能由系统字典翻译；事件日期在 H5 中继续使用邀请函自身 locale，后续会增加路由 locale 覆盖和统一日期格式化。
- sitemap 当前仍输出无语言前缀 URL；下一子阶段需扩展为两个 locale 的公开 URL，并同步更新 canonical/hreflang metadata。
- 货币格式仍在 Dashboard 使用 `en-US`，待账户/套餐阶段接入 locale-aware formatter。

## 提交

- 本阶段代码和文档提交信息：`feat: add locale routing and public translations`
