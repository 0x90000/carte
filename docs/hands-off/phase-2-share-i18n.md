# Carte Hands-off: Phase 2 邀请函分享页本地化

**状态**: 发布后分享页、短链接、二维码、复制/分享交互和 metadata 已完成 `en`/`zh-CN` 本地化，并通过测试服务器验收
**日期**: 2026-09-03
**依据**: `docs/tech-spec-detailed.md` 第九章国际化与 SEO、Week 8C-2 分享页要求和 Phase 2 多语言支持清单

## 本阶段交付

- 分享页服务端文案接入 `next-intl`：
  - 页面标题、描述、返回 Dashboard、打开邀请函、公开链接、二维码和扫码提示支持双语。
  - 未登录重定向、未发布邀请函编辑器重定向和内部导航保留当前 locale 前缀。
  - 分享页生成的公开 URL 使用当前 locale（如 `/{locale}/i/{slug}`），二维码内容与页面链接一致。
  - 二维码 `alt` 文案和分享页 metadata 支持当前语言及邀请函标题。
- 分享页客户端交互接入 `next-intl`：
  - “Copy link”“Copied”“Share”按钮支持双语。
  - 浏览器不支持 Web Share API 时继续回退到复制链接，并显示本地化复制状态。
- 新增受环境变量保护的 `share-i18n.spec.ts`，覆盖登录、中文/英文分享页、locale 公开链接、二维码 alt 和复制/分享按钮。

## 本地代码验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint                         PASS
npx tsc --noEmit                    PASS（构建内置类型检查）
npm run build                        PASS（32 个静态 locale 页面）
npx playwright test --list           PASS（11 个测试）
git diff --check                     PASS
```

生产构建确认包含：

- `/[locale]/dashboard/invitations/[id]/share`
- `/dashboard/invitations/[id]/share`
- `share` 双语消息资源和客户端分享组件

## 测试服务器验收

部署目标为 Ubuntu 测试服务器 `/root/carte`，Carte 继续通过 `3010` 对外访问，没有使用 80/443；Node.js runtime 为 `v24.20.0`。

- 使用 Node 24 standalone 产物启动隔离候选容器 `127.0.0.1:3011`，覆盖测试验证码的 E2E 仅在候选容器执行。
- 使用服务器 Chromium 执行 `share-i18n.spec.ts`：`1 passed (6.7s)`；验证登录、中文/英文文案、`/{locale}/i/{slug}` 链接、二维码可见性、二维码 alt 和复制/分享按钮。
- 正式 app 已切换到 `carte-app:share-i18n-20260903`：英文/中文首页均返回 HTTP 200；容器 Node.js `v24.20.0`；PostgreSQL、Redis 均为 `healthy`。
- 隔离 fixture 验收期间创建 1 条已发布邀请函，完成后删除邀请函；数据库复核 fixture 残留为 0。既有测试账号 `carte.tester@carte.test` 未删除。
- 候选容器、staging、E2E 目录、上传归档和旧 app 镜像已清理；未删除 PostgreSQL/Redis 数据卷，正式 app 未开启 `E2E_TEST_MODE`。

## 当前边界与下一步

- 登录表单内部提示、模板详情页和其他非分享管理文案仍有英文硬编码，下一阶段继续迁移。
- sitemap 双语言 URL、canonical/hreflang 和公开邀请函 SEO 结构化 metadata 待后续阶段处理。
- 分享页当前只生成二维码和系统分享入口，未接入第三方社交平台 SDK。

## 提交

- 本阶段功能和 E2E 提交：`7a33857 feat: localize invitation sharing`
