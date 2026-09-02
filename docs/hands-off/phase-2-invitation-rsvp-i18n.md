# Carte Hands-off: Phase 2 公开邀请函与 RSVP 本地化

**状态**: 公开邀请函 H5、RSVP 表单和公开邀请函 metadata 已完成 `en`/`zh-CN` 本地化，服务器验收待部署后补充
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
npx playwright test --list           PASS（8 个测试）
git diff --check                     PASS
```

生产构建确认包含：

- `/[locale]/i/[slug]` 与 `/i/[slug]`
- `/api/rsvp`
- RSVP 客户端组件及双语消息资源

## 测试服务器验收

部署目标为 Ubuntu 测试服务器 `/root/carte`，Carte 继续通过 `3010` 对外访问，没有使用 80/443；Node.js runtime 为 `v24.20.0`。

服务器 Docker、HTTP 和 Chromium 验收结果将在本阶段部署完成后补充。验收应覆盖：

- `/en/i/[slug]` 与 `/zh-CN/i/[slug]` 的 SSR 内容、标题和日期格式。
- RSVP 表单英文/中文文案、校验错误、成功提交及数据库写入。
- PostgreSQL、Redis healthy，正式 app 未开启 `E2E_TEST_MODE`。
- 临时容器、测试数据和 staging 归档清理，不改变 80/443 或数据库/Redis 数据卷。

## 当前边界与下一步

- RSVP 管理 Dashboard 页面、分享页和登录表单内部文案仍有独立本地化工作。
- sitemap 双语言 URL、canonical/hreflang 和更完整的邀请函内容 locale 覆盖待后续子阶段处理。
- RSVP API 仍未增加重复提交去重、频率限制或通知邮件；这些属于后续可靠性增强。

## 提交

- 本阶段代码和文档提交信息将在服务器验收完成后更新。
