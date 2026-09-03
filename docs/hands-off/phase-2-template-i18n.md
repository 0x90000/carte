# Carte Hands-off: Phase 2 模板详情本地化

**状态**: 模板列表与详情页已完成 `en`/`zh-CN` 本地化、locale SEO metadata、服务器候选验收和正式部署
**日期**: 2026-09-03
**依据**: `docs/tech-spec-detailed.md` 第九章国际化与 SEO、Phase 2 多语言支持清单，以及前序 Phase 2 i18n/SEO 交接文档

## 本阶段交付

- 模板详情页静态文案接入 `next-intl`：
  - 返回模板、图层、可编辑字段、配色方案、背景类型、使用模板、Premium/Included 和功能列表支持双语。
  - 场景、风格、背景类型、预览图片 alt 和高级模板 aria-label 使用当前 locale 翻译。
  - 详情页首页、模板列表、模板卡片、预览和编辑器入口均保留当前 locale 前缀。
- 模板列表卡片移除硬编码英文场景、风格、背景和图片辅助文案；筛选表单、空状态和导航链接统一使用 locale 路径。
- 模板详情页 metadata 支持当前 locale：
  - localized title suffix 和 fallback description。
  - canonical、`en`/`zh-CN` alternate hreflang。
  - Open Graph title、description、preview image 和绝对 URL。
- 新增 `tests/e2e/template-i18n.spec.ts`，覆盖英文/中文详情页、模板卡片风格标签、链接、标题和 SEO link 标签。

## 本地代码验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis、本地应用服务器或真实浏览器：

```text
npm run lint                      PASS
npx tsc --noEmit                  PASS
npm run build                     PASS（32 个 locale 静态页面）
npx playwright test --list        PASS（12 个测试）
git diff --check                  PASS
```

## 测试服务器验收

部署目标为 Ubuntu 测试服务器，Carte 继续通过 `3010` 对外访问，没有使用 80/443；正式运行时为 Node.js `v24.20.0`。

- 使用 Node 24 standalone 产物构建 `carte-app:template-i18n-20260903`。
- 候选容器绑定 `127.0.0.1:3011`，服务器 Chromium 执行模板详情测试：

```text
1 passed (4.9s)
```

- 正式容器已切换到最新镜像 digest，`/en/templates/:id` 和 `/zh-CN/templates/:id` 返回 HTTP 200。
- 正式 `3010` 使用服务器 Chromium 执行 i18n、SEO 两项和模板详情测试：

```text
4 passed (8.5s)
```

- PostgreSQL、Redis 容器保持运行且为 `healthy`；数据卷未修改。
- 候选容器、构建上下文、E2E 临时目录和上传归档已清理。

## 当前边界与下一步

- 登录表单内部状态、错误提示和 OAuth 辅助文案仍有英文硬编码，下一子阶段可迁移到 `messages`。
- 模板名称、描述和标签属于数据库内容，系统不自动翻译用户/运营输入。
- 模板详情页面已具备基础 locale SEO；结构化 JSON-LD、真实域名/HTTPS、Search Console、Lighthouse 和生产监控仍属于后续上线阶段。

## 提交

- 功能提交：`599c326 feat: localize template detail workspace`
- 测试提交：`072284c test: cover localized template details`、`fa8cfe9 fix: scope template locale assertion`、`ecaeebc test: cover localized template card labels`
- 补充修复：`61409bc fix: localize template card style labels`
- 本文档提交：见后续 docs commit。
