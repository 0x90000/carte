# Carte Week 8 开发进度 Review 报告

**Review 日期**: 2026-08-30  
**部署地址**: http://139.180.215.236:3010  
**测试账号**: carte.tester@carte.test (验证码: 197032)  
**目标进度**: Week 8 (H5 渲染 + RSVP + 支付集成)  
**Review 依据**: `tech-spec-detailed.md` Week 8 任务清单

---

## 一、总体评估

### 完成度概览

| 阶段 | 计划任务 | 完成状态 | 完成度 |
|------|---------|---------|--------|
| Week 1-2 | 基础搭建 + 场景选择 | ✅ 部分完成 | 80% |
| Week 3-4 | 模板系统 | ✅ 完成 | 100% |
| Week 5-6 | 编辑器(简化版) | ❌ 未完成 | 0% |
| Week 7 | AI 集成 | ❌ 未完成 | 0% |
| Week 8 | H5 渲染 + RSVP + 支付 | ❌ 未完成 | 0% |
| **总体完成度** | | | **约 45%** |

### 核心发现

**⚠️ 严重问题: Week 8 任务完全未开始**

Week 8 的三大核心功能全部缺失:
1. ❌ H5 邀请函渲染页面(/i/[slug])
2. ❌ RSVP 系统
3. ❌ Stripe 支付集成

**根本原因**:
- Week 5-6 的编辑器未实现,导致后续流程无法进行
- 没有编辑器 → 无法生成邀请函内容 → 无法渲染 H5 → 无法测试支付
- **Week 8 依赖 Week 5-6 的完成**

---

## 二、Week 8 验收(H5 渲染 + RSVP + 支付)

### ❌ 核心功能 1: H5 邀请函渲染

**测试结果**:
```bash
GET /i/test-slug
# 返回: 404 Not Found
```

**问题分析**:
1. `/i/[slug]` 路由不存在
2. H5 渲染引擎未实现
3. 无法测试邀请函展示页面

**影响**:
- 用户无法分享邀请函链接
- 受邀者无法查看邀请函
- RSVP 表单无处渲染
- **这是产品的最终交付物,完全缺失**

### 📋 H5 渲染所有验收标准均未通过

由于页面不存在,以下功能全部无法验证:

**页面功能**:
- [ ] SSR 渲染邀请函内容
- [ ] 根据 invitation.content JSON 渲染元素
- [ ] 支持图片/HTML/视频背景
- [ ] 响应式布局(移动端优先)
- [ ] 页面加载速度 < 2 秒
- [ ] SEO meta 标签(title/description/og:image)

**数据处理**:
- [ ] 从数据库读取 invitation 数据
- [ ] Redis 缓存(5 分钟 TTL)
- [ ] slug 唯一性验证
- [ ] 404 页面(slug 不存在时)

**RSVP 表单嵌入**:
- [ ] 表单显示在页面底部
- [ ] 字段:name/email/status/guestCount/dietary
- [ ] 提交后调用 POST /api/rsvp
- [ ] 成功提示:"Thank you for your RSVP!"

**紧急程度**: 🔴 **极高** - 这是 MVP 的核心交付物

---

### ❌ 核心功能 2: RSVP 系统

**测试结果 1: API 端点存在但功能不完整**:
```bash
POST /api/rsvp
Body: {
  "invitationId": "test-id",
  "name": "Test User",
  "email": "test@test.com",
  "status": "attending",
  "guestCount": 2
}

# 返回: 
{
  "success": false,
  "error": {
    "code": "INVALID_RSVP",
    "message": "Invalid input: expected string, received undefined"
  }
}
```

**问题分析**:
1. API 端点存在(未 404)
2. 参数验证失败,可能原因:
   - Zod schema 验证逻辑有问题
   - 缺少必需参数
   - 参数类型不匹配
3. 后端逻辑部分实现,但未完成

**测试结果 2: 数据检索问题**:
```bash
# 创建访客草稿
POST /api/invitations
# 返回: 成功,ID = 4a32db44-c067-4760-892b-99e5b5f51685

# 尝试检索刚创建的邀请函
GET /api/invitations/4a32db44-c067-4760-892b-99e5b5f51685
# 返回: {"error":"Invitation not found."}

# 通过 session ID 检索
GET /api/invitations?sessionId=5d193a41-a039-4333-9a28-4d3de7339ff7
# 返回: {"success":true,"data":[],"isGuest":true}
```

