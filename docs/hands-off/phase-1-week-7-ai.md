# Carte Hands-off: Phase 1, Week 7 AI 集成

**状态**: 已完成本地开发、Docker 部署和测试服务器 HTTP 验收（fallback 路径）
**日期**: 2026-09-01
**依据**: `docs/tech-spec-detailed.md` 第 5.2.5、8.1-8.3 和 Week 7 验收标准

## 本阶段交付

- 新增 `POST /api/ai/generate-copy`：接收 `scene`、`style`、`locale` 和 `eventInfo`，返回 3 条文案变体。
- OpenAI 使用 `gpt-4o-mini`（可通过 `OPENAI_MODEL` 覆盖），单次最多 500 tokens，10 秒超时，满足 MVP 成本约束。
- `OPENAI_API_KEY` 未配置、调用超时、调用失败或返回不足 3 条时，自动返回对应场景的 3 条预设文案，不中断编辑流程。
- 预设文案覆盖 wedding、birthday、business、baby、other，支持 `en` 和 `zh-CN`；`{date}` 占位符会替换为活动日期。
- 登录用户成功请求后记录 `AIGeneration`：保存 prompt、响应、来源、模型和 `tokensUsed`；访客不写入需要 `userId` 的历史表。
- 新增 `POST /api/ai/recommend-templates`：按场景、风格和描述中的中英文关键词对模板标签排序，返回最多 3 个模板 ID 与推荐理由。
- 编辑器 Inspector 新增 AI copy 面板：选中文本图层后可生成 3 个选项，并一键应用到当前图层，沿用编辑器自动保存和撤销/重做。
- `.env.example` 增加可选的 `OPENAI_API_KEY` 与 `OPENAI_MODEL` 配置说明。

## Review 修复

根据 `docs/week7-review-report.md`，review 使用的请求体将 `eventInfo.names` 作为字符串传入：`"Alex & Jordan"`。此前接口只接受字符串数组，导致请求返回 HTTP 400。

已在 `POST /api/ai/generate-copy` 增加输入归一化：

- `names: "Alex & Jordan"`、`names: "Alex 和 Jordan"`、中英文逗号分隔字符串均可用。
- 原有 `names: ["Alex", "Jordan"]` 数组格式继续兼容。
- 归一化后统一传入生成服务，最多保留 10 个姓名。

## 本地代码验证

以下命令在本机执行，未启动 Docker：

```text
npm run lint       PASS
npx tsc --noEmit   PASS
npm run build      PASS
```

生产构建确认包含：

- `/api/ai/generate-copy`
- `/api/ai/recommend-templates`
- 更新后的 `/editor/[id]`

Review 修复后的生产构建同样通过。

## 测试服务器验收结果

部署目标为 Ubuntu 测试服务器 `/root/carte`，应用继续通过 `3010` 对外访问，没有使用 80/443。服务器未配置 `OPENAI_API_KEY`，已完成 fallback 验收：

- wedding 合法请求返回 3 条非空 variations，`source=fallback`，`model=null`、`tokensUsed=null`。
- 非法生成请求返回 HTTP 400。
- `wedding + minimal elegant` 推荐命中 Modern vows，返回模板 ID 与理由。
- 非法推荐场景返回 HTTP 400。
- 应用容器 Node.js `v24.20.0`，PostgreSQL/Redis healthy，端口仍为 `3010`。

Review 原始请求体已在服务器复验：

```text
POST /api/ai/generate-copy
eventInfo.names = "Alex & Jordan"
HTTP 200
data.variations.length = 3
data.source = "fallback"
```

数组格式 `names: ["Alex", "Jordan"]` 也返回 HTTP 200。

## 已知边界

- 当前 OpenAI API 是可选依赖路径；没有密钥时不会外呼，fallback 文案保证编辑器可用。
- 本阶段只生成文案和推荐模板，不包含 Week 8 的 H5、RSVP、支付 webhook 或发布状态更新。
- 由于测试环境没有真实 OpenAI key，本阶段远程验收以 fallback 为主；真实模型 token 统计需在配置 key 后再验证。
