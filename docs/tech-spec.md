# Carte(嘉礼) 技术方案文档 v1.0

**项目定位**: AI 驱动的在线邀请函生成与托管平台  
**目标**: 小而美的全球化产品,年营收目标 $1M  
**核心差异化**: 审美 + 易用性 + AI 智能生成 + H5 托管与分享  
**MVP 范围**: Web 端(网页版),后续扩展移动端和小程序

---

## 一、产品功能定义

### 1.1 用户核心流程

```
1. 用户访问 carte.app (或其它域名)
2. 选择场景(婚礼/生日/商务会议/满月/其它)
3. 通过对话式表单输入活动信息:
   - 基本信息: 活动名称、时间、地点、主办人
   - 风格偏好: 现代极简/复古优雅/活泼可爱/商务正式等
   - 可选: 上传照片、特殊说明
4. AI 理解需求 → 推荐 3-5 个模板 + 预生成文案
5. 用户选择一个模板,进入**可视化编辑器**(Canva-lite):
   - 修改文字内容(标题/正文/时间地点)
   - 替换/上传图片
   - 调整颜色方案(品牌色/主题色)
   - 微调元素位置、大小、字体
   - 启用/禁用背景音乐、动画效果
6. 实时预览 → 满意后点击"发布"
7. 弹出支付页面(Stripe/支付宝/微信支付):
   - 单次发布 $9.9 / ¥29.9
   - 终身买断: $299,终身免按次付费,每天最多发布 10 份新邀请函
8. 支付成功 → 生成唯一短链接(如 carte.app/i/abc123)
9. 用户复制链接分享到社交媒体/短信/邮件
```

### 1.2 H5 邀请函功能(宾客侧)

访问链接后,宾客看到的页面:

**必选功能**:
- 精美的视觉呈现(响应式,移动优先)
- 活动基本信息(时间/地点/着装/备注)
- RSVP 回执表单:
  - 姓名/联系方式
  - 出席状态: 参加 / 不参加 / 待定
  - 人数(如: 本人+家属共2人)
  - 饮食偏好(可选,素食/过敏源)
  - 留言祝福(可选)

**可选功能**(用户创建时勾选):
- 背景音乐(自动播放/点击播放,合规处理)
- 倒计时器(距离活动开始还有X天)
- 添加到日历按钮(生成 .ics 文件)
- 地图导航(嵌入 Google Maps / 高德地图)
- 照片轮播/画廊(新人照片、活动预告图)
- 多语言切换按钮(如果用户设置了多语言版本)

**暂不做**(Phase 2):
- 照片墙/留言板(需要内容审核)
- 视频嵌入
- 在线礼金/随礼(涉及支付牌照)

### 1.3 用户后台(Dashboard)

用户登录后可以:
- 查看所有已创建的邀请函
- 查看每个邀请函的 RSVP 数据:
  - 参加人数 / 不参加 / 待定
  - 导出为 CSV/Excel
  - 饮食偏好统计
- 编辑已发布的邀请函(更新信息,如地点变更)
- 复制/克隆邀请函(快速创建类似活动)
- 查看访问统计(浏览量/转化率,基础版)
- 账户管理(付费记录、终身权益状态、当日剩余发布次数)

### 1.4 MVP 场景覆盖

需要准备模板和文案库的场景(按优先级):

1. **婚礼** (Tier 1, 必须质量过硬)
   - 风格: 现代极简、复古优雅、森系自然、奢华宫廷、中式传统、新中式
   - 模板数: 每个风格至少 3-5 个,共 20-30 个
   
2. **生日/派对** (Tier 1, 高频)
   - 风格: 儿童卡通、青少年潮酷、成人简约、复古主题
   - 模板数: 15-20 个
   
3. **商务/会议** (Tier 1, 高客单价潜力)
   - 风格: 商务正式、科技感、学术简洁
   - 模板数: 10-15 个
   
4. **满月/宝宝宴** (Tier 2)
   - 风格: 温馨可爱、卡通动物、传统喜庆
   - 模板数: 8-10 个

