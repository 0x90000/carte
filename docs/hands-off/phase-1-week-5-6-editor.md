# Carte Hands-off: Phase 1, Week 5-6 编辑器

**状态**: 已完成本地开发、Docker 部署和测试服务器 HTTP 验收
**日期**: 2026-09-01
**依据**: `docs/tech-spec-detailed.md` 第六章、Week 5-6 验收标准，以及 `docs/feature-supplement.md` 登录态与访客草稿补充

## 本阶段交付

- Fabric.js 7 编辑画布：加载模板图层，支持文本编辑、图层拖拽、缩放、旋转和选择。
- 图层面板：选择图层、显示/隐藏、锁定/解锁；锁定图层不可编辑。
- Inspector：选中文本图层时编辑文字，选中图片图层时替换图片。
- 图片替换限制为 JPG/PNG，最大 5MB；当前无对象存储凭据，使用 Data URL 写入内容 JSON，后续可无缝替换上传实现。
- 配色方案切换：应用模板内置的文本、形状和背景颜色，并实时刷新画布。
- 撤销/重做：保存最多 50 个内容快照，撤销/重做后重新加载画布。
- 实时预览：编辑器右侧按当前内容渲染手机比例预览，可通过工具栏切换。
- 标题、内容的 localStorage 自动保存，key 为 `carte:editor:{invitationId}`，仅当本地 `updatedAt` 新于服务端内容时恢复。
- 后端 PATCH 自动保存，访客草稿和登录用户邀请函均复用 `/api/invitations/:id`。
- 顶部保存状态显示：Ready、Unsaved changes、Saving、Saved、Save failed。
- 访客提示条：`Not logged in. Your draft will be saved for 7 days.`
- `/editor/new?template={templateId}`：加载模板并通过 `POST /api/invitations` 创建访客或登录用户草稿，再跳转到编辑器。
- `/editor/[id]`：按登录用户 `userId` 或访客 `carte_session_id` 读取草稿；访客草稿过期或无权限时返回 404。
- 登录后的迁移继续保留原草稿 ID，确保 `/login?continue=/editor/{id}?action=publish` 可返回原编辑器。
- 发布按钮流程：访客跳转登录并带安全 `continue` 参数；登录用户先保存，再调用发布 Checkout API。
- 新增 `POST /api/invitations/:id/publish`：只允许邀请函所有者调用；Stripe 配置缺失时返回明确的 HTTP 503，配置完整时创建 Checkout Session。

## 本地代码验证

以下命令在本机执行，未启动 Docker：

```text
npm run lint       PASS
npx tsc --noEmit   PASS
npm run build      PASS
```

生产构建确认包含：

- `/editor/new`
- `/editor/[id]`
- `/api/invitations/[id]/publish`

## 测试服务器联调结果

部署目标为 Ubuntu 测试服务器的 `/root/carte`，应用通过 `3010` 对外访问；没有使用 80/443。已验证：

- 访客创建草稿、Cookie 读取、PATCH 更新和编辑器页面均返回 HTTP 200，页面含 7 天提示。
- `/editor/new?template=...` 返回 HTTP 200。
- 应用容器 Node.js `v24.20.0`，PostgreSQL/Redis healthy，应用端口为 `3010`。
- 未登录发布接口返回 HTTP 401；Stripe 未配置分支保留 HTTP 503 行为。

## 已知边界

- 当前没有 S3/R2 凭据，图片 Data URL 适合测试和小图片，不适合生产大规模存储；上传接口边界已保留，后续接对象存储时不改编辑器数据格式。
- Stripe Checkout 只负责创建支付会话；支付成功后的 webhook、发布状态更新、H5 页面和分享页属于 Week 8。
- Week 5-6 文档要求的流程演示视频尚未生成，需在测试服务器验收时补录。
