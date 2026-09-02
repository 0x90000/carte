# Carte Hands-off: Phase 2 公开邀请函与 RSVP 本地化

**状态**: 公开邀请函 H5、RSVP 表单和公开邀请函 metadata 已完成 `en`/`zh-CN` 本地化，并通过测试服务器验收
**日期**: 2026-09-03
**依据**: `docs/tech-spec-detailed.md` 第九章国际化与 SEO、Phase 2 多语言支持清单，以及 Week 8 H5/RSVP 验收标准

## 本阶段交付

- 公开邀请函渲染器接入当前 route locale：
  - “You are invited”、Carte 标识和视频背景无障碍标签支持 `en`/`zh-CN`。
  - 活动日期使用当前 route locale 的长日期格式，不再固定使用邀请函存储 locale。
  - RSVP 开关逻辑保持由邀请函 settings 或内容 settings 控制。
- H5 RSVP 表单全部迁移到 `next-intl`：
  - 字段、出席状态、提交按钮、提交中/成功状态和校验错误均支持双语。
  - 提交失败统一显示当前语言的本地化错误，公开 API 路径保持 `/api/rsvp`。
- 本地化公开邀请函页面 metadata：
  - 邀请函描述、404 标题和 Open Graph 描述支持当前语言。
  - 带 locale 的公开 URL 使用 `/{locale}/i/{slug}` 作为 Open Graph URL。

## 本地代码验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint                         PASS
npx tsc --noEmit                    PASS
npm run build                        PASS（32 个静态 locale 页面）
npx playwright test --list           PASS（9 个测试）
git diff --check                     PASS
```

生产构建确认包含：

- `/[locale]/i/[slug]` 与 `/i/[slug]`
- `/api/rsvp`
- RSVP 客户端组件及双语消息资源

## 测试服务器验收

部署目标为 Ubuntu 测试服务器 `/root/carte`，Carte 继续通过 `3010` 对外访问，没有使用 80/443；Node.js runtime 为 `v24.20.0`。

部署使用本机已通过构建的 Node 24 standalone 产物，候选容器仅绑定服务器回环 `127.0.0.1:3011`；正式 app 继续通过 `3010` 对外访问，没有使用 80/443。验收结果：

- 候选和正式 `3010` app 的 `/en/i/[slug]`、`/zh-CN/i/[slug]` 均返回 HTTP 200；非法 slug 返回 HTTP 404。
- SSR HTML 包含当前语言的邀请函标识、活动日期、描述和 Open Graph metadata；英文日期为 `December 24, 2026`，中文日期为 `2026年12月24日`。
- 使用服务器 Chromium 执行 `invitation-i18n.spec.ts`：候选 `3011` 与正式 `3010` 各 `1 passed`，覆盖英文/中文文案、表单校验、成功提交和 metadata。
- RSVP fixture 验收期间写入 4 条记录，完成后删除邀请函、RSVP 和测试用户，数据库复核为 0 条残留。
- 正式 app 镜像为 `carte-app:public-rsvp-i18n-20260903`，容器 Node.js `v24.20.0`；PostgreSQL、Redis 均为 `healthy`，正式 app 未开启 `E2E_TEST_MODE`。
- 候选容器、staging 目录、测试归档和旧 app 镜像已清理；未删除 PostgreSQL/Redis 数据卷，也未改变 80/443。

## 当前边界与下一步

- RSVP 管理 Dashboard 页面、分享页和登录表单内部文案仍有独立本地化工作。
- sitemap 双语言 URL、canonical/hreflang 和更完整的邀请函内容 locale 覆盖待后续子阶段处理。
- RSVP API 仍未增加重复提交去重、频率限制或通知邮件；这些属于后续可靠性增强。

## 提交

- 本阶段代码提交：`63844d5 feat: localize public invitation and rsvp`
- 本阶段 E2E 提交：`6d00e2b test: cover localized invitation rsvp`、`21ff58e test: stabilize invitation locale assertions`