5. **其它**(Tier 2):
   - 升学宴、乔迁、开业、节日聚会等
   - 复用其它场景模板,文案调整

**总计模板数量**: MVP 需要 60-80 个高质量模板(可部分复用骨架,换配色/插图)

---

## 二、技术架构

### 2.1 技术栈选型

| 层级 | 技术选型 | 理由 |
|-----|---------|------|
| **前端框架** | Next.js 15 + React 19 + TypeScript | SSR 对 SEO 友好,App Router 现代化,Vercel 优化,TypeScript 保证质量 |
| **样式方案** | Tailwind CSS + Headless UI | 快速迭代,响应式优先,设计系统易扩展 |
| **编辑器** | Fabric.js 或 Konva + React | 成熟的 Canvas 库,支持图层/拖拽/缩放/旋转/文字编辑 |
| **状态管理** | Zustand | 轻量、TypeScript 友好,比 Redux 简单 |
| **表单处理** | React Hook Form + Zod | 声明式校验,性能好,类型安全 |
| **后端** | Next.js API Routes (初期) → 独立 Node.js/NestJS (扩展后) | 初期快速开发,后期可拆分微服务 |
| **数据库** | PostgreSQL (主库) + Redis (缓存) | 关系型数据适合结构化数据,Redis 做会话/限流 |
| **ORM** | Prisma | TypeScript 原生,迁移管理好,生成类型 |
| **文件存储** | S3-compatible (AWS S3 / Cloudflare R2 / 阿里云 OSS) | 用户上传图片、生成的 H5 静态资源、模板素材 |
| **CDN** | Cloudflare / AWS CloudFront | H5 页面全球加速,减轻源站压力 |
| **AI 能力** | OpenAI GPT-4 / Claude API | 文案生成、需求理解、模板推荐 |
| **支付** | Stripe (国际) + Lemon Squeezy / Paddle (备选) <br> 支付宝/微信支付(国内) | Stripe 支持全球信用卡,Lemon Squeezy 处理税务简单;<br>国内需接入支付宝/微信(聚合支付或官方 SDK) |
| **认证** | NextAuth.js (Auth.js v5) | 支持邮箱/Google/Apple/微信登录,集成简单 |
| **邮件服务** | Resend / SendGrid | 发送登录验证码、RSVP 通知、交易邮件 |
| **国际化** | next-intl | Next.js 官方推荐,SSR 友好,支持动态语言切换 |
| **SEO** | next-sitemap + JSON-LD Schema | 自动生成 sitemap,结构化数据增强搜索展示 |
| **监控/分析** | Vercel Analytics / Umami (自托管) / Plausible | 隐私友好的分析工具,避免 GDPR 问题 |
| **部署** | 自托管(Docker + Nginx + PM2) 或 VPS | 你提到会自己托管,建议容器化部署便于迁移 |

### 2.2 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户端(浏览器)                          │
│  - 创建者: Web App (Next.js SSR)                              │
│  - 宾客: H5 邀请函页面(静态化 HTML+CSS+JS,托管在 CDN)          │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      负载均衡 / CDN                            │
│              (Cloudflare CDN + DDoS 防护)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 应用服务器(Node.js)                  │
│  - SSR 渲染(首页/模板库/SEO 页面)                              │
│  - API Routes:                                               │
│    * /api/invitations (CRUD)                                │
│    * /api/ai/generate (AI 文案生成)                          │
│    * /api/templates (模板列表/详情)                           │
│    * /api/rsvp (RSVP 提交/查询)                              │
│    * /api/payment (支付回调)                                 │
│    * /api/render (H5 静态化生成)                             │
└─────────────────────────────────────────────────────────────┘
           ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  PostgreSQL      │  │  Redis           │  │  对象存储(S3)     │
│  - 用户/邀请函   │  │  - 会话缓存      │  │  - 用户上传图片  │
│  - RSVP 数据     │  │  - 速率限制      │  │  - 模板素材库    │
│  - 模板元数据    │  │  - AI 结果缓存   │  │  - 生成的 H5     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                            ↓
                  ┌──────────────────┐
                  │  外部服务         │
                  │  - OpenAI API    │
                  │  - Stripe API    │
                  │  - Email Service │
                  └──────────────────┘
