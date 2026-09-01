# Carte Hands-off: Phase 1, Week 8+ 过期草稿清理

**状态**: 已完成代码实现、服务器部署和定时执行验收
**日期**: 2026-09-02
**依据**: `docs/tech-spec-detailed.md` Week 8+ 定时任务要求、`docs/feature-supplement.md` 2.1

## 本阶段交付

- 新增 `lib/guest-draft-cleanup.ts`：使用 Prisma `deleteMany` 删除 `expiresAt < now` 的过期 `guest_drafts`。
- 新增 `instrumentation.ts`：Node.js 运行时在生产环境启动清理任务；进程启动时先执行一次，之后按 cron 表达式执行。
- 使用 `node-cron`，默认表达式为 `0 * * * *`（每小时整点），并设置 `noOverlap` 避免同一进程内任务重叠。
- 新增 CLI 脚本 `scripts/cleanup-guest-drafts.mjs` 和命令 `npm run db:cleanup:guest-drafts`，用于手工或外部运维执行一次清理。
- 新增配置：
  - `GUEST_DRAFT_CLEANUP_ENABLED`：非生产环境默认关闭，生产环境默认开启。
  - `GUEST_DRAFT_CLEANUP_SCHEDULE`：可覆盖默认每小时表达式。

清理失败只记录错误，不阻止 Web 应用继续提供服务；任务可在下一次调度时重试。

## 本地代码验证

以下命令均在本机执行，未启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint       PASS
npx tsc --noEmit   PASS
npm run build      PASS
```

生产构建成功包含 instrumentation，且 Next.js 路由构建无错误。

## 测试服务器验收

部署目标为 Ubuntu 测试服务器，Carte 通过 `3010` 对外访问，运行时为 Node.js `v24.20.0`。本阶段未修改 PostgreSQL/Redis 数据卷。

- 在数据库插入一条已过期 `guest_draft` 后重启 app，启动日志显示 `startup: removed 1 expired drafts`，数据库查询确认记录已删除。
- 临时启动同一 Node 24 镜像并将表达式覆盖为每秒执行，日志连续出现 `scheduled: removed 0 expired drafts`，确认调度器实际运行。
- 正式 app、PostgreSQL、Redis 均保持 running/healthy；首页返回 HTTP 200。
- 验收后已删除临时过期草稿、临时调度容器、上传归档和 runtime 目录。

## 提交

- `e17f43d feat: schedule expired guest draft cleanup`

## 后续阶段

Week 8+ 尚未完成的工作包括关键流程 Playwright E2E、sitemap/robots SEO、性能指标和正式生产部署验收。本阶段不引入这些功能，下一阶段从 E2E 测试基础设施开始。