**严重问题**: 
- 创建的草稿无法检索到
- 可能存储到了错误的表或未正确返回
- 这会导致用户刷新页面后数据丢失

### 📋 RSVP 所有验收标准均未通过

**API 功能**:
- [ ] POST /api/rsvp 正确处理请求
- [ ] 数据存储到 rsvps 表
- [ ] 参数验证(Zod schema)
- [ ] 返回成功响应
- [ ] 错误处理(邀请函不存在/重复提交)

**数据库**:
- [ ] rsvps 表已创建
- [ ] 字段完整(id/invitationId/name/email/status/guestCount/dietary/createdAt)
- [ ] 外键关联到 invitations 表

**Dashboard 集成**:
- [ ] 已登录用户可查看 RSVP 列表
- [ ] 显示统计(attending/declined/maybe)
- [ ] 导出为 CSV

**紧急程度**: 🔴 **极高** - RSVP 是邀请函的核心功能

---

### ❌ 核心功能 3: Stripe 支付集成

**测试结果 1: 创建 Checkout Session**:
```bash
POST /api/payment/create-checkout
Body: {"invitationId": "test-id"}

# 返回: {"error":"Unauthorized"}
```

**问题分析**:
1. API 端点存在(未 404)
2. 需要登录(符合预期)
3. 但无法测试完整流程,因为:
   - 没有编辑器创建邀请函
   - 无法通过登录获取真实 invitation ID

**测试结果 2: 发布端点**:
```bash
POST /api/invitations/test-id/publish

# 返回: 
{
  "error": "Please sign in before publishing."
}
```

**问题分析**:
1. 发布端点存在 ✅
2. 登录拦截正确 ✅
3. 但无法测试完整流程(同上)

### 📋 支付集成所有验收标准均未通过

由于无法登录测试,以下功能无法验证:

**Stripe Checkout**:
- [ ] 创建 Checkout Session
- [ ] 单次支付 $9.9 USD / ¥29.9 CNY
- [ ] 成功后跳转到 /success?session_id=xxx
- [ ] 失败后跳转到 /canceled

**Webhook 处理**:
- [ ] POST /api/webhooks/stripe
- [ ] 验证签名(STRIPE_WEBHOOK_SECRET)
- [ ] checkout.session.completed 事件处理
- [ ] 更新 invitation.status = 'published'
- [ ] 更新 invitation.publishedAt
- [ ] 生成唯一 slug
- [ ] 存储支付记录到 payments 表

**数据库**:
- [ ] payments 表已创建
- [ ] 字段完整(id/userId/invitationId/stripeSessionId/amount/currency/status)

**紧急程度**: 🔴 **极高** - 支付是商业模式的核心

---

## 三、数据持久化问题(新发现)

### 🔴 严重 Bug: 创建的邀请函无法检索

**重现步骤**:
```bash
# Step 1: 创建访客草稿
POST /api/invitations
Response: {
  "success": true,
  "data": {
    "id": "4a32db44-c067-4760-892b-99e5b5f51685",
    "sessionId": "5d193a41-a039-4333-9a28-4d3de7339ff7",
    "scene": "wedding",
    "title": "Week8 Test"
  },
  "isGuest": true
}

# Step 2: 尝试通过 ID 检索
GET /api/invitations/4a32db44-c067-4760-892b-99e5b5f51685
Response: {"error":"Invitation not found."}

# Step 3: 尝试通过 session ID 检索
GET /api/invitations?sessionId=5d193a41-a039-4333-9a28-4d3de7339ff7
Response: {"success":true,"data":[],"isGuest":true}
```

**问题分析**:

可能原因:
1. **数据未正确存储到数据库**
   - 创建 API 返回了假数据
   - 事务未提交
   - 数据库连接问题

2. **存储到了错误的表**
   - 应该存到 `guest_drafts` 表
   - 但检索时查询的是 `invitations` 表

3. **Session ID 管理问题**
   - Cookie 未正确设置
   - 检索时使用了不同的 session ID

4. **数据立即过期**
   - 虽然设置了 7 天 TTL,但可能立即被清理

**影响**:
- 用户创建草稿后刷新页面,数据丢失
- 完全无法使用访客草稿功能
- **这是 v2.1 的核心要求,目前不可用**

