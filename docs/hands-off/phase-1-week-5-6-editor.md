# Carte Hands-off: Phase 1, Week 5-6 编辑器

**状态**: 本地开发完成，待部署到测试服务器进行 Docker/HTTP 联调
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

## 测试服务器联调待办

部署目标仍为 Ubuntu 测试服务器的 `/root/carte`，应用通过 `3010` 对外访问；不使用 80/443。本阶段部署后需要验证：

- 访客选择模板、创建草稿、刷新页面后内容仍存在。
- 文本编辑、图层开关、锁定、配色切换、撤销/重做和图片大小校验。
- 访客点击发布后到登录页，登录并迁移后仍返回同一个编辑器 ID。
- 登录用户发布接口在未配置 Stripe 时返回 503 且页面显示可理解的错误。
- 应用容器、PostgreSQL、Redis 在 Node.js 24 环境正常启动。

## 已知边界

- 当前没有 S3/R2 凭据，图片 Data URL 适合测试和小图片，不适合生产大规模存储；上传接口边界已保留，后续接对象存储时不改编辑器数据格式。
- Stripe Checkout 只负责创建支付会话；支付成功后的 webhook、发布状态更新、H5 页面和分享页属于 Week 8。
- Week 5-6 文档要求的流程演示视频尚未生成，需在测试服务器验收时补录。
