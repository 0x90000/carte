# Carte Hands-off: Phase 1, Week 8+ SEO 基础

**状态**: 已完成本地实现、服务器 HTTP/浏览器验收和临时资源清理
**日期**: 2026-09-02
**依据**: `docs/tech-spec-detailed.md` 第九章、第 14.6 节和 Week 8+ SEO 基础任务

## 本阶段交付

- 新增 `app/sitemap.ts`：
  - 运行时从数据库读取 active 模板和已发布邀请函。
  - 收录当前实际公开路由 `/`、`/create`、`/templates`、模板详情和 `/i/:slug`。
  - 不收录 Dashboard、编辑器、登录页或 API。
  - 使用 `NEXT_PUBLIC_APP_URL` 生成绝对 URL，默认回退到本地开发地址。
  - `force-dynamic` 避免构建阶段依赖数据库。
- 新增 `app/robots.ts`：允许公开页面，禁止 `/api/`、`/dashboard`、`/editor`、`/login`，并指向同一 base URL 下的 sitemap。
- 根布局补充首页 Open Graph 元数据（type、title、description、siteName、url）；既有页面级 metadata 和公开邀请函 OG metadata 保持有效。
- 新增 `tests/e2e/seo.spec.ts`，覆盖 sitemap/robots 响应内容以及首页 title、description、Open Graph 标签。

## 本地代码验证

以下检查均在本机执行，未启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint       PASS
npx tsc --noEmit   PASS
npm run build      PASS
```

构建路由清单确认：`/robots.txt` 为静态 metadata route，`/sitemap.xml` 为动态 metadata route。

## 测试服务器验收

部署目标为 Ubuntu 测试服务器，应用端口固定为 `3010`，未使用 80/443；运行时为 Node.js `v24.20.0`。

- 新 standalone 镜像部署后首页返回 HTTP 200。
- `/sitemap.xml` 返回 HTTP 200，包含公开模板路径，不包含 `/dashboard` 或 `/editor`。
- `/robots.txt` 返回 HTTP 200，包含 API、Dashboard、编辑器和登录页禁止规则，并包含 Sitemap 地址。
- 使用 Playwright 官方 `mcr.microsoft.com/playwright:v1.62.1-noble` 镜像在服务器执行 `seo.spec.ts`：

```text
Running 2 tests using 1 worker
2 passed (3.5s)
```

- 验收后已删除临时测试目录、上传归档和构建 staging；正式 app、PostgreSQL、Redis 均保持运行/healthy。

## 当前边界

- 当前代码库尚未实现完整 next-intl 页面树，因此 sitemap 只收录当前真实存在的非本地化公开路由；已存在的 `/[locale]/i/[slug]` 仍由页面级 metadata 支持。新增本地化公开页面后需同步扩展 sitemap。
- Lighthouse 性能分数、移动端兼容性、真实域名/HTTPS、生产备份和错误监控仍属于后续 Week 8+ 阶段。

## 提交

- `540a96d feat: add SEO sitemap and robots metadata`
- 本文档提交见后续 docs commit。