**紧急程度**: 🔴 **极高** - 这是基础功能的致命 bug

---

## 四、前端页面验收

### ✅ 已完成的页面

1. **首页** (/) ✅
   - 设计良好
   - shadcn/ui 组件
   - CTA 指向 /create

2. **场景选择页** (/create) ✅
   - 标题: "What are you celebrating?"
   - 4 个场景卡片:
     - Wedding (粉色图标)
     - Birthday (琥珀色图标)
     - Business event (天蓝色图标)
     - Other gathering (翠绿色图标)
   - 每个卡片包含:
     - 图标 + 场景名称
     - 描述文字
     - 标签(Engagement/Ceremony/Reception 等)
   - 点击跳转到 /templates?scene=xxx ✅

3. **模板库页面** (/templates) ✅
   - 标题: "A considered starting point."
   - 显示 3 个模板(推测)
   - 筛选功能(通过 URL 参数)

4. **登录页面** (/login) ✅
   - 标题: "Sign in to your studio"
   - 邮箱输入框(推测)
   - Google OAuth 按钮(推测)
   - 返回首页链接

### ❌ 缺失的页面

5. **编辑器页面** (/editor/[id]) ❌
   - 404 Not Found
   - Week 5-6 任务
   - **最高优先级**

6. **H5 邀请函页面** (/i/[slug]) ❌
   - 404 Not Found
   - Week 8 核心任务
   - **MVP 交付物**

7. **Dashboard** (/dashboard) ⚠️
   - 存在但跳转到 /login
   - 无法测试实际内容
   - 可能没有实际功能

8. **支付成功页面** (/success) ⚠️
   - 未测试
   - Stripe 回调页面

9. **支付取消页面** (/canceled) ⚠️
   - 未测试
   - Stripe 回调页面

---

## 五、API 端点验收

### ✅ 已实现的 API

1. **GET /api/templates** ✅
   - 返回 3 个模板
   - 分页元数据正确
   - 响应格式符合规范

2. **POST /api/invitations** ✅ (但有 bug)
   - 创建访客草稿成功
   - 返回 sessionId + expiresAt
   - **但创建的数据无法检索** 🔴

3. **POST /api/invitations/:id/publish** ✅ (部分)
   - 登录拦截正确
   - 但完整流程未验证

4. **POST /api/payment/create-checkout** ✅ (部分)
   - 端点存在
   - 登录拦截正确
   - 但完整流程未验证

### ❌ 未实现或有问题的 API

5. **GET /api/invitations/:id** ❌
   - 返回 "Invitation not found"
   - 无法检索刚创建的数据

6. **GET /api/invitations?sessionId=xxx** ❌
   - 返回空数组
   - 无法检索访客草稿

7. **PATCH /api/invitations/:id** ⚠️
   - 未测试
   - 编辑器需要此端点

8. **POST /api/rsvp** ❌
   - 参数验证失败
   - 返回 "expected string, received undefined"

9. **POST /api/ai/generate-copy** ❌
   - 返回 "AI copy request is invalid."
   - Week 7 任务

10. **POST /api/auth/migrate-guest-data** ⚠️
    - 未测试
    - 需要登录流程

11. **POST /api/webhooks/stripe** ⚠️
    - 未测试
    - Stripe webhook 处理

---

## 六、关键问题汇总

### 🔴 阻塞性问题(必须立即解决)

**P0-1: 编辑器页面完全缺失** (Week 5-6)
- 影响: 无法创建邀请函内容
- 状态: 完全未开始
- 优先级: **最高**
- 建议: 立即开发 `/editor/[id]` 页面 + Fabric.js 集成

**P0-2: H5 渲染引擎完全缺失** (Week 8)
- 影响: 无法展示邀请函给受邀者
- 状态: 完全未开始
- 优先级: **最高**
- 建议: 开发 `/i/[slug]` 页面 + SSR 渲染逻辑

**P0-3: 数据持久化 Bug** (新发现)
- 影响: 创建的草稿无法检索,数据丢失
- 状态: 严重 bug
- 优先级: **最高**
- 建议: 修复 GET /api/invitations/:id 和 ?sessionId= 查询逻辑

**P0-4: RSVP API 不可用** (Week 8)
- 影响: 受邀者无法回复
- 状态: 参数验证失败
- 优先级: **最高**
- 建议: 修复 POST /api/rsvp 的 Zod schema

