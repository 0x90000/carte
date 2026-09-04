# Carte Hands-off: Phase 2 高级编辑器文字控件

**状态**: 已完成本地开发、代码检查、生产构建、服务器 Docker 浏览器验收和隔离数据清理
**日期**: 2026-09-04
**依据**: `docs/tech-spec-detailed.md` 第六章 Phase 2 编辑器清单

## 本阶段范围

根据产品 Owner 的最新安排，本阶段跳过 RSVP 和更多模板，先开发高级编辑器的文字控件。执行顺序更新为：

1. 高级编辑器文字控件（本阶段）
2. 照片画廊
3. 访问统计（本轮跳过）
4. RSVP 相关增强（包括通知、去重和限流）
5. 更多模板（Phase 2 最后开发）

## 本阶段交付

- 选中文字图层后可修改字体，提供稳定的系统字体选项：Inter、Arial、Georgia、Times New Roman、Trebuchet MS、Courier New。
- 选中文字图层后可修改字号，输入值限制为 8–160px，避免破坏画布布局。
- 选中文字图层后可使用颜色选择器修改文字颜色，并显示当前十六进制值。
- 控件同时支持 `en` 和 `zh-CN`，修改继续复用已有历史记录、自动保存、Fabric 画布重载和实时预览链路。
- 没有改动 RSVP API、RSVP 数据模型、模板数据或模板资源。

## Git 提交

- `c2ab6bc feat: add advanced editor text controls`
- `41c201e test: cover advanced editor text controls`

## 本地验证

以下检查在本机完成，没有启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint                         PASS
npx tsc --noEmit --incremental false PASS
npm run build                        PASS（32 个 locale 静态页面）
npx playwright test --list           PASS（16 个测试，含本阶段 1 个测试）
git diff --check                     PASS
```

E2E 场景为 `tests/e2e/advanced-editor.spec.ts`，仅在设置 `ADVANCED_EDITOR_TEST_MODE=1` 时运行，避免误写正式数据。

## 服务器验收

部署目标为 Ubuntu 测试服务器 `139.180.215.236`。正式应用继续通过 `3010` 对外访问，没有使用 80/443；候选容器绑定服务器回环 `127.0.0.1:3011`，Node.js runtime 为 `v24.20.0`。

- 使用本机已通过生产构建的 Node 24 standalone 产物启动隔离候选容器，并连接现有 PostgreSQL/Redis；没有替换正式 app 容器。
- 使用服务器官方 Chromium 容器执行 `advanced-editor.spec.ts`：

```text
Running 1 test using 1 worker
1 passed (7.7s)
```

- 验证了英文编辑器中字体选择、字号输入、颜色选择、保存后 API 内容一致性，并验证了中文编辑器对应的本地化控件标签。
- 验收后删除 2 条本阶段产生的 guest draft，停止并删除候选容器、测试归档和 E2E staging；正式 `3010` smoke 返回 HTTP 200。

本次服务器验收覆盖：

- 文字图层的字体选择、字号限制和颜色选择器均可操作。
- 保存后重新读取邀请函内容，`font.family`、`font.size` 和 `color` 与控件值一致。
- 中英文编辑器标签均正确显示。
- 验收结束后清理临时邀请函、容器、归档和 staging 数据。

## 当前边界

- 本阶段没有实现图层分组、对齐/分布、从素材库拖入元素或图片导出，这些仍需单独定义阶段。
- 字体选项使用系统字体，不引入远程字体资源；如需品牌字体，应另行确认资源和授权。
- RSVP、RSVP 通知和更多模板按更新后的顺序处理；访问统计已根据产品 Owner 决定跳过。
