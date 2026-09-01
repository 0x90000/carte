# Carte Hands-off: Phase 1, Week 7 AI 集成

**状态**: 本地开发完成，待部署到测试服务器进行 HTTP 验收
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

## 测试服务器验收待办

部署目标为 Ubuntu 测试服务器 `/root/carte`，应用继续通过 `3010` 对外访问，不使用 80/443。服务器若没有 `OPENAI_API_KEY`，应重点验收 fallback：

- 合法请求稳定返回 3 条 variations，`source=fallback`。
- 非法请求返回 HTTP 400。
- wedding、birthday、business 场景均能得到非空预设文案。
- 推荐接口按 `scene`、`style` 和描述关键词返回排序后的模板 ID 与 reasons。
- 已登录调用（配置测试账号后）产生 `AIGeneration` 记录；没有密钥时记录 `model=fallback`、`tokensUsed=null`。
- 应用容器仍使用 Node.js 24，PostgreSQL/Redis healthy，端口仍为 `3010`。

## 已知边界

- 当前 OpenAI API 是可选依赖路径；没有密钥时不会外呼，fallback 文案保证编辑器可用。
- 本阶段只生成文案和推荐模板，不包含 Week 8 的 H5、RSVP、支付 webhook 或发布状态更新。
- 由于测试环境没有真实 OpenAI key，本阶段远程验收应以 fallback 为主；真实模型 token 统计需在配置 key 后再验证。
