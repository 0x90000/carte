# Carte Hands-off: Phase 1, Week 8+ 性能优化

**状态**: 性能代码优化和服务器部署已完成；Lighthouse 移动端 90+ 尚未稳定达标
**日期**: 2026-09-02
**依据**: `docs/tech-spec-detailed.md` 第 14.2 节和 Week 8+ 性能优化任务

## 本阶段交付

- 将公开邀请函的 RSVP 表单拆为客户端动态加载模块：
  - `components/invitation/invitation-renderer.tsx` 保留邀请函主体的服务端渲染。
  - 新增 `components/invitation/rsvp-section.tsx`，只在 RSVP 开启时加载表单。
- 移除 RSVP 表单对 `react-hook-form` 和 resolver 的客户端依赖，改为轻量受控表单：
  - 保留规范字段、客户端校验、提交状态、服务端错误显示和成功状态。
  - API payload 仍使用 canonical RSVP 字段，party size 发送为数字。
- 本地构建产物对比显示，H5 `/i/[slug]` 首屏 JS 从约 229 kB 降至约 116 kB。

## 本地代码验证

以下检查均在本机执行，未启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint       PASS
npx tsc --noEmit   PASS
npm run build      PASS
git diff --check   PASS
```

## 测试服务器部署验收

部署目标为 Ubuntu 测试服务器 `/root/carte`，应用通过 `3010` 对外访问，没有使用 80/443；运行时为 Node.js `v24.20.0`。

- 使用本机已验证的 standalone 归档构建 `carte-app:standalone-perf-rsvp-20260902`。
- 仅替换 `carte-app-1` app 容器；PostgreSQL、Redis 容器和数据卷均未删除或重建。
- app 启动日志正常，`[GuestDraftCleanup] startup` 正常执行。
- `node --version` 返回 `v24.20.0`。
- `E2E_TEST_MODE` 未注入正式 app。
- `http://127.0.0.1:3010/`、`/templates`、`/robots.txt`、`/sitemap.xml` 均返回 HTTP 200。
- PostgreSQL 和 Redis 容器继续保持 healthy。

## Lighthouse 测量结果

测量在测试服务器完成。服务器为 2 vCPU，且同时运行多个容器，移动端 Lighthouse 结果存在明显波动：

| 页面 | 实测结果 |
| --- | --- |
| 首页 | 一次测量 93 |
| 模板页 | 90 |
| H5（RSVP 关闭） | 84 / 93 / 90 |
| H5（RSVP 开启） | 82 / 92 / 83 |

本阶段不将 H5 Lighthouse 90+ 标记为稳定通过，也不虚报 Week 8+ 性能验收完成。代码层面的首屏 JS 优化已交付；后续应在低负载或性能基线一致的环境重复测量，并视结果继续优化 H5 首屏。

## 清理和边界

- 服务器上的 staging 归档和 staging 目录应在确认无需回滚后删除，以释放磁盘空间；不得删除 PostgreSQL/Redis 数据卷。
- 当前未引入图片 CDN、真实 4G 网络测试、跨浏览器移动端验收或生产域名/HTTPS；这些仍属于后续上线验收。

## 提交

- 性能代码和本文档应在本阶段合并提交，提交信息建议为 `perf: reduce RSVP client bundle`。
