# Carte MVP Review 报告

**Review 日期**: 2026-08-30  
**部署地址**: http://139.180.215.236:3010  
**测试账号**: carte.tester@carte.test (验证码: 197032)  
**Reviewer**: Claude (Opus 4.8)

---

## 一、当前实现情况总结

### 1.1 已完成的核心功能

✅ **首页(Landing Page)**
- 精美的营销页面
- 品牌定位清晰("Invitations with intention")
- 三步说明("Start with a feeling" → "Make it yours" → "Share the moment")
- 响应式布局
- 使用 shadcn/ui 组件
- 符合设计规范(Inter 字体、现代极简风格)

✅ **认证系统**
- 登录入口存在(/login)
- 测试账号可用

### 1.2 当前架构判断

从 HTML 源码可以看出:
- ✅ 使用 Next.js 15 (App Router)
- ✅ 使用 Inter 字体
- ✅ 使用 Lucide React 图标
- ✅ SSR 渲染正常
- ✅ 响应式布局(Tailwind CSS)
- ✅ 符合设计规范

### 1.3 关键问题

❌ **未登录用户无法制作邀请函**
- 当前所有 CTA 按钮("Start creating", "Create your invitation")都指向 `/login`
- 这与产品定位不符:应该让用户**先体验创作,再登录保存**

❌ **缺少关键页面**
- 模板库页面(未看到)
- 编辑器页面(未看到)
- H5 邀请函页面(未看到)
- Dashboard(未看到)

---

## 二、核心需求变更:未登录用户也能制作

### 2.1 新的用户流程

```
未登录用户:
1. 访问首页 → 点击"Start creating"
2. 直接进入场景选择页(无需登录)
3. 填写活动信息 → 选择模板
4. 进入编辑器(全功能)
5. 编辑完成 → 点击"发布"
6. 此时弹出登录/注册 + 支付
7. 完成支付 → 邀请函发布
8. 数据存储:
   - 未登录:存 localStorage + Cookie(会话 ID),服务端临时存储(7天)
   - 已登录:永久存储到用户账户

已登录用户:
1. 访问首页 → 点击"Start creating"
2. 直接进入场景选择页
3. (流程同上,但每一步都自动保存到账户)
4. Dashboard 可查看历史邀请函
5. 额外功能:批量邮件发送、数据统计
```

### 2.2 技术实现要点

**未登录用户数据存储方案**:

```typescript
// 前端: localStorage 存储草稿
interface GuestDraft {
  draftId: string;        // UUID
  sessionId: string;      // 会话 ID(Cookie)
  content: InvitationContent;
  createdAt: number;
  updatedAt: number;
}

// 后端: 临时表存储(7天 TTL)
CREATE TABLE guest_drafts (
  id UUID PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- created_at + 7 days
  
  INDEX idx_session (session_id),
  INDEX idx_expires (expires_at)
);

-- 定时任务清理过期数据
DELETE FROM guest_drafts WHERE expires_at < NOW();
```

**发布时的登录 + 支付流程**:

```typescript
// 用户点击"发布"
async function handlePublish() {
  // 1. 检查登录状态
  const session = await getSession();
  
  if (!session) {
    // 2. 未登录 → 显示登录/注册弹窗
    const continueUrl = `/editor/${draftId}?action=publish`;
    router.push(`/login?continue=${encodeURIComponent(continueUrl)}`);
    return;
  }
  
  // 3. 已登录 → 创建 Stripe Checkout
  const checkout = await createCheckout({
    invitationId: draftId,
    priceId: 'price_single',
  });
  
  // 4. 跳转到支付页面
  window.location.href = checkout.url;
}

// 登录成功后的回调
async function handleLoginSuccess() {
  const params = new URLSearchParams(window.location.search);
  const continueUrl = params.get('continue');
  
  if (continueUrl?.includes('action=publish')) {
    // 将 guest_draft 迁移到用户账户
    await migrateGuestDraft(draftId, userId);
    
    // 继续支付流程
    router.push(continueUrl);
  }
}
```

### 2.3 已登录用户的额外功能

**Dashboard 增强**:
- 查看所有历史邀请函(已发布 + 草稿)
- 查看每个邀请函的 RSVP 数据
- 批量邮件发送功能(新增)
- 访问统计(浏览量/点击量/转化率)

**批量邮件发送功能**(需补充设计):