### 🟡 重要问题(Week 8 前解决)

**P1-1: Stripe 支付流程未验证** (Week 8)
- 影响: 无法收款
- 状态: 端点存在但未完整测试
- 优先级: 高
- 建议: 完成 Webhook 处理 + 测试完整流程

**P1-2: AI 文案生成未实现** (Week 7)
- 影响: 用户体验降低
- 状态: 端点存在但返回错误
- 优先级: 高
- 建议: 集成 OpenAI API + 降级策略

### 🟢 次要问题(可延后)

**P2-1: Dashboard 功能缺失**
- 当前只有登录拦截,无实际内容
- 优先级: 中
- 建议: Phase 2 补充

**P2-2: 登录功能未完整测试**
- 邮箱验证码 + Google OAuth
- 优先级: 中
- 建议: 需要真实邮件服务测试

---

## 七、开发建议优先级

### 🚨 立即开始(本周必须完成)

**P0-1: 修复数据持久化 Bug** (1-2 天)
```
1. 检查 POST /api/invitations 的数据库写入逻辑
2. 确认数据存储到 guest_drafts 表
3. 修复 GET /api/invitations/:id 查询逻辑:
   - 先查 invitations 表(已登录用户)
   - 再查 guest_drafts 表(访客草稿)
   - 验证 session ID
4. 修复 GET /api/invitations?sessionId=xxx 查询
5. 添加日志记录排查问题
6. 测试刷新页面后数据不丢失
```

**P0-2: 开发编辑器页面** (3-5 天)
```
1. 创建 /editor/[id] 页面
2. 集成 Fabric.js 6.x
3. 加载模板 JSON 到画布
4. 实现基础编辑:
   - 文本双击编辑
   - 图片上传替换
   - 元素拖拽/缩放
5. 实现草稿自动保存:
   - 访客: PATCH /api/invitations/:id (guest_drafts)
   - 已登录: PATCH /api/invitations/:id (invitations)
6. 页面顶部提示条:
   - 访客: "未登录,草稿将保存 7 天"
   - 已登录: "自动保存中..."
7. "发布"按钮:
   - 访客 → /login?continue=/editor/[id]?action=publish
   - 已登录 → 进入支付流程
```

**P0-3: 修复 RSVP API** (1 天)
```
1. 检查 POST /api/rsvp 的 Zod schema
2. 修复 "expected string, received undefined" 错误
3. 确认字段映射:
   - invitationId (string, required)
   - name (string, required)
   - email (string, required)
   - status (enum: attending/declined/maybe, required)
   - guestCount (number, optional)
   - dietary (string, optional)
4. 确认 rsvps 表已创建
5. 测试完整流程
```

### 下周开始(Week 8 任务 - 5-7 天)

**P0-4: H5 渲染引擎** (3-4 天)
```
1. 创建 /i/[slug] 页面(SSR)
2. 从数据库读取 invitation 数据
3. 根据 content JSON 渲染元素:
   - 支持图片背景
   - 支持 HTML 元素背景
   - 支持视频背景
4. 嵌入 RSVP 表单(页面底部)
5. Redis 缓存(5 分钟 TTL)
6. SEO meta 标签
7. 响应式布局
```

**P0-5: Stripe 支付集成** (2-3 天)
```
1. 完成 POST /api/payment/create-checkout:
   - 创建 Stripe Checkout Session
   - 设置 success_url 和 cancel_url
   - 返回 sessionId 给前端
2. 前端跳转到 Stripe Checkout
3. 实现 POST /api/webhooks/stripe:
   - 验证签名
   - 处理 checkout.session.completed
   - 更新 invitation.status = 'published'
   - 生成唯一 slug
   - 存储 payment 记录
4. 创建 /success 页面
5. 创建 /canceled 页面
6. 测试完整支付流程
```

**P0-6: 访客数据迁移** (1 天)
```
1. 实现 POST /api/auth/migrate-guest-data
2. 登录成功后自动调用:
   - 查找 sessionId 的所有 guest_drafts
   - 迁移到 invitations 表(user_id = 当前用户)
   - 删除原 guest_drafts
3. 显示迁移提示:"已保存 N 个草稿到您的账户"
4. 如果有 ?continue= 参数,跳转回编辑器
```

### 可延后(Phase 2)

