# Carte Hands-off: Phase 2 Dashboard 增强

**状态**: Dashboard 统计、筛选搜索、邀请函复制与删除已完成并通过测试服务器验收
**日期**: 2026-09-02
**依据**: `docs/tech-spec-detailed.md` Phase 2 Dashboard 增强清单、`docs/feature-supplement.md` 第五章

## 本阶段交付

- Dashboard 总览统计改为基于当前用户全部数据计算：
  - 总邀请函数量
  - 已发布邀请函数量
  - RSVP 总响应数
  - 已发布邀请函累计浏览量
- 新增服务端状态筛选和标题搜索：
  - `status=all|published|draft`
  - `q` 标题模糊搜索，最多处理 100 个字符
  - 筛选列表为空时显示明确的空结果状态和清除入口
- 新增 `POST /api/invitations/:id/duplicate`：
  - 仅允许当前用户复制自己的邀请函
  - 保留场景、模板、内容、活动信息和设置
  - 生成新 slug，副本固定为 `draft`，标题追加 `(copy)`
- Dashboard 邀请函卡片新增复制和删除操作：
  - 复制成功后刷新列表
  - 删除使用确认对话框，明确 RSVP 数据会一并删除
  - 删除继续复用已有的用户授权和缓存失效 API

## 本地代码验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint                         PASS
npx tsc --noEmit --incremental false PASS
npm run build                        PASS
npx playwright test --list           PASS（7 个测试）
git diff --check                     PASS
```

## 测试服务器验收

部署目标为 Ubuntu 测试服务器 `/root/carte`，Carte 通过 `3010` 对外访问，没有使用 80/443；Node.js runtime 为 `v24.20.0`。

- 部署 Node 24 standalone 产物 `carte-app:standalone-dashboard-20260902`，构建路由清单包含 `/api/invitations/[id]/duplicate`。
- 使用服务器 Chromium E2E 和隔离用户/邀请函验收通过：统计显示 1 个邀请函、1 个已发布、2 条 RSVP、12 次浏览；`status=published` 与标题搜索生效；复制副本后显示为 `(copy)` 草稿，确认删除后副本消失（1 passed）。
- 正式 app 已切换到新镜像并通过 `3010` 返回 HTTP 200；Node.js `v24.20.0`，PostgreSQL/Redis healthy，5 个 Prisma migration 已应用，`E2E_TEST_MODE=0`。
- 验收后已删除隔离用户、邀请函、2 条 RSVP、复制产生的草稿、Redis 认证 key、Playwright 容器和 staging。

## 当前边界

- 搜索当前针对邀请函标题，不包含场景、slug 或正文内容。
- 复制操作创建草稿，不复制支付记录、RSVP、邮件发送记录或浏览量。
- Dashboard 统计为请求时聚合，尚未引入独立统计表或时间序列分析。

## 提交

- 本阶段代码和文档提交信息：`feat: enhance dashboard invitation management`