```

### 2.3 数据库设计(核心表)

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  locale VARCHAR(10) DEFAULT 'en', -- 用户偏好语言
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 邀请函表
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(20) UNIQUE NOT NULL, -- 短链接标识 (如 abc123)
  
  -- 元数据
  scene VARCHAR(50) NOT NULL, -- wedding/birthday/business/baby/other
  title VARCHAR(200) NOT NULL,
  locale VARCHAR(10) DEFAULT 'en', -- 邀请函语言
  
  -- 内容(存 JSON)
  content JSONB NOT NULL, -- 包含所有文本/图片URL/样式配置
  template_id UUID REFERENCES templates(id), -- 使用的模板ID
  
  -- 活动信息
  event_date TIMESTAMP,
  event_location TEXT,
  
  -- 配置
  settings JSONB DEFAULT '{}', -- 背景音乐、动画、RSVP开关等
  
  -- 状态
  status VARCHAR(20) DEFAULT 'draft', -- draft/published/archived
  published_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 模板表
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  scene VARCHAR(50) NOT NULL,
  style VARCHAR(50), -- modern/vintage/playful/formal等
  
  -- 模板数据
  thumbnail_url TEXT NOT NULL, -- 缩略图
  preview_url TEXT, -- 完整预览图
  structure JSONB NOT NULL, -- 模板骨架(图层/元素定义)
  
  -- 元数据
  tags TEXT[], -- 搜索标签
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- RSVP 回执表
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID REFERENCES invitations(id) ON DELETE CASCADE,
  
  guest_name VARCHAR(100) NOT NULL,
  guest_email VARCHAR(255),
  guest_phone VARCHAR(50),
  
  status VARCHAR(20) NOT NULL, -- attending/declined/maybe
  party_size INTEGER DEFAULT 1, -- 参加人数
  dietary_preferences TEXT,
  message TEXT, -- 留言祝福
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 支付记录表
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  invitation_id UUID REFERENCES invitations(id),
  
  amount_cents INTEGER NOT NULL, -- 金额(分)
  currency VARCHAR(3) DEFAULT 'USD',
  
  payment_provider VARCHAR(50), -- stripe/alipay/wechat
  provider_payment_id VARCHAR(255), -- 第三方支付ID
  
  status VARCHAR(20) DEFAULT 'pending', -- pending/succeeded/failed/refunded
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI 生成历史(可选,用于优化)
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  prompt TEXT NOT NULL,
  response JSONB,
  model VARCHAR(50),
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.4 H5 静态化方案

用户支付后,系统需要生成一个独立的 H5 页面托管在 CDN:

**方案 A: 服务端渲染 + 缓存(推荐)**
1. 用户访问 `carte.app/i/abc123`
2. Next.js 服务器查询数据库获取邀请函数据
3. 使用 React 组件渲染完整 HTML(SSR)
4. 首次访问后,将渲染结果缓存到 Redis(TTL 1小时)或直接写入 CDN 边缘缓存
5. 后续访问直接返回缓存的 HTML(极快)
6. 如果用户更新了邀请函,清除对应缓存

**方案 B: 静态导出 + 上传到对象存储**
1. 用户点击发布后,后端调用无头浏览器(Puppeteer / Playwright)
2. 渲染邀请函为完整的 HTML 文件(包含内联 CSS/JS)
3. 上传到 S3/R2,设置为公开访问
4. 返回 CDN 地址: `https://cdn.carte.app/invitations/abc123/index.html`

**推荐方案 A**,理由:
- 更新方便(改数据库即可,方案B需要重新生成+上传)
- 首次访问稍慢(200-500ms),但缓存后与静态文件无异
- RSVP 数据可以实时提交到 API(方案B也需要API)

### 2.5 可视化编辑器技术方案

这是开发量最大的模块,建议分三期:

**Phase 1 (MVP): 固定布局 + 可编辑字段**
- 用户选择模板后,看到的是"锁定布局"的预览
- 可以点击文本框直接编辑内容(contentEditable 或表单)
- 可以点击图片区域上传/替换
- 可以选择预设的配色方案(3-5种)
- 底层: 模板是 React 组件,字段通过 props 传入

