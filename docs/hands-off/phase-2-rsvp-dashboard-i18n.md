# Carte Hands-off: Phase 2 RSVP 管理 Dashboard 本地化

**状态**: RSVP 管理页列表、统计、状态、日期、导出入口和 metadata 已完成 `en`/`zh-CN` 本地化，并通过测试服务器验收
**日期**: 2026-09-03
**依据**: `docs/tech-spec-detailed.md` 第九章国际化与 SEO、RSVP 数据面板要求和 Phase 2 多语言支持清单

## 本阶段交付

- RSVP 管理页接入 `next-intl`：
  - 页面标题、描述、返回 Dashboard、CSV 导出、汇总卡片、空状态和表格表头支持双语。
  - `attending`、`declined`、`maybe` 状态显示本地化标签，不再直接展示数据库枚举值。
  - RSVP 提交时间使用当前 route locale 的 `Intl.DateTimeFormat`，不再固定为英文。
- 带 locale 的 RSVP 管理 URL 保持完整内部导航：
  - 未登录访问按当前语言重定向到 `/{locale}/login`。
  - 返回 Dashboard 使用 `/{locale}/dashboard`。
  - CSV 导出继续调用无 locale 的 API 路径。
- 新增受环境变量保护的 `rsvp-dashboard-i18n.spec.ts`，覆盖登录、中文/英文管理页、统计、状态、表格和 CSV 链接。

## 本地代码验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint                         PASS
npx tsc --noEmit                    PASS
npm run build                        PASS（32 个静态 locale 页面）
npx playwright test --list           PASS（10 个测试）
git diff --check                     PASS
```

生产构建确认包含：

- `/[locale]/dashboard/invitations/[id]/rsvps`
- `/dashboard/invitations/[id]/rsvps`
- `rsvpDashboard` 双语消息资源

## 测试服务器验收

部署目标为 Ubuntu 测试服务器 `/root/carte`，Carte 继续通过 `3010` 对外访问，没有使用 80/443；Node.js runtime 为 `v24.20.0`。

- 使用 Node 24 standalone 产物启动隔离候选容器 `127.0.0.1:3011`，覆盖测试验证码的 E2E 仅在候选容器执行。
- 使用服务器 Chromium 执行 `rsvp-dashboard-i18n.spec.ts`：`1 passed (5.4s)`；验证登录、中文/英文统计、状态标签、表格内容、CSV 链接和 locale 日期页面。
- 正式 app 已切换到 `carte-app:rsvp-dashboard-i18n-20260903`：英文/中文首页均返回 HTTP 200；容器 Node.js `v24.20.0`；PostgreSQL、Redis 均为 `healthy`。
- 隔离 fixture 验收期间创建 1 条邀请函和 3 条 RSVP，完成后删除邀请函（级联删除 RSVP）；数据库复核 fixture 残留为 0。既有测试账号 `carte.tester@carte.test` 未删除。
- 候选容器、staging、E2E 目录、上传归档和旧 app 镜像已清理；未删除 PostgreSQL/Redis 数据卷，正式 app 未开启 `E2E_TEST_MODE`。

## 当前边界与下一步

- 分享页、登录表单内部文案、模板详情页仍有英文硬编码，下一阶段继续迁移。
- sitemap 双语言 URL、canonical/hreflang 和更完整的 SEO locale 元数据待后续阶段处理。
- RSVP 管理页当前为服务端读取和 CSV 导出；重复提交去重、频率限制和通知邮件仍属于后续可靠性增强。

## 提交

- 本阶段功能和 E2E 提交：`24c85a1 feat: localize rsvp dashboard`、`06bfdcd test: stabilize rsvp dashboard locale assertions`