**P1: AI 文案生成** (2-3 天)
```
1. 集成 OpenAI API
2. 实现 POST /api/ai/generate-copy
3. 返回 3 条备选文案
4. 降级策略(预设文案)
```

**P2: Dashboard 增强** (3-5 天)
```
1. 邀请函列表(分页)
2. RSVP 数据查看
3. 统计图表
4. 导出 CSV
5. 批量邮件发送(Phase 2 新功能)
```

---

## 八、测试建议

### 手动测试清单(修复 Bug 后)

#### 测试 1: 数据持久化
```
1. 打开浏览器隐身模式
2. POST /api/invitations 创建草稿
3. 记录返回的 ID 和 sessionId
4. GET /api/invitations/:id
   ✓ 应该返回刚创建的数据
5. 刷新浏览器
6. 再次 GET /api/invitations/:id
   ✓ 数据仍然存在
7. GET /api/invitations?sessionId=xxx
   ✓ 返回该 session 的所有草稿
```

#### 测试 2: RSVP 提交
```
1. 访问 H5 页面 /i/[slug]
2. 填写 RSVP 表单:
   - Name: Test User
   - Email: test@test.com
   - Status: Attending
   - Guest count: 2
3. 提交
   ✓ 返回成功提示
4. 查询数据库:
   ✓ rsvps 表有新记录
   ✓ invitationId 正确
   ✓ 字段值正确
```

#### 测试 3: 完整发布流程(编辑器完成后)
```
访客用户:
1. 访问 /create → 选择 Wedding
2. 选择模板 "Modern vows"
3. 进入编辑器 /editor/[id]
   ✓ 页面顶部显示 "未登录,草稿将保存 7 天"
4. 编辑文本 + 上传图片
   ✓ 自动保存
5. 刷新页面
   ✓ 编辑内容不丢失
6. 点击 "发布"
   ✓ 跳转到 /login?continue=/editor/[id]?action=publish
7. 输入邮箱 + 验证码登录
   ✓ 登录成功后返回编辑器
   ✓ 显示 "已保存 1 个草稿到您的账户"
   ✓ 页面顶部提示变为 "自动保存中..."
8. 再次点击 "发布"
   ✓ 跳转到 Stripe Checkout
9. 完成支付(测试模式)
   ✓ 跳转到 /success
   ✓ 显示邀请函链接: /i/[slug]
10. 访问 /i/[slug]
   ✓ 邀请函正确渲染
   ✓ RSVP 表单显示在底部

已登录用户:
1. 以登录状态访问 /create
2. 选择场景 → 选择模板
3. 进入编辑器
   ✓ 页面顶部显示 "自动保存中..."
4. 编辑后点击 "发布"
   ✓ 直接跳转到 Stripe Checkout(无需再次登录)
5. 完成支付
   ✓ 成功发布
```

#### 测试 4: Dashboard
```
1. 登录后访问 /dashboard
   ✓ 显示邀请函列表
   ✓ 显示每个邀请函的 RSVP 统计
2. 点击某个邀请函
   ✓ 查看详细 RSVP 列表
   ✓ 导出 CSV
```

---

## 九、数据库验证

### 需要验证的表

```sql
-- 1. guest_drafts 表(访客草稿)
SELECT * FROM guest_drafts WHERE session_id = 'xxx';
-- 应该看到:
-- - id, session_id, content, created_at, expires_at
-- - expires_at = created_at + 7 天

-- 2. invitations 表(已发布的邀请函)
SELECT * FROM invitations WHERE user_id = 'xxx';
-- 应该看到:
-- - id, user_id, scene, title, content, slug, status, published_at
-- - status = 'published' 或 'draft'

-- 3. rsvps 表(回复记录)
SELECT * FROM rsvps WHERE invitation_id = 'xxx';
-- 应该看到:
-- - id, invitation_id, name, email, status, guest_count, dietary

-- 4. payments 表(支付记录)
SELECT * FROM payments WHERE user_id = 'xxx';
-- 应该看到:
-- - id, user_id, invitation_id, stripe_session_id, amount, currency, status

-- 5. 检查过期草稿自动清理
SELECT COUNT(*) FROM guest_drafts WHERE expires_at < NOW();
-- 应该返回 0(定时任务已清理)
```

---

## 十、与 Week 7 Review 的对比

### Week 7 Review 发现

