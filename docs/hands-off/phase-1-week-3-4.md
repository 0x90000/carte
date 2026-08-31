# Carte Hands-off: Phase 1, Week 3-4 模板系统

**状态**: 已完成 Week 3-4 模板系统核心交付，已部署到测试服务器并通过远程验收
**日期**: 2026-09-01
**依据**: `docs/tech-spec-detailed.md` 2.1/2.2、5.2.2、Week 3-4 验收标准

## 本阶段交付

- 定义模板 JSON Schema：`prisma/templates/template.schema.json`。
- 提供 3 个 demo 模板 JSON：
  - `wedding-modern.json`：现代婚礼，图片背景，3 个配色方案。
  - `birthday-playful.json`：生日派对，HTML/CSS 粒子背景，3 个配色方案。
  - `business-tech.json`：商务会议，循环视频背景，2 个配色方案。
- 每套模板包含 750x1334 画布、图层、变量、配色方案、RSVP 设置和背景类型定义。
- 提供本地可运行的 SVG 缩略图、高清预览图和背景/poster 素材，路径位于 `public/templates/`。
- 新增幂等导入脚本 `scripts/import-templates.mjs`，命令为 `npm run db:seed:templates`，按模板 UUID 执行 `upsert`。
- 新增公开模板接口：
  - `GET /api/templates?scene=&style=&tags=&page=&limit=`：返回分页元数据和模板展示字段。
  - `GET /api/templates/:id`：返回完整模板结构，非法 UUID 返回 400，不存在返回 404。
- 重做 `/templates`：SSR 模板缩略图网格，支持场景/风格筛选和无结果状态。
- 新增 `/templates/[id]`：SSR 大图预览、模板元数据、图层/变量/配色统计和下一步编辑器入口。
- 新增 shadcn 风格 `Select` 基础组件，供场景/风格筛选使用。
- Prisma Client 增加 `native` 与 `linux-musl-openssl-3.0.x` binary targets，保证本机 standalone 产物可在 Node 24 Alpine 运行。
- 根布局补充 `metadataBase`，模板详情页 Open Graph 图片可按部署域名解析。

## 本地代码验证

以下检查在本机执行，未启动 Docker：

```text
模板 JSON 解析            PASS
npm run lint              PASS
npx tsc --noEmit          PASS
npm run build             PASS
```

生产构建包含 `/api/templates`、`/api/templates/[id]`、`/templates` 和 `/templates/[id]` 动态路由。

## 测试服务器验证

服务器：Ubuntu 22.04，Carte 工作目录 `/root/carte`，应用地址 `http://139.180.215.236:3010`。

- PostgreSQL 已导入 3 个模板（wedding、birthday、business）。
- `GET /api/templates`：HTTP 200，返回 3 条数据，`meta.total=3`。
- `GET /api/templates?scene=wedding`：HTTP 200，返回 1 条且 scene 正确。
- `GET /api/templates?style=playful`：HTTP 200，返回 1 条。
- `GET /api/templates?tags=video`：HTTP 200，返回 1 条。
- `GET /api/templates?page=2&limit=2`：分页返回 1 条。
- `GET /api/templates?limit=0`：HTTP 400。
- `GET /api/templates/:id`：HTTP 200，包含完整 `structure.layers`。
- `GET /api/templates/not-a-uuid`：HTTP 400。
- `/templates?scene=wedding` 和 `/templates/:id`：HTTP 200，页面内容包含模板名称与预览信息。
- 3 套模板缩略图和预览 SVG：HTTP 200，Content-Type 为 `image/svg+xml`。
- 应用容器、PostgreSQL、Redis 均保持运行；Carte 继续使用 `3010`，没有改动 80/443。

## 素材与后续工作

- 当前没有提供 S3/R2 对象存储凭据，因此本阶段使用仓库内 SVG 素材保证演示和 SSR 可验证；模板结构保留独立 `thumbnailUrl`/`previewUrl`/背景 URL，后续迁移到对象存储不需要改数据库模型。
- 商务模板的视频背景使用公开 demo MP4 URL，正式环境应替换为对象存储中的 10 秒循环视频，并通过 CDN 提供。
- “Use this template” 已指向 `/editor/new?template=...`，编辑器将在 Week 5-6 实现。