**Phase 2: 图层面板 + 简单拖拽**
- 引入 Fabric.js 或 Konva.js
- 显示图层列表(背景/装饰/文字/图片)
- 可以拖动调整位置、缩放、旋转
- 文字可以改字体/大小/颜色
- 仍然限制在画布范围内,不能添加新元素

**Phase 3: 完整工作台**
- 可以从素材库拖入新元素(图标/贴纸/形状)
- 图层锁定/隐藏/分组
- 撤销/重做
- 导出为模板(让用户贡献模板)

**MVP 建议做到 Phase 1.5**:
- 文本/图片可编辑
- 可以微调位置(拖拽)
- 可以换配色
- 不支持添加新元素(保证不会做丑)

---

## 三、AI 能力设计

### 3.1 AI 的三个应用场景

**场景 1: 文案生成**
- 输入: 用户填写的活动信息(场景/风格/主办人名字/时间地点)
- 输出: 3-5 条不同风格的邀请正文(温馨/诙谐/正式/诗意)
- 模型: GPT-4o-mini (便宜) 或 Claude Haiku(质量更稳定)
- Prompt 示例:
  ```
  你是一位专业的邀请函文案撰写专家。
  
  活动信息:
  - 类型: 婚礼
  - 风格: 现代极简
  - 新郎新娘: 张三 & 李四
  - 时间: 2026年12月25日 下午2点
  - 地点: 北京四季酒店
  
  请生成3条不同风格的邀请正文(每条50-100字):
  1. 温馨浪漫风格
  2. 诙谐幽默风格
  3. 简洁大方风格
  
  要求: 中文,符合中国婚礼文化,不要套话,要有温度。
  ```

**场景 2: 模板推荐**
- 输入: 用户描述("我想办一场森系户外婚礼")
- 输出: 推荐的模板 ID 列表 + 推荐理由
- 实现: Embedding 搜索(向量数据库) 或 LLM 直接分析
- 流程:
  1. 将所有模板的"描述+标签"做 Embedding(用 OpenAI text-embedding-3-small)
  2. 存入向量数据库(Pinecone / Qdrant / PostgreSQL pgvector 插件)
  3. 用户输入 → Embedding → 相似度搜索 Top 5
  4. 或直接让 GPT-4 看一眼模板列表(JSON)选出最合适的

**场景 3: 智能参数调整(可选)**
- 根据用户选择的"温馨"风格,自动调整配色为暖色调
- 根据"商务会议"场景,自动禁用背景音乐、选择无衬线字体
- 这部分可以硬编码规则,不一定需要 AI

### 3.2 成本控制

| 操作 | 模型 | 预估 Token | 成本/次 | 10万用户成本 |
|-----|------|-----------|--------|-------------|
| 文案生成(3条) | GPT-4o-mini | 输入500 + 输出300 | $0.0003 | $30 |
| 模板推荐(Embedding) | text-embedding-3-small | 100 tokens | $0.000002 | $0.20 |

每个付费用户平均触发 2-3 次 AI 生成,总成本约 **$0.001/用户**,可忽略不计。

### 3.3 降级策略

如果 AI API 挂了或超时:
- 文案生成 → 返回预设的模板文案(按场景/风格分类)
- 模板推荐 → 返回默认的热门模板列表
- 保证核心流程不中断

---

## 四、国际化与 SEO

### 4.1 多语言支持

**支持语言(MVP)**:
- 中文(简体) `zh-CN`
- 英文 `en`
- 可选: 日文 `ja` / 韩文 `ko` / 西班牙文 `es`(市场验证后)

**实现方案**:
1. 使用 `next-intl` 库
2. 目录结构:
   ```
   app/
     [locale]/
       page.tsx         (首页)
       templates/       (模板库)
       dashboard/       (用户后台)
       i/[slug]/        (H5邀请函页面)
   ```
3. 翻译文件:
   ```
   messages/
     en.json
     zh-CN.json
   ```
