# Carte Hands-off: Phase 2 SEO 国际化

**状态**: 双语言公开 URL、SEO metadata 和 sitemap 已完成本地实现、服务器候选验收和正式部署
**日期**: 2026-09-03
**依据**: `docs/tech-spec-detailed.md` 第九章国际化与 SEO、第 14.6 节，以及 Phase 2 多语言支持清单

## 本阶段交付

- sitemap 扩展为 `en` 和 `zh-CN` 两套公开 URL：
  - 首页、创建页、模板列表页。
  - active 模板详情页。
  - 已发布邀请函详情页。
  - Dashboard、编辑器、登录页和 API 不进入 sitemap。
- 首页和模板列表页增加 locale-aware metadata：
  - canonical 指向当前 locale URL。
  - `en`/`zh-CN` alternate hreflang 指向对应页面。
  - 标题、描述和 Open Graph 文案使用当前 locale 翻译。
- 双语言公开邀请函页面增加 canonical、alternate hreflang 和当前 locale 描述；公开邀请函 Open Graph 图片继续使用模板预览图。
- 修正 Next.js 根布局 `title.template` 与已含 `| Carte` 的翻译标题重复追加问题：已确定品牌后缀的页面使用 `title.absolute`，邀请函名称等动态标题继续按模板规则生成。
- `tests/e2e/seo.spec.ts` 保持覆盖 sitemap/robots 和英文、中文首页 metadata。

## 本地代码验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis、本地应用服务器或真实浏览器：

```text
npm run lint                      PASS
npx tsc --noEmit                  PASS
npm run build                     PASS（32 个 locale 静态页面）
npx playwright test --list        PASS（11 个测试）
git diff --check                  PASS
```

## 测试服务器验收

部署目标为 Ubuntu 测试服务器，Carte 继续通过 `3010` 对外访问，没有使用 80/443；正式运行时为 Node.js `v24.20.0`。

- 使用 Node 24 standalone 产物构建隔离镜像 `carte-app:seo-i18n-20260903`。
- 候选容器绑定 `127.0.0.1:3011`，在服务器 Chromium（`mcr.microsoft.com/playwright:v1.62.1-noble`）执行 SEO E2E：

```text
Running 2 tests using 1 worker
2 passed (5.1s)
```

- 正式容器已切换至 `carte-app:seo-i18n-20260903`，`3010` 首页和 sitemap 返回 HTTP 200。
- 正式 `3010` 再次执行服务器 Chromium SEO E2E：

```text
Running 2 tests using 1 worker
2 passed (3.7s)
```

- PostgreSQL、Redis 容器保持运行且为 `healthy`；未修改或删除数据卷。
- 候选容器、`.seo-context`、`.seo-staging`、`.seo-e2e`、上传归档和旧 `carte-app:share-i18n-20260903` 镜像已清理。

## 当前边界与下一步

- sitemap 只收录当前实际存在的公开路由；定价、关于页和按场景的 SEO 页面尚未实现，因此不虚构 URL。
- 模板详情页当前复用既有详情页面 metadata；模板详情的独立 locale 文案和 canonical/hreflang 可在模板 SEO 子阶段继续补充。
- 当前没有真实域名/HTTPS、Search Console、结构化 JSON-LD、Lighthouse 基线和生产监控配置；这些属于后续部署与增长阶段。

## 提交

- 代码提交：`feat: add localized seo metadata`
- 本文档提交：见后续 docs commit。
