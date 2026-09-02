# Carte Hands-off: Phase 2 编辑器工作台本地化

**状态**: 编辑器工具栏、图层面板、Inspector、AI copy、保存/发布状态和新建入口已完成 `en`/`zh-CN` 本地化，并通过测试服务器验收
**日期**: 2026-09-03
**依据**: `docs/tech-spec-detailed.md` 第九章国际化与 SEO、Phase 2 多语言支持清单

## 本阶段交付

- 编辑器主工作区接入 `next-intl`：
  - 工具栏、撤销/重做、保存状态、预览和发布按钮。
  - 访客草稿 7 天提示、图层列表、显隐/锁定操作和无障碍标签。
  - Inspector 文案、图片上传提示、配色方案、实时预览和错误提示。
  - AI copy 生成、fallback/OpenAI 状态和选项应用。
- 编辑器新建入口 `/[locale]/editor/new` 支持双语：
  - 模板缺失、草稿创建失败、等待状态和返回模板导航。
  - 创建草稿和发布登录跳转保留当前 locale 前缀。
- Fabric 画布的视频背景和 canvas 无障碍标签支持由页面传入当前语言。
- AI copy 请求将当前路由 locale 传给 API，不再固定使用 `en`。
- 编辑器 metadata 和默认“未命名邀请函”按当前语言生成。

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

- 使用 Node 24 standalone 产物启动临时 `3011` 容器。
- 使用服务器 Chromium 执行国际化 E2E，覆盖英文/中文公开页面、语言切换、浏览器语言协商，以及 `/en/editor/new` 与 `/zh-CN/editor/new`：

```text
Running 1 test using 1 worker
1 passed (3.8s)
```

- 正式 app 已切换到 `carte-app:editor-i18n-20260903`：
  - `/en/editor/new` 返回 HTTP 200。
  - `/zh-CN/editor/new` 返回 HTTP 200。
  - PostgreSQL、Redis 保持 healthy，应用端口仍为 `3010`。
  - 正式 app 未启用 `E2E_TEST_MODE`；临时容器、staging、归档和旧 app 容器已清理。

## 当前边界与下一步

- 登录表单内部提示、RSVP 管理页、分享页和 H5 RSVP 组件仍有独立英文文案，下一阶段继续迁移。
- sitemap 双语言 URL、canonical/hreflang、邀请函内容 locale 覆盖和 H5 日期统一格式化尚未完成。
- 编辑器中的用户输入文案不会被系统自动翻译；AI 生成内容由请求 locale 影响提示语和模型输出。

## 提交

- 本阶段代码和文档提交信息：`feat: localize editor workspace`