4. 自动语言检测:
   - 首次访问根据 `Accept-Language` 跳转到 `/en` 或 `/zh-CN`
   - 用户可手动切换,存 Cookie
5. H5 邀请函多语言:
   - 创建时可选"多语言版本"(需支付额外费用,如 $3)
   - 同一个 slug 带语言参数: `/i/abc123?lang=zh-CN`

### 4.2 SEO 策略

**关键页面优化**:
1. **首页** (`/`)
   - Title: "Carte - AI-Powered Invitation Generator | Beautiful Digital Invites"
   - Description: "Create stunning wedding, birthday, and event invitations in minutes with AI. Share instantly via link. No design skills needed."
   - 关键词: invitation maker, wedding invitations, digital invites, AI invitation generator
   
2. **场景落地页** (`/templates/wedding`, `/templates/birthday`)
   - 每个场景单独的 SEO 页面
   - 标题: "Free Wedding Invitation Templates | AI-Generated & Customizable"
   - 长尾词: "modern wedding invitation", "vintage birthday invite"
   
3. **模板详情页** (`/templates/modern-wedding-001`)
   - 每个模板独立页面(SSR)
   - Open Graph 图片(og:image)用模板缩略图
   - JSON-LD Schema 标记(Event / CreativeWork)

**技术实现**:
- `next-sitemap` 自动生成 sitemap.xml
- `robots.txt` 允许抓取,屏蔽用户后台和草稿页
- 结构化数据:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Carte",
    "applicationCategory": "DesignApplication",
    "offers": {
      "@type": "Offer",
      "price": "9.90",
      "priceCurrency": "USD"
    }
  }
  ```

**内容营销**:
- 博客(可选): `/blog` - "How to word a wedding invitation", "10 birthday party invitation ideas"
- 用 MDX 写,SSR 渲染,对 SEO 友好
- 每篇文章带 CTA 跳转到模板页

---

## 五、支付与变现

### 5.1 定价策略

| 产品 | 价格(美元) | 价格(人民币) | 备注 |
|-----|-----------|------------|------|
| 单次发布 | $9.90 | ¥29.9 | 1个邀请函,终身访问 |
| 终身买断 | $299.00 | 暂不提供 | 终身免按次付费,每个 UTC 自然日最多发布 10 份新邀请函 |
| 多语言版本(附加) | +$2.90 | +¥9.9 | 同一邀请函的英文/中文版 |
| 去除"Powered by Carte"水印 | +$4.90 | +¥14.9 | 白标选项 |

### 5.2 支付集成

**国际支付**: Stripe
- 支持信用卡/Apple Pay/Google Pay
- Webhook 处理支付成功事件
- 税务: Stripe Tax 自动计算增值税(欧盟/英国)

**国内支付**: 
- 支付宝: 官方 SDK 或聚合支付(如 Ping++)
- 微信支付: 需企业主体,或用聚合支付

**实现流程**:
1. 用户点击"发布" → 创建 `Payment Intent`(Stripe) 或支付订单(支付宝)
2. 前端跳转到支付页(Stripe Checkout 或嵌入式表单)
3. 支付成功 → Webhook 回调 `/api/payment/callback`
4. 后端验证签名 → 更新数据库(邀请函状态改为 `published`) → 生成 H5
5. 前端轮询或 WebSocket 通知用户支付结果 → 跳转到分享页

### 5.3 防滥用与限流

- 未登录用户: 最多创建 1 个草稿(存 localStorage + IP 限制)
- 已登录未付费用户: 最多 3 个草稿
- 终身买断用户: 无限草稿,每个 UTC 自然日最多发布 10 份新邀请函;编辑已发布邀请函不计次
- RSVP 提交: IP 级限流(每个邀请函每IP每天最多提交 5 次)
- AI 生成: 每用户每小时最多 10 次(Redis 计数)

---

## 六、性能与安全

### 6.1 性能优化

**前端**:
- 图片: Next.js Image 组件自动优化(WebP/AVIF,懒加载)
- 字体: 本地化 Google Fonts,避免外部请求阻塞
- Code Splitting: 编辑器组件动态加载(`next/dynamic`)
- 模板预览: 缩略图用 WebP,点击后再加载高清图

**后端**:
- 数据库查询: 索引优化(user_id, slug, scene)
- Redis 缓存: 热门模板列表、首页数据(TTL 5分钟)
- CDN: H5 邀请函页面全量缓存(只要未更新就永久缓存)
- 数据库连接池: Prisma 配置合理的 `connection_limit`

**H5 页面**:
- 内联关键 CSS(首屏渲染)
- 背景音乐延迟加载(点击后或滚动后触发)
- 图片压缩(用户上传时自动压缩到 1MB 以下)

### 6.2 安全措施

**认证与授权**:
- JWT Token 存 HttpOnly Cookie(防 XSS)
- CSRF Token 保护写操作
- API 鉴权: 用户只能访问自己的邀请函

**数据保护**:
- 用户上传图片: 检查 MIME type,禁止可执行文件
- RSVP 提交: 防止 SQL 注入(Prisma 参数化查询)
- 敏感数据: 邮箱/手机号加密存储(可选)

**DDoS 与爬虫**:
- Cloudflare Bot Fight Mode
- Rate Limiting: 每 IP 每分钟最多 60 次请求
- H5 页面: 允许爬虫(用于 SEO),但 RSVP API 需要 CAPTCHA(hCaptcha/Turnstile)

**合规**:
- GDPR: 提供数据导出和删除功能
- Cookie 同意横幅(欧盟用户)
- 隐私政策和服务条款页面

---

## 七、开发路线图

### Phase 1: MVP 核心功能 (6-8 周)

**Week 1-2: 基础搭建**
- [ ] Next.js 项目初始化 + Tailwind CSS
- [ ] 数据库设计 + Prisma 模型
- [ ] 用户认证(NextAuth: 邮箱登录 + Google OAuth)
- [ ] 基础 UI 组件库(按钮/表单/卡片)

**Week 3-4: 模板系统**
- [ ] 设计并制作 10-15 个高质量模板(婚礼/生日各5个)
- [ ] 模板数据结构设计(JSON Schema)
- [ ] 模板列表页 + 筛选(场景/风格)
- [ ] 模板预览页(放大图/详情)

**Week 5-6: 编辑器(简化版)**
- [ ] 表单式编辑器: 填写活动信息
- [ ] 文本字段可编辑(点击修改)
- [ ] 图片上传与替换
- [ ] 配色方案切换(预设3-5种)
- [ ] 实时预览

**Week 7: AI 集成**
- [ ] OpenAI API 集成
- [ ] 文案生成功能(3条备选)
- [ ] 模板推荐(简单规则或 Embedding)

**Week 8: H5 生成与支付**
- [ ] H5 邀请函 SSR 渲染
- [ ] RSVP 表单提交与存储
- [ ] Stripe 支付集成(单次购买)
- [ ] 支付成功 → 发布流程
- [ ] 分享页(复制链接/二维码)

**Week 8+: 测试与上线**
- [ ] 端到端测试(Playwright)
- [ ] 性能优化(Lighthouse 90+)
- [ ] SEO 基础(sitemap/meta标签)
- [ ] 部署到生产环境(Docker + Nginx)

### Phase 2: 增强功能 (4-6 周)

- [ ] 可视化拖拽编辑器(Fabric.js)
- [ ] 用户后台 Dashboard(RSVP 数据导出)
- [ ] 多语言支持(next-intl)
- [ ] 更多场景模板(商务/满月,各10个)
- [ ] 终身买断($299,每天最多发布10次)
- [ ] 国内支付(支付宝/微信)
- [ ] 邮件通知(RSVP 提醒发给创建者)

### Phase 3: 扩展与优化 (持续迭代)

- [ ] 移动端 App(React Native / Flutter)
- [ ] 微信小程序版
- [ ] 高级功能(照片墙/留言板/视频嵌入)
- [ ] 模板市场(让用户贡献模板)
- [ ] 团队协作(多人编辑同一邀请函)
- [ ] 白标方案(让婚礼策划师用自己的域名)

---

## 八、成本估算(月度)

假设月活 1000 付费用户:

| 项目 | 费用(美元) | 说明 |
|-----|-----------|------|
| 云服务器(VPS) | $50-100 | DigitalOcean/Linode 4GB RAM,足够初期 |
| 数据库托管 | $25 | Supabase/Railway PostgreSQL + Redis |
| 对象存储(S3/R2) | $5-10 | 10GB 存储 + 流量 |
| CDN(Cloudflare) | $0-20 | 免费版足够,Pro $20/月 |
| AI API(OpenAI) | $30-50 | 1000用户 × 3次生成 × $0.001 ≈ $3,留缓冲 |
| 支付手续费(Stripe) | 2.9%+$0.3 | 1000×$9.9 = $9900营收,手续费约$317 |
| 邮件服务(Resend) | $0-20 | 1万封/月免费,超出$1/千封 |
| 域名 | $1-2/月 | .app 域名约$15/年 |
| **总计(不含支付手续费)** | **$131-227** | 毛利率 ≈ 90% |

1000 付费用户 × $9.9 = $9,900/月营收  
扣除成本$227 + 支付手续费$317 = **$9,356 净收入**

达到 $1M/年 需要约 **8,400 付费用户/年**(月均 700 用户),成本线性扩展到约 $2,000/月(仍有 $81K/年 ≈ 92% 毛利)。

---

## 九、风险与缓解

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 模板质量不过关 | 高:核心竞争力失效 | 找专业设计师外包前20个模板,内部严格审核;上线前做小范围测试 |
| AI 生成质量差/不稳定 | 中:影响体验但非核心 | 预设高质量模板文案作为降级方案;人工润色 AI 输出 |
| 支付流程复杂导致弃单 | 高:直接影响收入 | 简化到"一键支付",支持多种方式;A/B 测试优化转化率 |
| 冷启动获客困难 | 高:无流量无收入 | SEO(长尾词)+Pinterest/小红书有机内容+产品内裂变(水印带品牌) |
| 被 Canva 降维打击 | 中:长期威胁 | 深耕细分场景(婚礼/商务),做 Canva 不屑做的深度定制;建立品牌忠诚度 |
| 服务器宕机影响付费用户 | 中:影响口碑 | 容器化部署,准备备用服务器;监控告警(UptimeRobot);H5 托管在 CDN(源站挂了 CDN 还能访问) |
| GDPR/隐私合规问题 | 低:但要提前准备 | 提供数据导出/删除功能;隐私政策清晰;Cookie 横幅 |

---

## 十、成功指标(KPI)

**产品指标**:
- 注册转化率: 访客 → 注册 ≥ 15%
- 付费转化率: 注册 → 付费 ≥ 5% (行业基准 2-8%)
- 模板使用分布: 确保不是只有1-2个模板被用(说明其它模板质量差)
- RSVP 回执率: 宾客打开邀请函后填写 RSVP ≥ 40%

**增长指标**:
- 月付费用户数(MoM 增长 ≥ 20%)
- 自然流量占比 ≥ 60%(SEO + 裂变)
- CAC(获客成本) < $5(目标是接近 $0)
- 用户 NPS(净推荐值) ≥ 50

**财务指标**:
- MRR(月经常性收入) → ARR
- 毛利率 ≥ 85%
- 达到 $1M ARR 的时间表

---

## 十一、待决策问题

在开始开发前,还需要你确认:

1. **域名**: 你已经注册了 `carte.app` 或其它域名吗?还是需要建议?
   
2. **设计资源**: 初期模板是你自己设计,还是需要外包?如果外包,预算多少?

3. **服务器位置**: 你打算托管在国内(需要备案)还是海外(香港/新加坡/美国)?

4. **首批目标市场**: 虽然是中英双语,但营销资源有限的情况下,是先主推中国市场还是欧美?

5. **是否需要我协助开发**: 你是独立开发还是有团队?需要我帮忙搭架子吗?

---

**文档版本**: v1.0  
**最后更新**: 2026-08-30  
**下一步**: 确认待决策问题后,开始 Phase 1 开发。
