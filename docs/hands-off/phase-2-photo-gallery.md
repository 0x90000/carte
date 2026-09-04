# Carte Hands-off: Phase 2 照片画廊

**状态**: 已完成本地开发、代码检查、生产构建、服务器 Docker 浏览器验收和隔离数据清理
**日期**: 2026-09-04
**依据**: `docs/tech-spec-detailed.md` 第六章 Phase 2 编辑器清单及产品 Owner 的阶段安排

## 本阶段范围

高级编辑器文字控件完成后，本阶段实现邀请函照片画廊。当前阶段不开发 RSVP 增强、通知或更多模板，顺序保持为：

1. ~~高级编辑器文字控件~~
2. 照片画廊（本阶段）
3. 访问统计（本轮跳过）
4. RSVP 相关增强（包括通知、去重和限流）
5. 更多模板（Phase 2 最后开发）

## 产品决策

- 编辑器支持批量选择 JPG/PNG 图片，最多 9 张。
- 每张原文件不得超过 1 MB；类型和大小在浏览器端校验。
- 现阶段使用 Data URL 写入邀请函 `content.gallery`，暂不引入对象存储。
- H5 采用响应式网格：默认两列，`sm` 断点及以上三列。
- 上传文件名（去除扩展名、最多 120 个字符）作为默认 alt 文本，便于无障碍访问。
- 后续替换为 S3/R2 时保持 `content.gallery` 的 `id`、`url`、`alt` 数据契约，迁移上传和读取实现，不改变编辑器与渲染器使用方式。

## 本阶段交付

- `EditorGalleryItem` 和 `content.gallery` 统一数据结构；规范化时仅接受有 `id` 和非空 `url` 的项目，最多保留 9 项。
- 编辑器增加画廊区域、数量计数、批量添加、删除、文件类型/大小/数量错误提示和 Data URL 自动保存。
- 编辑器实时预览显示已选图片网格。
- 公开邀请函渲染器显示画廊标题、图片网格和 alt 文本；中英文文案均已补齐到 `editor` 与 `invitation` 命名空间。
- 未改动 RSVP API、支付流程和模板资源等非本阶段范围。

## Git 提交

- `65bdbe9 feat: add data url photo gallery`
- `a78d129 test: cover photo gallery workflow`
- `d5d019c test: scope gallery editor assertions`
- `0526a98 fix: localize published gallery labels`
- `008f73a test: assert published gallery alt text`

## 本地验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint                         PASS
npx tsc --noEmit --incremental false PASS
npm run build                        PASS（32 个 locale 静态页面）
npx playwright test --list           PASS（18 个测试）
git diff --check                     PASS
```

E2E 场景为 `tests/e2e/photo-gallery.spec.ts`，仅在设置 `PHOTO_GALLERY_TEST_MODE=1` 时运行编辑器流程；公开页流程需要显式设置 `PHOTO_GALLERY_INVITATION_SLUG`。

## 服务器验收

部署目标为 Ubuntu 测试服务器 `139.180.215.236`。正式应用继续通过 `3010` 对外访问，没有使用 80/443；候选容器绑定服务器回环 `127.0.0.1:3011`，Node.js runtime 为 24.x。

- 使用本地生产构建的 Node 24 standalone 产物启动隔离候选容器，连接现有 PostgreSQL/Redis；没有替换正式 app 容器。
- 服务器 Chromium 容器执行照片画廊 E2E：

```text
Running 2 tests using 1 worker
2 passed (5.8s)
```

- 编辑器场景验证批量添加两张 PNG、删除第一张、保存后 API 返回一张 Data URL 图片且 alt 为 `second`。
- 发布页场景验证英文 `Photo gallery` 标题、两张图片均可见、网格中两张图片的 alt 分别为 `First test photo` 和 `Second test photo`。
- 验收后删除 5 条本阶段产生的 Data URL guest draft、1 条发布 fixture，删除候选容器和画廊归档；正式 `3010` smoke 返回 HTTP 200，`3011` 无监听。

## 当前边界与后续工作

- Data URL 会直接增大 JSON payload，当前 1 MB/张和最多 9 张是临时边界；生产对象存储接入前不应将此方案视为长期媒体存储。
- 当前未实现图片压缩、裁剪、排序、拖拽重排、灯箱查看或对象存储生命周期管理。
- 访问统计已由产品 Owner 决定跳过；下一阶段直接开发 RSVP 增强与通知，更多模板仍按路线图最后开发。