**当时状态**:
- 完成度: 45%
- 编辑器: 404(完全缺失)
- AI 功能: API 返回错误
- H5 渲染: 未测试
- 支付: 未测试

### Week 8 Review 发现

**当前状态**:
- 完成度: **仍然 45%**(无进展)
- 编辑器: 404(仍然缺失)
- AI 功能: API 仍然返回错误
- H5 渲染: 404(完全缺失)
- 支付: 端点存在但未完整实现
- RSVP: API 返回参数验证错误
- **新发现**: 数据持久化 Bug(严重)

### 结论

**Week 7 到 Week 8 之间: 无实质性进展**

虽然声称完成 Week 8,但实际上:
1. Week 5-6 的编辑器仍未开发
2. Week 7 的 AI 功能仍未修复
3. Week 8 的三大任务(H5/RSVP/支付)全部缺失
4. 发现新的严重 Bug(数据无法检索)

**实际进度仍在 Week 3-4 水平**

---

## 十一、风险评估

### 技术风险

1. **架构完整性风险** 🔴
   - 编辑器缺失导致整个流程断裂
   - 数据持久化问题导致用户数据丢失
   - 无法完成端到端测试

2. **产品交付风险** 🔴
   - H5 渲染是 MVP 的最终交付物,完全缺失
   - 支付功能未完成,无法产生收入
   - RSVP 功能不可用,核心价值缺失

3. **数据安全风险** 🟡
   - 数据持久化 Bug 可能导致用户数据丢失
   - Session 管理可能有安全漏洞
   - 需要完整的端到端测试

### 时间风险

**剩余工作量估算**:
- 修复数据 Bug: 1-2 天
- 开发编辑器: 3-5 天
- 修复 RSVP API: 1 天
- 开发 H5 渲染: 3-4 天
- 完成支付集成: 2-3 天
- 访客数据迁移: 1 天
- **总计: 11-16 天(2-3 周)**

**建议**:
- 立即开始修复数据 Bug(最高优先级)
- 并行开发编辑器和 RSVP API
- H5 渲染和支付集成可以稍后
- AI 功能延后到 Phase 2

---

## 十二、总结与建议

### 当前状态: **Week 8 任务 0% 完成**

**Week 8 三大核心功能全部缺失**:
1. ❌ H5 邀请函渲染
2. ❌ RSVP 系统
3. ❌ Stripe 支付集成

**根本原因**:
- Week 5-6 的编辑器未开发,导致后续流程无法进行
- 声称的进度与实际完成度严重不符
- 新发现严重 Bug(数据无法检索)

### 关键发现

**严重问题**:
1. 🔴 编辑器完全缺失(Week 5-6 任务)
2. 🔴 H5 渲染完全缺失(Week 8 核心)
3. 🔴 数据持久化 Bug(新发现,严重)
4. 🔴 RSVP API 不可用(参数验证失败)

**次要问题**:
5. 🟡 AI 功能未实现(Week 7)
6. 🟡 支付流程未完整测试
7. 🟡 Dashboard 无实际功能

### 下一步行动

**立即开始(本周)**:
1. 修复数据持久化 Bug(1-2 天)
2. 开发编辑器页面(3-5 天)
3. 修复 RSVP API(1 天)

**下周开始**:
4. H5 渲染引擎(3-4 天)
5. Stripe 支付集成(2-3 天)
6. 访客数据迁移(1 天)

**延后到 Phase 2**:
7. AI 文案生成
8. Dashboard 增强

### 建议调整开发计划

**当前计划不切实际**:
- 声称 Week 8,实际在 Week 3-4
- 需要重新评估时间线

**建议新计划**:
- Week 1-2: 修复 Bug + 开发编辑器(重做 Week 5-6)
- Week 3: H5 渲染 + RSVP(重做 Week 8 Part 1)
- Week 4: 支付集成 + 数据迁移(重做 Week 8 Part 2)
- Week 5+: AI + Dashboard(Phase 2)

**预计 MVP 可发布时间**: 4 周后

---

**Review 完成时间**: 2026-08-30  
**下次 Review 建议**: 数据 Bug 修复后 + 编辑器开发完成后(预计 1 周内)  
**责任人**: Codex(开发) + 用户(验收)  

**最紧急的行动**: 立即修复数据持久化 Bug,否则所有功能都无法正常测试