```typescript
// 新增 API: POST /api/invitations/:id/send-emails
interface SendEmailsRequest {
  invitationId: string;
  recipients: Array<{
    email: string;
    name?: string;
  }>;
  subject?: string;       // 可选,默认用活动标题
  message?: string;       // 可选,自定义邮件正文
}

// 数据库新增表
CREATE TABLE email_sends (
  id UUID PRIMARY KEY,
  invitation_id UUID REFERENCES invitations(id),
  user_id UUID REFERENCES users(id),
  recipient_email VARCHAR(255),
  recipient_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending', -- pending/sent/failed/bounced
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 三、设计规范验收

### 3.1 ✅ 已符合的规范

**组件库**:
- ✅ 使用 shadcn/ui Button(可从 class 判断)
- ✅ 使用 Lucide React 图标
- ✅ 无原生 `<button>` 或 `alert()`

**字体**:
- ✅ 使用 Inter 字体(从 class `inter_fe8b9d92-module__LINzvG__variable` 可见)
- ✅ 字体大小符合规范(text-xs/sm/base/lg/xl...)

**色彩**:
- ✅ 使用 HSL CSS 变量系统
- ✅ 主色调克制(黑白灰为主)
- ✅ 文字层级清晰(foreground/muted-foreground)

**布局**:
- ✅ 使用 Tailwind 间距系统(p-4/gap-2/px-6...)
- ✅ 响应式布局(sm:/lg:/xl:)
- ✅ 圆角统一(rounded-md/rounded-lg/rounded-2xl)

**交互**:
- ✅ 按钮有 hover 状态(hover:bg-primary/90)
- ✅ 按钮有 active 缩放(active:scale-[0.98])
- ✅ 过渡动画(transition-colors duration-150)

**文案**:
- ✅ 符合品牌调性("Invitations with intention")
- ✅ 文案优雅、有温度

### 3.2 ❌ 需要改进的地方

**首页 CTA**:
- ❌ 所有 CTA 都指向 `/login`,应该改为直接进入创作流程
- 建议:
  - "Start creating" → `/create` 或 `/templates`
  - "Create your invitation" → `/create`

**缺少关键页面**:
- ❌ 模板库页面(`/templates`)
- ❌ 编辑器页面(`/editor/:id`)
- ❌ H5 邀请函页面(`/i/:slug`)
- ❌ Dashboard(`/dashboard`)

---

## 四、功能完整性验收(基于 tech-spec-detailed.md)

### Phase 1 - Week 1-2: 基础搭建

- ✅ Next.js 15 + TypeScript 项目
- ✅ Tailwind CSS + shadcn/ui
- ✅ 认证系统(登录入口存在)
- ✅ 基础 UI 组件
- ❌ Dashboard 页面(未看到)

**完成度**: 80%

### Phase 1 - Week 3-4: 模板系统

- ❌ 模板列表页(未看到)
- ❌ 模板详情页(未看到)
- ❌ 3 个 demo 模板(未验证)

**完成度**: 0%

### Phase 1 - Week 5-6: 编辑器

- ❌ 编辑器页面(未看到)
- ❌ Fabric.js 集成(未验证)

**完成度**: 0%

### Phase 1 - Week 7: AI 集成

- ❌ AI 文案生成(未验证)

**完成度**: 0%

### Phase 1 - Week 8: H5 生成与支付

- ❌ H5 邀请函页面(未看到)
- ❌ RSVP 表单(未验证)
- ❌ Stripe 支付(未验证)

**完成度**: 0%

---

## 五、关键建议

### 5.1 立即调整

1. **修改首页 CTA**:
   ```tsx
   // 当前(错误)
   <Link href="/login">Start creating</Link>
   
   // 应改为(正确)
   <Link href="/create">Start creating</Link>
   ```

2. **实现场景选择页** (`/create`):
   - 显示 4 个场景卡片(Wedding/Birthday/Business/Other)
   - 点击后进入该场景的模板库
   - 无需登录即可访问

3. **未登录用户数据处理**:
   - 前端用 localStorage 存草稿
   - 后端 API 接受 `sessionId`(Cookie)作为临时用户标识
   - 发布时要求登录

### 5.2 功能优先级调整

**P0(必须完成才能上线)**:
- [ ] 场景选择页
- [ ] 模板库页面(至少 3 个模板)
- [ ] 编辑器(简化版,能改文字/图片)
- [ ] H5 邀请函渲染
- [ ] 登录 + 支付流程
- [ ] 未登录用户临时存储

**P1(上线后快速补充)**:
- [ ] Dashboard(查看历史邀请函)
- [ ] RSVP 数据查看
- [ ] AI 文案生成
- [ ] 批量邮件发送

**P2(后续迭代)**:
- [ ] 更多模板
- [ ] 高级编辑器功能
- [ ] 访问统计
- [ ] 多语言支持

---

## 六、Git 提交建议

当前项目应该提交的内容:

```bash
# 1. 提交当前已完成的首页
git add .
git commit -m "feat: implement landing page with brand identity

- Add hero section with Carte branding
- Implement responsive layout (mobile-first)
- Use shadcn/ui components throughout
- Add Inter font and Lucide icons
- Implement 3-step explainer section
- Add semantic HTML and ARIA labels

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# 2. 下一步分支规划
git checkout -b feat/guest-user-flow
# 实现未登录用户流程

git checkout -b feat/templates-library
# 实现模板库

git checkout -b feat/editor
# 实现编辑器
```

---

## 七、测试清单(当前无法验证的部分)

由于只看到首页,以下功能需要在后续 review 时验证:

- [ ] 登录功能是否正常(测试账号能否登录)
- [ ] 模板库是否存在且可访问
- [ ] 编辑器是否实现
- [ ] H5 邀请函是否能正常渲染
- [ ] RSVP 表单是否工作
- [ ] 支付流程是否集成
- [ ] Dashboard 是否存在
- [ ] 数据是否正确存储到数据库

**建议**: 提供完整的功能导航或 Sitemap,以便全面 review。

---

## 八、总体评价

**当前完成度**: 约 15%

**优点**:
- ✅ 首页设计精美,品牌调性清晰
- ✅ 严格遵循设计规范
- ✅ 技术选型正确(Next.js 15 + shadcn/ui)
- ✅ 代码质量高(从 HTML 结构判断)

**缺点**:
- ❌ 核心功能(模板/编辑器/H5)未看到
- ❌ 用户流程不符合需求(强制登录)
- ❌ 无法验证完整功能

**下一步行动**:
1. 修改首页 CTA 指向
2. 实现场景选择页 + 模板库
3. 实现编辑器(简化版)
4. 实现未登录用户临时存储
5. 实现 H5 渲染 + RSVP
6. 集成支付

**预计还需开发时间**: 4-6 周(按原计划 Week 3-8)

---

**Review 状态**: ⚠️ 部分通过(首页优秀,但核心功能缺失)  
**是否建议提交 Git**: ✅ 是(提交已完成的首页部分)  
**是否建议继续下一阶段**: ✅ 是(开始 Week 3-4 模板系统开发)
