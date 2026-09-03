# Carte(嘉礼) 技术方案文档 v2.1 - 详细版

**项目定位**: AI 驱动的在线邀请函生成与托管平台  
**目标**: 小而美的全球化产品,年营收目标 $1M  
**核心差异化**: 审美 + 易用性 + AI 智能生成 + H5 托管与分享  
**MVP 范围**: Web 端(网页版),后续扩展移动端和小程序

**重要更新(v2.1 - 2026-08-30)**:
- **核心变更**: 未登录用户可以直接创建邀请函(无需登录)
- 登录仅在发布/支付时要求,降低使用门槛
- 未登录用户数据临时保存 7 天,登录后自动迁移
- 新增批量邮件发送功能(已登录用户专享)
- 详细设计见 `feature-supplement.md`

**v2.0 更新**:
- 模板系统支持多种背景类型(图片/HTML元素/视频)
- MVP 阶段仅需 3 个 demo 模板
- 支付简化为仅 Stripe
- 新增详细的验收标准和 API 规范

---

## 目录

1. [产品功能定义](#一产品功能定义)
2. [模板系统详细设计](#二模板系统详细设计)
3. [技术架构](#三技术架构)
4. [数据库设计](#四数据库设计)
5. [API 接口规范](#五api-接口规范)
6. [编辑器技术方案](#六编辑器技术方案)
7. [H5 渲染引擎](#七h5-渲染引擎)
8. [AI 能力设计](#八ai-能力设计)
9. [国际化与 SEO](#九国际化与-seo)
10. [支付集成](#十支付集成)
11. [性能与安全](#十一性能与安全)
12. [开发路线图与验收标准](#十二开发路线图与验收标准)
13. [测试策略](#十三测试策略)
14. [部署方案](#十四部署方案)

---

## 一、产品功能定义

### 1.1 用户核心流程

#### 1.1.1 未登录用户流程(降低门槛,先体验后付费)

```
未登录用户旅程:
1. 访问首页 → 点击"开始创作"(无需登录)
2. 选择场景(婚礼/生日/商务/其它) → /create
3. 选择模板(3 个 demo) → /templates?scene=wedding
4. 填写活动信息 + 进入编辑器 → /editor/[draftId]
5. 编辑内容(文字/图片/配色/位置)
   - 数据自动保存到 localStorage(前端)
   - 同时同步到 guest_drafts 表(后端,session_id 标识)
   - 页面顶部提示:"未登录,草稿将保存 7 天"
6. 预览 → 点击"发布"
7. ⚠️ 跳转到登录页 /login?continue=/editor/[draftId]?action=publish
8. 登录成功 → 自动迁移 guest_drafts 到 invitations 表
9. 继续支付流程 → Stripe 按次支付($9.9)或终身买断($299)
10. 支付成功 → 生成短链接(carte.app/i/abc123)
11. 分享链接(复制/二维码/社交媒体)
```

**关键优势**:
- 零门槛体验:用户可以先编辑,看到效果后再决定是否付费
- 数据不丢失:7 天内登录,草稿自动迁移到账户
- 符合 Freemium 模式:体验驱动转化

#### 1.1.2 已登录用户流程(全程无阻断)

```
已登录用户旅程:
1. 访问首页 → 点击"开始创作"
2. 选择场景 → 选择模板
3. 填写活动信息 + 编辑
   - 数据自动保存到 invitations 表(永久存储)
   - 无需担心数据过期
4. 预览 → 点击"发布"
5. 直接进入支付流程(无需登录)
6. 支付成功 → 生成短链接
7. 额外功能:
   - Dashboard 查看所有历史邀请函
   - 批量邮件发送邀请函给宾客
   - 查看 RSVP 数据与导出
   - 访问统计
```

**关键决策点**:
- **编辑器复杂度**: 可视化拖拽(Fabric.js),允许调整位置/大小/颜色,但不能添加新元素
- **支付时机**: 编辑完成后、发布前付费(行业主流,转化率高)
- **AI 介入深度**: 智能组装(AI 推荐模板 + 生成文案),不做深度图像生成
- **未登录数据 TTL**: 7 天自动清理(guest_drafts 表的 expires_at 字段)

### 1.2 H5 邀请函功能(宾客视角)

宾客访问 `carte.app/i/abc123` 后看到的页面:

**核心展示**:
- 响应式布局(移动优先,适配 320px - 1920px)
- 活动标题、日期、时间、地点
- 主视觉(图片/视频背景 + 装饰元素)
- 主办人信息

**RSVP 回执表单**(必选):
- 姓名(必填)
- 邮箱或手机(必填)
- 出席状态: 参加/不参加/待定(单选)
- 参加人数(数字输入,默认 1)
- 饮食偏好(可选文本框)
- 留言祝福(可选 textarea,最多 500 字)
- 提交按钮

**可选功能**(创建时配置):
- 背景音乐(自动播放/点击播放,移动端需用户交互才能播放)
- 倒计时器(距活动开始还有 X 天 X 小时)
- 添加到日历(.ics 文件下载)
- 地图导航(嵌入 Google Maps iframe + "导航"按钮)
- 照片画廊(轮播或网格展示最多 9 张照片)

**暂不做**(Phase 2+):
- UGC 留言板/照片墙(需内容审核)
- 视频嵌入(除背景视频外)
- 在线礼金(需支付牌照)

### 1.3 用户后台(Dashboard)

登录后可访问 `/dashboard`,功能包括:

**邀请函管理**:
- 列表视图(卡片网格):
  - 缩略图预览
  - 标题、场景、状态(草稿/已发布/已归档)
  - 浏览量、RSVP 数量
  - 操作按钮: 编辑/查看数据/批量发邮件/复制/删除
- 筛选: 按场景、状态、日期
- 搜索: 按标题

**RSVP 数据面板**:
- 统计卡片: 总人数 / 参加 / 不参加 / 待定
- 数据表格: 姓名、联系方式、状态、人数、留言、提交时间
- 导出为 CSV/Excel
- 饮食偏好汇总(如: 素食 5人,海鲜过敏 2人)

**批量邮件发送**(已登录用户专享):
- 点击"Send via Email"按钮
- 输入收件人邮箱列表(每行一个)
- 自定义邮件主题和正文(可选)
- 邮件包含邀请函链接 + 活动信息
- 发送状态追踪(pending/sent/failed)
- 可选:打开和点击追踪(需邮件服务商支持)

**其它功能**:
- 编辑已发布的邀请函(修改内容,自动刷新 H5 缓存)
- 复制邀请函(快速创建相似活动)
- 账户设置(修改邮箱/密码/偏好语言)
- 付费记录(订单列表、终身权益状态、当日剩余发布次数)

**对比:未登录用户无法访问**:
- 未登录用户没有 Dashboard
- 无法查看历史邀请函(数据仅保存 7 天)
- 无法使用批量邮件发送
- 无法导出 RSVP 数据
- 这些限制促使用户注册/登录

---

## 二、模板系统详细设计

### 2.1 模板数据结构(JSON Schema)

模板是一个 JSON 对象,定义了邀请函的完整结构。

#### 2.1.1 顶层结构

```typescript
interface Template {
  id: string;                    // UUID
  name: string;                  // 模板名称(如 "Modern Wedding 01")
  scene: 'wedding' | 'birthday' | 'business' | 'baby' | 'other';
  style: string;                 // 风格标签(如 "modern", "vintage", "playful")
  description: string;           // 描述(用于 AI 推荐)
  tags: string[];               // 搜索标签(如 ["elegant", "minimal", "gold"])
  
  thumbnail_url: string;        // 缩略图(用于列表展示)
  preview_url: string;          // 高清预览图
  
  canvas: {
    width: number;              // 画布宽度(px,推荐 750px 移动优先)
    height: number;             // 画布高度(px,推荐 1334px 或自适应)
    background: BackgroundConfig;
  };
  
  layers: Layer[];              // 图层数组(从下到上渲染)
  
  variables: TemplateVariable[];  // 可编辑变量定义
  colorSchemes: ColorScheme[];    // 预设配色方案
  
  settings: {
    allowMusic?: boolean;       // 是否支持背景音乐
    allowAnimation?: boolean;   // 是否支持动画
    rsvpEnabled?: boolean;      // 是否默认开启 RSVP
  };
}
```

#### 2.1.2 背景配置(支持图片/HTML/视频)

```typescript
type BackgroundConfig = 
  | { type: 'color'; value: string }                    // 纯色背景
  | { type: 'gradient'; value: string }                // CSS 渐变
  | { type: 'image'; url: string; fit: 'cover' | 'contain' | 'fill' }
  | { type: 'video'; url: string; poster?: string; loop: boolean; muted: boolean }
  | { type: 'html'; html: string; css?: string };      // 自定义 HTML(如粒子动画)

// 示例:
// 1. 图片背景
{ type: 'image', url: '/templates/wedding-01/bg.jpg', fit: 'cover' }

// 2. 视频背景
{ type: 'video', url: '/templates/wedding-02/bg.mp4', poster: '/templates/wedding-02/poster.jpg', loop: true, muted: true }

// 3. HTML 背景(如 CSS 动画、Canvas 粒子)
{ 
  type: 'html', 
  html: '<div class="particles"></div>', 
  css: '.particles { /* 粒子动画样式 */ }' 
}
```

#### 2.1.3 图层定义

```typescript
interface Layer {
  id: string;                   // 图层唯一ID
  type: 'text' | 'image' | 'shape' | 'decoration';
  name: string;                 // 图层名称(显示在编辑器图层面板)
  
  // 位置与尺寸(相对画布)
  position: { x: number; y: number };  // 左上角坐标(px)
  size: { width: number; height: number };
  rotation?: number;            // 旋转角度(度)
  opacity?: number;             // 透明度(0-1)
  zIndex?: number;              // 层叠顺序(可选,默认按数组顺序)
  
  // 锁定与可见性
  locked?: boolean;             // 是否锁定(锁定后不可编辑)
  visible?: boolean;            // 是否可见(默认 true)
  
  // 类型特定属性
  content: TextContent | ImageContent | ShapeContent | DecorationContent;
  
  // 变量绑定(如果该图层内容由变量控制)
  variable?: string;            // 对应 variables 数组中的 key
}

// 文本图层
interface TextContent {
  text: string;
  font: {
    family: string;
    size: number;
    weight: number | string;
    style?: 'normal' | 'italic';
    lineHeight?: number;
    letterSpacing?: number;
  };
  color: string;
  align: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  maxWidth?: number;            // 文字最大宽度(自动换行)
  shadow?: TextShadow;
}

interface TextShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

// 图片图层
interface ImageContent {
  url: string;
  fit: 'cover' | 'contain' | 'fill';
  filter?: string;              // CSS filter(如 "blur(2px)")
  borderRadius?: number;        // 圆角
  border?: { width: number; color: string; style: string };
}

// 形状图层
interface ShapeContent {
  shape: 'rectangle' | 'circle' | 'line' | 'polygon';
  fill?: string;
  stroke?: { color: string; width: number };
  borderRadius?: number;        // 矩形圆角
  points?: { x: number; y: number }[];  // 多边形顶点
}

// 装饰图层(如花边、边框、图标)
interface DecorationContent {
  url: string;                  // SVG 或 PNG
  blend?: string;               // mix-blend-mode
}
```

#### 2.1.4 变量系统(可编辑字段)

```typescript
interface TemplateVariable {
  key: string;                  // 变量名(如 "bride_name")
  type: 'text' | 'image' | 'color' | 'date' | 'location';
  label: string;                // 编辑器中的标签(如 "新娘姓名")
  defaultValue: any;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;           // 正则表达式
  };
  aiGenerable?: boolean;        // 是否可由 AI 生成
}

// 示例:
variables: [
  { key: 'event_title', type: 'text', label: '活动标题', defaultValue: '我们结婚啦', validation: { required: true, maxLength: 50 }, aiGenerable: true },
  { key: 'bride_name', type: 'text', label: '新娘姓名', defaultValue: '', validation: { required: true } },
  { key: 'groom_name', type: 'text', label: '新郎姓名', defaultValue: '', validation: { required: true } },
  { key: 'event_date', type: 'date', label: '婚礼日期', defaultValue: null, validation: { required: true } },
  { key: 'event_location', type: 'location', label: '婚礼地点', defaultValue: '', validation: { required: true } },
  { key: 'invitation_text', type: 'text', label: '邀请正文', defaultValue: '', aiGenerable: true },
  { key: 'couple_photo', type: 'image', label: '婚纱照', defaultValue: '/templates/wedding-01/placeholder.jpg' },
  { key: 'theme_color', type: 'color', label: '主题色', defaultValue: '#d4af37' }
]
```

#### 2.1.5 配色方案

```typescript
interface ColorScheme {
  id: string;
  name: string;                 // 配色方案名称(如 "优雅金色")
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    [key: string]: string;      // 其它自定义颜色
  };
}

// 示例:
colorSchemes: [
  {
    id: 'gold-elegant',
    name: '优雅金色',
    colors: {
      primary: '#d4af37',
      secondary: '#8b7355',
      accent: '#f4e4c1',
      text: '#333333',
      background: '#ffffff'
    }
  },
  {
    id: 'rose-romantic',
    name: '浪漫玫瑰',
    colors: {
      primary: '#ff6b9d',
      secondary: '#c44569',
      accent: '#ffd1dc',
      text: '#4a4a4a',
      background: '#fff5f7'
    }
  }
]
```

### 2.2 MVP Demo 模板设计

MVP 阶段只需 3 个 demo 模板,覆盖不同背景类型:

#### Demo 1: 现代婚礼(图片背景)
- **场景**: wedding
- **风格**: modern, minimal, elegant
- **背景**: 高清婚纱照(cover)
- **图层**: 
  - 半透明渐变遮罩
  - 标题文字(新郎 & 新娘)
  - 日期/地点文字
  - 邀请正文
  - 装饰线条
- **变量**: 新郎名、新娘名、日期、地点、正文、婚纱照
- **配色**: 3 种(金色/玫瑰金/银色)

#### Demo 2: 生日派对(HTML 背景 - 粒子动画)
- **场景**: birthday
- **风格**: playful, colorful
- **背景**: CSS 动画彩色粒子(HTML canvas 或纯 CSS)
- **图层**:
  - 标题("Happy Birthday")
  - 寿星姓名
  - 日期/地点
  - 卡通装饰元素(气球/蛋糕 SVG)
- **变量**: 寿星名、年龄、日期、地点
- **配色**: 3 种(彩虹/粉蓝/紫橙)

#### Demo 3: 商务会议(视频背景)
- **场景**: business
- **风格**: formal, professional, tech
- **背景**: 循环视频(如城市天际线延时摄影,10秒 loop)
- **图层**:
  - 半透明深色遮罩
  - 会议标题(大字)
  - 主办方 logo 占位
  - 日期/时间/地点
  - 议程要点(列表)
- **变量**: 会议标题、主办方、logo、日期、地点、议程
- **配色**: 2 种(科技蓝/商务灰)

### 2.3 模板存储方案

**数据库**: 
- `templates` 表存储元数据(id, name, scene, style, tags, thumbnail_url)
- `structure` 字段(JSONB)存储完整的 Template JSON

**对象存储(S3/R2)**:
- `/templates/{template_id}/` 目录存放素材:
  - `thumbnail.jpg` (缩略图, 400x711)
  - `preview.jpg` (高清预览, 1500x2667)
  - `bg.jpg` 或 `bg.mp4` (背景资源)
  - `assets/` (装饰图片/SVG)
  - `metadata.json` (Template JSON 完整定义)

**渲染时**:
- 从数据库读取 `structure` JSONB
- 解析 JSON → React 组件树
- 异步加载图片/视频资源(带 loading 状态)

---

## 三、技术架构

### 3.1 技术栈(确定版)

| 层级 | 技术 | 版本 | 说明 |
|-----|------|------|------|
| **运行时** | Node.js | 20 LTS | 
| **前端框架** | Next.js | 15.x | App Router
| **UI 库** | React | 19.x |
| **语言** | TypeScript | 5.x | 严格模式
| **样式** | Tailwind CSS | 3.x | + HeadlessUI
| **编辑器核心** | Fabric.js | 6.x | Canvas 操作
| **状态管理** | Zustand | 4.x |
| **表单** | React Hook Form | 7.x | + Zod 校验
| **数据库** | PostgreSQL | 15+ | 
| **缓存** | Redis | 7+ |
| **ORM** | Prisma | 5.x |
| **对象存储** | S3-compatible | - | AWS S3 / Cloudflare R2 / Minio
| **CDN** | Cloudflare | - |
| **AI** | OpenAI API | GPT-4o-mini | + Claude Haiku 备用
| **支付** | Stripe | - | Checkout + Webhook
| **认证** | Auth.js | v5 | (NextAuth 新版)
| **邮件** | Resend | - |
| **国际化** | next-intl | 3.x |
| **部署** | Docker | - | + Nginx

### 3.2 项目目录结构

```
carte/
├── .env.local                 # 环境变量
├── .env.example              # 环境变量模板
├── docker-compose.yml        # 本地开发环境
├── Dockerfile                # 生产镜像
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── prisma/
│   ├── schema.prisma         # 数据库模型
│   └── migrations/           # 迁移脚本
├── public/
│   ├── templates/            # 模板静态资源
│   └── assets/               # 公共资源
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── [locale]/         # 国际化路由
│   │   │   ├── page.tsx      # 首页
│   │   │   ├── templates/    # 模板库
│   │   │   ├── editor/       # 编辑器页面
│   │   │   ├── dashboard/    # 用户后台
│   │   │   └── i/[slug]/     # H5 邀请函页面
│   │   ├── api/              # API Routes
│   │   │   ├── auth/
│   │   │   ├── invitations/
│   │   │   ├── templates/
│   │   │   ├── rsvp/
│   │   │   ├── payment/
│   │   │   └── ai/
│   │   └── layout.tsx
│   ├── components/           # React 组件
│   │   ├── ui/               # 基础 UI(Button/Input...)
│   │   ├── editor/           # 编辑器组件
│   │   ├── invitation/       # 邀请函渲染组件
│   │   └── dashboard/        # 后台组件
│   ├── lib/                  # 工具库
│   │   ├── prisma.ts         # Prisma 客户端
│   │   ├── redis.ts          # Redis 客户端
│   │   ├── s3.ts             # 对象存储客户端
│   │   ├── stripe.ts         # Stripe SDK
│   │   ├── openai.ts         # OpenAI 客户端
│   │   ├── email.ts          # 邮件发送
│   │   └── utils.ts          # 通用工具函数
│   ├── hooks/                # 自定义 Hooks
│   ├── stores/               # Zustand stores
│   ├── types/                # TypeScript 类型定义
│   │   ├── template.ts
│   │   ├── invitation.ts
│   │   └── api.ts
│   └── middleware.ts         # Next.js 中间件(国际化/认证)
├── messages/                 # 国际化翻译
│   ├── en.json
│   └── zh-CN.json
└── docs/                     # 文档
    ├── tech-spec.md
    ├── api.md
    └── deployment.md
```

---

## 四、数据库设计

### 4.1 Prisma Schema(完整版)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  avatarUrl String?  @map("avatar_url")
  locale    String   @default("en")  // 用户偏好语言
  
  // 认证相关(Auth.js)
  emailVerified DateTime?  @map("email_verified")
  image         String?
  lifetimeAccessAt DateTime? @map("lifetime_access_at")
  accounts      Account[]
  sessions      Session[]
  
  invitations   Invitation[]
  payments      Payment[]
  dailyPublishUsages DailyPublishUsage[]
  aiGenerations AIGeneration[]
  emailSends    EmailSend[]  // v2.1 新增
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("users")
}

// Auth.js 需要的表
model Account {
  id                String  @id @default(uuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// 模板表
model Template {
  id          String   @id @default(uuid())
  name        String
  scene       String   // wedding/birthday/business/baby/other
  style       String   // modern/vintage/playful/formal
  description String?  @db.Text
  tags        String[]
  
  thumbnailUrl String  @map("thumbnail_url")
  previewUrl   String? @map("preview_url")
  structure    Json    // Template JSON 完整定义
  
  isPremium   Boolean @default(false) @map("is_premium")
  sortOrder   Int     @default(0) @map("sort_order")
  isActive    Boolean @default(true) @map("is_active")
  
  invitations Invitation[]
  guestDrafts GuestDraft[]  // v2.1 新增
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@index([scene, isActive])
  @@map("templates")
}

// 邀请函表
model Invitation {
  id     String @id @default(uuid())
  userId String @map("user_id")
  slug   String @unique  // 短链接标识
  
  // 基本信息
  scene  String
  title  String
  locale String @default("en")
  
  // 内容(JSON)
  content    Json  // 当前邀请函的完整状态(基于模板 + 用户编辑)
  templateId String? @map("template_id")
  template   Template? @relation(fields: [templateId], references: [id], onDelete: SetNull)
  
  // 活动信息
  eventDate     DateTime? @map("event_date")
  eventLocation String?   @map("event_location")
  
  // 配置
  settings Json @default("{}") // { musicUrl, rsvpEnabled, allowMap, ... }
  
  // 状态
  status      String   @default("draft") // draft/published/archived
  publishedAt DateTime? @map("published_at")
  viewCount   Int      @default(0) @map("view_count")
  
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  rsvps      RSVP[]
  payments   Payment[]
  emailSends EmailSend[] // v2.1 新增
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@index([userId, status])
  @@index([slug])
  @@map("invitations")
}

// RSVP 表
model RSVP {
  id           String @id @default(uuid())
  invitationId String @map("invitation_id")
  
  guestName           String  @map("guest_name")
  guestEmail          String? @map("guest_email")
  guestPhone          String? @map("guest_phone")
  
  status              String  // attending/declined/maybe
  partySize           Int     @default(1) @map("party_size")
  dietaryPreferences  String? @map("dietary_preferences") @db.Text
  message             String? @db.Text
  
  invitation Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@index([invitationId])
  @@map("rsvps")
}

// 访客草稿表(v2.1 新增 - 支持未登录用户)
model GuestDraft {
  id        String   @id @default(uuid())
  sessionId String   @map("session_id")  // 从 Cookie 读取
  
  scene     String
  title     String?
  content   Json     // 与 invitations.content 结构相同
  templateId String? @map("template_id")
  template   Template? @relation(fields: [templateId], references: [id], onDelete: SetNull)
  
  eventDate     DateTime? @map("event_date")
  eventLocation String?   @map("event_location")
  
  settings Json @default("{}")
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  expiresAt DateTime @map("expires_at")  // 创建时间 + 7 天
  
  @@index([sessionId])
  @@index([expiresAt])
  @@map("guest_drafts")
}

// 邮件发送记录表(v2.1 新增 - 批量邮件功能)
model EmailSend {
  id           String @id @default(uuid())
  invitationId String @map("invitation_id")
  userId       String @map("user_id")
  
  recipientEmail String  @map("recipient_email")
  recipientName  String? @map("recipient_name")
  
  subject String
  message String? @db.Text
  
  status String @default("pending") // pending/sent/failed/bounced
  
  sentAt    DateTime? @map("sent_at")
  openedAt  DateTime? @map("opened_at")
  clickedAt DateTime? @map("clicked_at")
  
  errorMessage String? @map("error_message") @db.Text
  
  invitation Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@index([invitationId])
  @@index([status])
  @@index([sentAt])
  @@map("email_sends")
}

// 支付表
model Payment {
  id           String @id @default(uuid())
  userId       String @map("user_id")
  invitationId String? @map("invitation_id")
  
  amountCents       Int    @map("amount_cents")
  currency          String @default("USD")
  purchaseType      String @map("purchase_type") // single_publish/lifetime
  
  paymentProvider   String  @map("payment_provider") // stripe
  providerPaymentId String? @map("provider_payment_id")
  
  status String @default("pending") // pending/succeeded/failed/refunded
  
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  invitation Invitation? @relation(fields: [invitationId], references: [id], onDelete: SetNull)
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@index([userId, status])
  @@index([providerPaymentId])
  @@map("payments")
}

// 终身买断用户每日发布计数(按 UTC 自然日)
model DailyPublishUsage {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  usageDate DateTime @db.Date @map("usage_date")
  count     Int      @default(0)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, usageDate])
  @@map("daily_publish_usages")
}

// AI 生成历史(可选,用于优化和成本跟踪)
model AIGeneration {
  id     String @id @default(uuid())
  userId String @map("user_id")
  
  prompt      String @db.Text
  response    Json?
  model       String
  tokensUsed  Int?   @map("tokens_used")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@index([userId, createdAt])
  @@map("ai_generations")
}
```

### 4.2 索引策略

```sql
-- 高频查询的索引
CREATE INDEX idx_invitations_user_status ON invitations(user_id, status);
CREATE INDEX idx_invitations_slug ON invitations(slug);
CREATE INDEX idx_rsvps_invitation ON rsvps(invitation_id);
CREATE INDEX idx_templates_scene_active ON templates(scene, is_active);
CREATE INDEX idx_payments_user_status ON payments(user_id, status);

-- v2.1 新增索引
CREATE INDEX idx_guest_drafts_session ON guest_drafts(session_id);
CREATE INDEX idx_guest_drafts_expires ON guest_drafts(expires_at);
CREATE INDEX idx_email_sends_invitation ON email_sends(invitation_id);
CREATE INDEX idx_email_sends_status ON email_sends(status);

-- 全文搜索(模板标签)
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);
```

### 4.3 定时任务(v2.1 新增)

**清理过期访客草稿**:
```sql
-- 方案 A: PostgreSQL pg_cron 扩展
SELECT cron.schedule(
  'cleanup-guest-drafts',
  '0 * * * *',  -- 每小时运行
  'DELETE FROM guest_drafts WHERE expires_at < NOW()'
);

-- 方案 B: 应用层 Node.js cron
// src/lib/cron.ts
import cron from 'node-cron';
import { prisma } from '@/lib/prisma';

cron.schedule('0 * * * *', async () => {
  const result = await prisma.guestDraft.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  console.log(`[Cron] Cleaned ${result.count} expired guest drafts`);
});
```

---

## 五、API 接口规范

### 5.1 RESTful API 设计原则

- **基础路径**: `/api/v1/`
- **认证**: Bearer Token(JWT in Cookie)
- **响应格式**: 统一 JSON
  ```typescript
  {
    success: boolean;
    data?: any;
    error?: { code: string; message: string };
    meta?: { page, total, ... };
  }
  ```
- **错误码**: HTTP 状态码 + 自定义业务错误码

### 5.2 核心 API 端点

#### 5.2.1 认证 (Auth)

```
POST   /api/auth/signin              登录(邮箱 + 验证码)
POST   /api/auth/signout             登出
GET    /api/auth/session             获取当前会话
POST   /api/auth/verify              验证邮箱验证码
POST   /api/auth/migrate-guest-data  登录后迁移访客数据(v2.1 新增)
  Response: { success: true, migrated: number }
```

#### 5.2.2 模板 (Templates)

```
GET    /api/templates                获取模板列表
  Query: scene, style, tags, page, limit
  Response: { data: Template[], meta: { total, page } }

GET    /api/templates/:id            获取模板详情
  Response: { data: Template }
```

#### 5.2.3 邀请函 (Invitations)

```
POST   /api/invitations              创建邀请函(v2.1 支持未登录)
  Body: { scene, title, templateId, locale }
  Response: 
    - 已登录: { data: { id, slug, status: 'draft' } }
    - 未登录: { data: { id, isGuest: true, expiresIn: '7 days' } }

GET    /api/invitations              获取用户的邀请函列表(需登录)
  Query: status, scene, page, limit

GET    /api/invitations/:id          获取邀请函详情
  - 已登录: 返回 invitations 表数据
  - 未登录: 返回 guest_drafts 表数据(仅限 session_id 匹配)

PATCH  /api/invitations/:id          更新邀请函(v2.1 支持未登录)
  Body: { content?, settings?, title?, ... }
  - 已登录: 更新 invitations 表
  - 未登录: 更新 guest_drafts 表(session_id 验证)

DELETE /api/invitations/:id          删除邀请函(需登录)

POST   /api/invitations/:id/publish  发布邀请函(触发支付)
  - 未登录用户: 返回 401,前端跳转到 /login?continue=...
  - 终身用户且当日未达上限: 原子记录一次额度并直接发布
  - 终身用户且当日已发布 10 份: 返回 429
  - 非终身用户: 返回 402,前端显示按次付费/终身买断选项

POST   /api/invitations/:id/duplicate 复制邀请函(需登录)

POST   /api/invitations/:id/send-emails  批量发送邮件(v2.1 新增,需登录)
  Body: { 
    recipients: Array<{ email: string; name?: string }>,
    subject?: string,
    message?: string,
    sendImmediately?: boolean
  }
  Response: { success: true, totalRecipients: number }
```

#### 5.2.4 RSVP

```
POST   /api/rsvp                     提交 RSVP(公开接口,不需要认证)
  Body: { invitationSlug, guestName, guestEmail, status, partySize, ... }
  Response: { data: { id, message: '提交成功' } }

GET    /api/invitations/:id/rsvps   获取某邀请函的所有 RSVP(需认证,仅创建者)
  Response: { data: RSVP[] }

GET    /api/invitations/:id/rsvps/export  导出为 CSV
```

#### 5.2.5 AI

```
POST   /api/ai/generate-copy         生成文案
  Body: { scene, style, eventInfo: { names, date, location, ... } }
  Response: { data: { variations: string[] } }

POST   /api/ai/recommend-templates   推荐模板
  Body: { description, scene }
  Response: { data: { templateIds: string[], reasons: string[] } }
```

#### 5.2.6 支付 (Payment)

```
POST   /api/payment/create-checkout  创建 Stripe Checkout Session
  Body: { purchaseType: 'single_publish', invitationId }
      | { purchaseType: 'lifetime', invitationId? }
  Response: { data: { checkoutUrl } }

POST   /api/payment/webhook          Stripe Webhook 回调(验证签名)
  
GET    /api/payment/history          用户支付历史
```

#### 5.2.7 渲染 (Render)

```
GET    /api/render/:slug             渲染 H5 邀请函(SSR)
  Response: HTML(带缓存)

POST   /api/render/:slug/invalidate  清除缓存(用户编辑后调用)
```

### 5.3 API 响应示例

#### 成功响应
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "John & Jane's Wedding",
    "status": "published",
    "slug": "jj-wedding-2026"
  }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "请先登录"
  }
}
```

#### 分页响应
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

## 六、编辑器技术方案

### 6.1 编辑器架构

```
┌──────────────────────────────────────────────────────────┐
│                     编辑器容器 (EditorPage)                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │  工具栏    │  │  画布区    │  │  属性面板  │          │
│  │ (Toolbar)  │  │ (Canvas)   │  │ (Inspector)│          │
│  │            │  │            │  │            │          │
│  │ - 撤销/重做│  │ Fabric.js  │  │ - 图层列表 │          │
│  │ - 保存     │  │  Canvas    │  │ - 属性编辑 │          │
│  │ - 预览     │  │            │  │ - 配色切换 │          │
│  │ - 发布     │  │            │  │            │          │
│  └────────────┘  └────────────┘  └────────────┘          │
│                        ↕                                   │
│                 Zustand Store                             │
│         (invitationState, history, selection)            │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Fabric.js 集成方案

#### 6.2.1 初始化画布

```typescript
// src/components/editor/Canvas.tsx
import { fabric } from 'fabric';
import { useEffect, useRef } from 'react';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 初始化 Fabric Canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 750,
      height: 1334,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    // 加载模板
    loadTemplate(canvas, templateData);

    return () => {
      canvas.dispose();
    };
  }, []);

  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} />
    </div>
  );
}
```

#### 6.2.2 模板 → Fabric 对象转换

```typescript
function loadTemplate(canvas: fabric.Canvas, template: Template) {
  // 1. 设置背景
  if (template.canvas.background.type === 'image') {
    fabric.Image.fromURL(template.canvas.background.url, (img) => {
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        scaleX: canvas.width! / img.width!,
        scaleY: canvas.height! / img.height!,
      });
    });
  } else if (template.canvas.background.type === 'video') {
    // 视频背景: 创建 HTML5 video 元素作为背景
    // 注意: Fabric.js 不原生支持视频,需要自定义渲染或用 HTML 叠加层
  }

  // 2. 遍历图层,创建 Fabric 对象
  template.layers.forEach((layer) => {
    let fabricObj: fabric.Object | null = null;

    switch (layer.type) {
      case 'text':
        fabricObj = new fabric.Textbox(layer.content.text, {
          left: layer.position.x,
          top: layer.position.y,
          width: layer.size.width,
          fontSize: layer.content.font.size,
          fontFamily: layer.content.font.family,
          fill: layer.content.color,
          textAlign: layer.content.align,
          // ... 其它属性
        });
        break;

      case 'image':
        fabric.Image.fromURL(layer.content.url, (img) => {
          img.set({
            left: layer.position.x,
            top: layer.position.y,
            scaleX: layer.size.width / img.width!,
            scaleY: layer.size.height / img.height!,
          });
          canvas.add(img);
        });
        break;

      case 'shape':
        if (layer.content.shape === 'rectangle') {
          fabricObj = new fabric.Rect({
            left: layer.position.x,
            top: layer.position.y,
            width: layer.size.width,
            height: layer.size.height,
            fill: layer.content.fill,
            stroke: layer.content.stroke?.color,
            strokeWidth: layer.content.stroke?.width,
          });
        }
        // ... 其它形状
        break;
    }

    if (fabricObj) {
      fabricObj.set({
        id: layer.id,
        selectable: !layer.locked,
        evented: !layer.locked,
      });
      canvas.add(fabricObj);
    }
  });

  canvas.renderAll();
}
```

#### 6.2.3 编辑操作

```typescript
// 文本编辑
canvas.on('text:editing:exited', (e) => {
  const textbox = e.target as fabric.Textbox;
  updateInvitationContent(textbox.id, { text: textbox.text });
});

// 图片替换
function replaceImage(layerId: string, newImageFile: File) {
  // 1. 上传到 S3
  const uploadedUrl = await uploadToS3(newImageFile);
  
  // 2. 找到对应的 Fabric 对象
  const obj = canvas.getObjects().find(o => o.id === layerId);
  if (obj && obj.type === 'image') {
    fabric.Image.fromURL(uploadedUrl, (img) => {
      obj.setElement(img.getElement());
      canvas.renderAll();
    });
  }
  
  // 3. 更新状态
  updateInvitationContent(layerId, { url: uploadedUrl });
}

// 拖拽移动
canvas.on('object:modified', (e) => {
  const obj = e.target;
  updateInvitationContent(obj.id, {
    position: { x: obj.left!, y: obj.top! },
    size: { width: obj.width! * obj.scaleX!, height: obj.height! * obj.scaleY! },
    rotation: obj.angle,
  });
});
```

### 6.3 状态管理(Zustand)

```typescript
// src/stores/editorStore.ts
import { create } from 'zustand';

interface EditorState {
  invitation: Invitation | null;
  template: Template | null;
  history: EditorHistory;
  selectedLayerId: string | null;
  
  // Actions
  loadInvitation: (invitation: Invitation) => void;
  updateLayer: (layerId: string, changes: Partial<Layer>) => void;
  undo: () => void;
  redo: () => void;
  selectLayer: (layerId: string) => void;
  saveInvitation: () => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  invitation: null,
  template: null,
  history: { past: [], future: [] },
  selectedLayerId: null,
  
  loadInvitation: (invitation) => {
    set({ invitation, template: invitation.template });
  },
  
  updateLayer: (layerId, changes) => {
    const { invitation } = get();
    if (!invitation) return;
    
    // 深拷贝 content
    const newContent = JSON.parse(JSON.stringify(invitation.content));
    const layer = newContent.layers.find(l => l.id === layerId);
    if (layer) {
      Object.assign(layer, changes);
    }
    
    // 推入历史栈
    set((state) => ({
      invitation: { ...invitation, content: newContent },
      history: {
        past: [...state.history.past, invitation.content],
        future: [],
      },
    }));
  },
  
  undo: () => {
    // 实现撤销逻辑
  },
  
  redo: () => {
    // 实现重做逻辑
  },
  
  saveInvitation: async () => {
    const { invitation } = get();
    if (!invitation) return;
    
    await fetch(`/api/invitations/${invitation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: invitation.content }),
    });
  },
}));
```

### 6.4 MVP 编辑器功能清单

**必须实现**:
- [x] 加载模板到画布
- [x] 文本图层可点击编辑
- [x] 图片图层可替换(点击上传)
- [x] 拖拽调整元素位置
- [x] 缩放/旋转元素
- [x] 图层面板(显示/隐藏/锁定)
- [x] 配色方案切换(一键应用)
- [x] 撤销/重做
- [x] 保存草稿
- [x] 实时预览(在画布右侧显示手机预览)

**Phase 2**:
- [ ] 从素材库拖入新元素
- [ ] 字体/字号/颜色选择器
- [ ] 图层分组
- [ ] 对齐/分布工具
- [ ] 导出为图片(PNG/JPG)

---

## 七、H5 渲染引擎

### 7.1 SSR 渲染流程

```typescript
// src/app/[locale]/i/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const invitation = await getInvitationBySlug(params.slug);
  return {
    title: invitation.title,
    description: `You're invited to ${invitation.title}`,
    openGraph: {
      images: [invitation.template.previewUrl],
    },
  };
}

export default async function InvitationPage({ params }) {
  const invitation = await getInvitationBySlug(params.slug);
  
  // 增加浏览量(异步,不阻塞渲染)
  incrementViewCount(invitation.id).catch(console.error);
  
  return (
    <InvitationRenderer 
      invitation={invitation}
      locale={params.locale}
    />
  );
}
```

### 7.2 渲染组件

```typescript
// src/components/invitation/InvitationRenderer.tsx
export function InvitationRenderer({ invitation }: { invitation: Invitation }) {
  const { canvas, layers, settings } = invitation.content;
  
  return (
    <div className="invitation-container" style={{
      width: canvas.width,
      maxWidth: '100vw',
      margin: '0 auto',
      position: 'relative',
    }}>
      {/* 背景 */}
      <Background config={canvas.background} />
      
      {/* 图层 */}
      <div className="layers">
        {layers.map((layer) => (
          <LayerRenderer key={layer.id} layer={layer} />
        ))}
      </div>
      
      {/* 背景音乐 */}
      {settings.musicUrl && <BackgroundMusic url={settings.musicUrl} />}
      
      {/* RSVP 表单 */}
      {settings.rsvpEnabled && (
        <RSVPForm invitationSlug={invitation.slug} />
      )}
      
      {/* 倒计时 */}
      {settings.showCountdown && invitation.eventDate && (
        <Countdown targetDate={invitation.eventDate} />
      )}
    </div>
  );
}

// 背景组件
function Background({ config }: { config: BackgroundConfig }) {
  if (config.type === 'image') {
    return <img src={config.url} alt="" className="bg-cover" />;
  }
  
  if (config.type === 'video') {
    return (
      <video 
        autoPlay 
        loop 
        muted={config.muted} 
        playsInline
        poster={config.poster}
        className="bg-video"
      >
        <source src={config.url} type="video/mp4" />
      </video>
    );
  }
  
  if (config.type === 'html') {
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: config.html }} />
        {config.css && <style>{config.css}</style>}
      </>
    );
  }
  
  // color / gradient
  return <div style={{ background: config.value }} className="bg-fill" />;
}

// 图层渲染
function LayerRenderer({ layer }: { layer: Layer }) {
  const style = {
    position: 'absolute' as const,
    left: layer.position.x,
    top: layer.position.y,
    width: layer.size.width,
    height: layer.size.height,
    transform: `rotate(${layer.rotation || 0}deg)`,
    opacity: layer.opacity ?? 1,
    zIndex: layer.zIndex,
    display: layer.visible === false ? 'none' : 'block',
  };
  
  if (layer.type === 'text') {
    return (
      <div style={{
        ...style,
        fontFamily: layer.content.font.family,
        fontSize: layer.content.font.size,
        fontWeight: layer.content.font.weight,
        color: layer.content.color,
        textAlign: layer.content.align,
      }}>
        {layer.content.text}
      </div>
    );
  }
  
  if (layer.type === 'image') {
    return (
      <img 
        src={layer.content.url} 
        alt={layer.name}
        style={{
          ...style,
          objectFit: layer.content.fit,
          borderRadius: layer.content.borderRadius,
        }}
      />
    );
  }
  
  // ... 其它类型
  return null;
}
```

### 7.3 RSVP 表单

```typescript
// src/components/invitation/RSVPForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const rsvpSchema = z.object({
  guestName: z.string().min(1, '请输入姓名'),
  guestEmail: z.string().email('请输入有效邮箱').optional(),
  guestPhone: z.string().optional(),
  status: z.enum(['attending', 'declined', 'maybe']),
  partySize: z.number().min(1).max(20),
  dietaryPreferences: z.string().optional(),
  message: z.string().max(500).optional(),
});

type RSVPFormData = z.infer<typeof rsvpSchema>;

export function RSVPForm({ invitationSlug }: { invitationSlug: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RSVPFormData>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      status: 'attending',
      partySize: 1,
    },
  });
  
  const [submitted, setSubmitted] = useState(false);
  
  const onSubmit = async (data: RSVPFormData) => {
    const response = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, invitationSlug }),
    });
    
    if (response.ok) {
      setSubmitted(true);
    }
  };
  
  if (submitted) {
    return (
      <div className="rsvp-success">
        <h3>提交成功!</h3>
        <p>感谢您的回复,期待与您相见。</p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rsvp-form">
      <h2>回执</h2>
      
      <input {...register('guestName')} placeholder="姓名 *" />
      {errors.guestName && <p className="error">{errors.guestName.message}</p>}
      
      <input {...register('guestEmail')} type="email" placeholder="邮箱" />
      <input {...register('guestPhone')} type="tel" placeholder="手机" />
      
      <div className="radio-group">
        <label>
          <input type="radio" {...register('status')} value="attending" />
          参加
        </label>
        <label>
          <input type="radio" {...register('status')} value="declined" />
          不参加
        </label>
        <label>
          <input type="radio" {...register('status')} value="maybe" />
          待定
        </label>
      </div>
      
      <input {...register('partySize', { valueAsNumber: true })} type="number" placeholder="人数" />
      
      <textarea {...register('dietaryPreferences')} placeholder="饮食偏好(可选)" />
      <textarea {...register('message')} placeholder="留言祝福(可选)" maxLength={500} />
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '提交中...' : '提交回执'}
      </button>
    </form>
  );
}
```

### 7.4 缓存策略

```typescript
// src/app/[locale]/i/[slug]/page.tsx

// Next.js 15 缓存配置
export const revalidate = 3600; // 1 小时重新验证

// 或者用 Redis 缓存
import { redis } from '@/lib/redis';

async function getInvitationBySlug(slug: string) {
  const cacheKey = `invitation:${slug}`;
  
  // 先查缓存
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 查数据库
  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    include: { template: true },
  });
  
  if (!invitation) {
    throw new Error('Invitation not found');
  }
  
  // 写入缓存(TTL 1小时)
  await redis.setex(cacheKey, 3600, JSON.stringify(invitation));
  
  return invitation;
}

// 清除缓存(用户编辑后调用)
export async function invalidateInvitationCache(slug: string) {
  await redis.del(`invitation:${slug}`);
}
```

---

## 八、AI 能力设计

### 8.1 文案生成

```typescript
// src/lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateInvitationCopy(params: {
  scene: string;
  style: string;
  eventInfo: {
    names: string[];      // ["张三", "李四"]
    date: string;
    location: string;
    description?: string; // 用户额外描述
  };
  locale: string;
}) {
  const prompt = buildPrompt(params);
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: getSystemPrompt(params.scene, params.locale) },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 500,
    n: 3,  // 生成 3 个变体
  });
  
  return completion.choices.map(c => c.message.content);
}

function getSystemPrompt(scene: string, locale: string): string {
  const prompts = {
    wedding: {
      'zh-CN': '你是一位专业的婚礼请柬文案撰写专家。请用温馨、浪漫、真挚的语言撰写邀请函正文。避免陈词滥调,要有温度和个性。',
      'en': 'You are a professional wedding invitation copywriter. Write warm, romantic, and heartfelt invitation text. Avoid clichés and be personal.',
    },
    birthday: {
      'zh-CN': '你是一位创意生日派对策划师。请用活泼、有趣的语言撰写生日邀请函。',
      'en': 'You are a creative birthday party planner. Write lively and fun birthday invitation text.',
    },
    // ... 其它场景
  };
  
  return prompts[scene]?.[locale] || prompts[scene]?.['en'] || '';
}

function buildPrompt(params): string {
  const { scene, eventInfo, locale } = params;
  
  if (scene === 'wedding') {
    return `
活动信息:
- 新郎新娘: ${eventInfo.names.join(' & ')}
- 时间: ${eventInfo.date}
- 地点: ${eventInfo.location}
${eventInfo.description ? `- 补充: ${eventInfo.description}` : ''}

请生成 3 条不同风格的婚礼邀请正文(每条 80-120 字):
1. 温馨浪漫风格
2. 诙谐幽默风格
3. 简洁大方风格

要求: ${locale === 'zh-CN' ? '中文' : 'English'},符合文化习俗,有真情实感,不要套话。
    `.trim();
  }
  
  // ... 其它场景
  return '';
}
```

### 8.2 模板推荐

```typescript
// 方案 A: 简单规则匹配(MVP 推荐)
export function recommendTemplatesByRules(params: {
  scene: string;
  description?: string;
  style?: string;
}): string[] {
  // 根据场景筛选
  let candidates = templates.filter(t => t.scene === params.scene);
  
  // 如果用户提到特定风格词(如"简约"、"复古"),优先推荐
  if (params.description) {
    const keywords = extractKeywords(params.description);
    candidates = candidates.sort((a, b) => {
      const scoreA = a.tags.filter(tag => keywords.includes(tag)).length;
      const scoreB = b.tags.filter(tag => keywords.includes(tag)).length;
      return scoreB - scoreA;
    });
  }
  
  // 返回 Top 3
  return candidates.slice(0, 3).map(t => t.id);
}

// 方案 B: Embedding 向量搜索(Phase 2)
export async function recommendTemplatesByEmbedding(description: string): Promise<string[]> {
  // 1. 用户描述 → Embedding
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: description,
  });
  
  // 2. 在向量数据库中搜索(Pinecone / PostgreSQL pgvector)
  const results = await vectorDB.query({
    vector: queryEmbedding.data[0].embedding,
    topK: 5,
    filter: { scene: 'wedding' },
  });
  
  return results.matches.map(m => m.id);
}
```

### 8.3 降级策略

```typescript
// src/lib/ai-fallback.ts
const fallbackCopies = {
  wedding: {
    'zh-CN': [
      '我们诚挚邀请您参加我们的婚礼,共同见证我们的幸福时刻。',
      '爱情长跑多年,今日终于修成正果。诚邀您莅临,分享我们的喜悦!',
      '执子之手,与子偕老。我们将在{date}举行婚礼,期待您的到来。',
    ],
    'en': [
      'We joyfully invite you to celebrate our wedding and share in our happiness.',
      'After years of love, we are finally tying the knot. Please join us on our special day!',
      'Together with our families, we invite you to our wedding celebration.',
    ],
  },
  // ... 其它场景
};

export function getFallbackCopy(scene: string, locale: string): string[] {
  return fallbackCopies[scene]?.[locale] || fallbackCopies[scene]?.['en'] || [];
}
```

---

## 九、国际化与 SEO

### 9.1 next-intl 配置

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'zh-CN'],
  defaultLocale: 'en',
  localePrefix: 'always',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

```typescript
// messages/en.json
{
  "common": {
    "create": "Create",
    "edit": "Edit",
    "delete": "Delete",
    "save": "Save"
  },
  "home": {
    "title": "Create Beautiful Invitations with AI",
    "subtitle": "Design stunning digital invites in minutes. No design skills needed.",
    "cta": "Get Started Free"
  },
  "editor": {
    "toolbar": {
      "undo": "Undo",
      "redo": "Redo",
      "preview": "Preview",
      "publish": "Publish"
    }
  }
}
```

```typescript
// messages/zh-CN.json
{
  "common": {
    "create": "创建",
    "edit": "编辑",
    "delete": "删除",
    "save": "保存"
  },
  "home": {
    "title": "用 AI 创建精美邀请函",
    "subtitle": "几分钟内设计出惊艳的电子请柬,无需设计技能。",
    "cta": "免费开始"
  }
}
```

### 9.2 SEO 元数据

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';

export function generateMetadata({ params: { locale } }) {
  return {
    title: {
      template: '%s | Carte',
      default: 'Carte - AI-Powered Invitation Generator',
    },
    description: 'Create stunning wedding, birthday, and event invitations with AI. Share instantly via link.',
    keywords: ['invitation maker', 'wedding invitations', 'digital invites', 'AI invitation'],
    openGraph: {
      type: 'website',
      locale: locale,
      url: 'https://carte.app',
      siteName: 'Carte',
    },
  };
}
```

```typescript
// src/app/[locale]/templates/[scene]/page.tsx
export async function generateMetadata({ params: { scene, locale } }) {
  const sceneNames = {
    wedding: { en: 'Wedding', 'zh-CN': '婚礼' },
    birthday: { en: 'Birthday', 'zh-CN': '生日' },
  };
  
  const sceneName = sceneNames[scene]?.[locale] || scene;
  
  return {
    title: `${sceneName} Invitation Templates`,
    description: `Browse our collection of beautiful ${sceneName.toLowerCase()} invitation templates. AI-powered and fully customizable.`,
  };
}
```

### 9.3 Sitemap 生成

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://carte.app';
  const locales = ['en', 'zh-CN'];
  
  // 静态页面
  const staticPages = ['', '/templates', '/pricing', '/about'].flatMap(path =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.8,
    }))
  );
  
  // 模板页面
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    select: { id: true, scene: true, updatedAt: true },
  });
  
  const templatePages = templates.flatMap(t =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}/templates/${t.scene}/${t.id}`,
      lastModified: t.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  );
  
  return [...staticPages, ...templatePages];
}
```

---

## 十、支付集成

### 10.1 Stripe Checkout 流程

```typescript
// src/lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// 创建 Checkout Session
export async function createCheckoutSession(params: {
  userId: string;
  purchaseType: 'single_publish' | 'lifetime';
  invitationId?: string;
  priceId: string;  // 服务端根据 purchaseType 选择,不接受任意客户端 Price ID
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,  // 从 Stripe Dashboard 创建的 Price ID
        quantity: 1,
      },
    ],
    metadata: {
      userId: params.userId,
      purchaseType: params.purchaseType,
      ...(params.invitationId ? { invitationId: params.invitationId } : {}),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    automatic_tax: { enabled: true },  // 自动计算税费
  });
  
  return session;
}
```

```typescript
// src/app/api/payment/create-checkout/route.ts
import { auth } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { invitationId, priceId } = await req.json();
  
  const checkoutSession = await createCheckoutSession({
    userId: session.user.id,
    invitationId,
    priceId,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/editor/${invitationId}?payment=cancelled`,
  });
  
  return Response.json({ checkoutUrl: checkoutSession.url });
}
```

### 10.2 Webhook 处理

```typescript
// src/app/api/payment/webhook/route.ts
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  // 处理事件
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
      
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;
  }
  
  return Response.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, invitationId, purchaseType } = session.metadata!;
  
  // 1. 创建支付记录
  await prisma.payment.create({
    data: {
      userId,
      invitationId,
      purchaseType,
      amountCents: session.amount_total!,
      currency: session.currency!.toUpperCase(),
      paymentProvider: 'stripe',
      providerPaymentId: session.payment_intent as string,
      status: 'succeeded',
    },
  });
  
  // 2. single_publish 直接发布关联邀请函;
  //    lifetime 为用户写入终身权益,并在有关联邀请函时计入当日额度后发布。
  //    每日额度在数据库事务中原子更新,上限为每个 UTC 自然日 10 次。
  
  // 3. 清除缓存(如果之前有预览缓存)
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { slug: true },
  });
  if (invitation) {
    await invalidateInvitationCache(invitation.slug);
  }
  
  // 4. 发送确认邮件(可选)
  // await sendPublishedEmail(userId, invitationId);
}
```

### 10.3 价格配置

在 Stripe Dashboard 创建 Products 和 Prices:

```
Product: Single Invitation
- Price ID: price_single_usd
- Amount: $9.90 USD
- Billing: One-time

Product: Lifetime Access
- Price ID: price_lifetime_usd
- Amount: $299.00 USD
- Billing: One-time
```

终身权益规则:
- 支付成功后立即生效,不设置到期时间。
- 每个 UTC 自然日最多发布 10 份此前未发布的邀请函。
- 编辑或重新保存已经发布的邀请函不占用每日额度。
- 每日计数必须通过数据库事务原子更新,防止并发绕过上限。
- 本阶段不自动处理退款后的权益撤销,退款流程上线前另行定义。

---

## 十、开发路线图与验收标准

### Phase 1: MVP 核心功能 (6-8 周)

#### Week 1-2: 基础搭建 + 场景选择(v2.1 调整)

**任务**:
- [ ] Next.js 15 + TypeScript 项目初始化
- [ ] Tailwind CSS + shadcn/ui 配置(严格遵循 design-guidelines.md)
- [ ] Prisma + PostgreSQL 连接
- [ ] Redis 连接
- [ ] Auth.js 认证(邮箱登录 + Google OAuth)
- [ ] 基础 UI 组件库(shadcn/ui: Button/Input/Card/Dialog)
- [ ] **场景选择页(/create)** - v2.1 新增
- [ ] **Session ID 管理(Cookie)** - v2.1 新增
- [ ] **guest_drafts 表** - v2.1 新增

**验收标准**:
- ✅ 首页 CTA 指向 /create(不是 /login)
- ✅ 场景选择页显示 4 个场景卡片(Wedding/Birthday/Business/Other)
- ✅ 点击场景跳转到 /templates?scene=wedding
- ✅ 未登录用户可以访问所有页面(除 Dashboard)
- ✅ Session ID 自动生成并存储到 Cookie(7 天有效期)
- ✅ 用户可以通过邮箱 + 验证码登录
- ✅ 用户可以通过 Google 账号登录
- ✅ 登录后可以看到 Dashboard 页面(空状态)
- ✅ 所有 UI 组件使用 shadcn/ui(禁用原生 alert/button)
- ✅ 所有页面响应式适配(320px - 1920px)
- ✅ Lighthouse 性能分数 ≥ 90

**交付物**:
- 代码仓库(Git)
- 本地开发环境(Docker Compose)
- README.md(本地运行指南)
- feature-supplement.md 实现确认

---

#### Week 3-4: 模板系统

**任务**:
- [ ] 设计 3 个 demo 模板(婚礼/生日/商务,各 1 个)
- [ ] 模板 JSON Schema 定义
- [ ] 模板数据导入脚本
- [ ] 模板列表页(GET /api/templates)
- [ ] 模板详情页(GET /api/templates/:id)
- [ ] 模板筛选(按场景/风格)

**验收标准**:
- ✅ 3 个 demo 模板在数据库中
- ✅ 模板列表页显示缩略图网格
- ✅ 点击模板可查看大图预览
- ✅ 筛选功能正常(按场景下拉)
- ✅ 模板加载速度 < 1 秒

**交付物**:
- 3 个模板 JSON 文件
- 模板素材(图片/视频)上传到对象存储
- 模板列表页面截图

---

#### Week 5-6: 编辑器(简化版,v2.1 支持未登录)

**任务**:
- [ ] Fabric.js 集成
- [ ] 模板加载到画布
- [ ] 文本图层点击编辑
- [ ] 图片图层上传替换
- [ ] 图层拖拽调整位置
- [ ] 图层缩放/旋转
- [ ] 配色方案切换
- [ ] 图层面板(显示/隐藏/锁定)
- [ ] 撤销/重做
- [ ] **未登录用户草稿保存** - v2.1 新增
  - 前端: localStorage 自动保存
  - 后端: guest_drafts 表同步(POST /api/invitations, PATCH /api/invitations/:id)
- [ ] **页面顶部提示条** - v2.1 新增
  - 未登录: "未登录,草稿将保存 7 天"
  - 已登录: 自动保存进度

**验收标准**:
- ✅ 未登录用户可以选择模板并进入编辑器
- ✅ 未登录用户编辑时数据自动保存到 guest_drafts 表
- ✅ 刷新页面后编辑内容不丢失
- ✅ 可以双击文本修改内容
- ✅ 可以点击图片上传新图(支持 JPG/PNG,最大 5MB)
- ✅ 可以拖拽元素调整位置
- ✅ 配色切换一键应用(至少 3 种配色)
- ✅ 撤销/重做正常工作
- ✅ 点击"发布"时:
  - 未登录 → 跳转到 /login?continue=/editor/[id]?action=publish
  - 已登录 → 直接进入支付流程
- ✅ 编辑器操作流畅(60fps)

**交付物**:
- 编辑器页面
- 未登录用户流程演示视频(3 分钟)
- 已登录用户流程演示视频(2 分钟)

---

#### Week 7: AI 集成

**任务**:
- [ ] OpenAI API 集成
- [ ] 文案生成功能(POST /api/ai/generate-copy)
- [ ] 模板推荐(简单规则匹配)
- [ ] AI 降级策略(预设文案)
- [ ] AI 生成历史记录

**验收标准**:
- ✅ 用户填写活动信息后,可以点击"AI 生成文案"
- ✅ 返回 3 条不同风格的文案备选
- ✅ 用户可以选择一条应用到邀请函
- ✅ AI 超时/失败时返回预设文案(不中断流程)
- ✅ AI 调用成本 < $0.001/次

**交付物**:
- AI 文案生成功能演示
- 成本统计(tokens used)

---

#### Week 8: H5 生成与支付(v2.1 加入数据迁移)

**任务**:
- [ ] H5 邀请函 SSR 渲染(GET /[locale]/i/[slug])
- [ ] RSVP 表单(POST /api/rsvp)
- [ ] **访客数据迁移** - v2.1 新增
  - POST /api/auth/migrate-guest-data
  - 登录成功后自动调用
  - 将 guest_drafts 迁移到 invitations 表
- [ ] Stripe 支付集成(POST /api/payment/create-checkout)
- [ ] Stripe Webhook 处理(POST /api/payment/webhook)
- [ ] 支付成功 → 发布流程
- [ ] 分享页(复制链接/生成二维码)

**验收标准**:
- ✅ 未登录用户点击"发布"后跳转到登录页
- ✅ 登录成功后自动返回编辑器页面(continue 参数)
- ✅ 登录后访客草稿自动迁移到用户账户
- ✅ 用户点击"发布"后跳转到 Stripe Checkout
- ✅ 支付成功后跳转回 Dashboard,看到"已发布"状态
- ✅ H5 邀请函可以通过短链接访问(carte.app/i/abc123)
- ✅ H5 页面移动端展示正常(iOS Safari + Android Chrome)
- ✅ 宾客可以提交 RSVP(姓名/邮箱/状态/人数)
- ✅ RSVP 数据在 Dashboard 中可查看
- ✅ 分享页显示短链接 + 二维码
- ✅ H5 首屏加载时间 < 2 秒

**交付物**:
- 完整的支付 → 发布 → 分享流程演示
- 未登录用户 → 登录 → 数据迁移流程演示
- 移动端截图(iOS + Android)

---

#### Week 8+: 测试与上线

**任务**:
- [ ] 端到端测试(Playwright,关键流程)
  - 未登录用户创建邀请函流程 - v2.1 新增
  - 登录后数据迁移流程 - v2.1 新增
- [ ] **定时清理任务** - v2.1 新增
  - 每小时清理过期的 guest_drafts(expires_at < NOW())
- [ ] 性能优化(Lighthouse 90+)
- [ ] SEO 基础(sitemap/meta 标签)
- [ ] 错误监控(Sentry 可选)
- [ ] 部署到生产环境(Docker + Nginx)
- [ ] 域名配置(carte.app)
- [ ] SSL 证书
- [ ] 备份策略(数据库每日备份)

**验收标准**:
- ✅ 所有关键流程有 E2E 测试覆盖(包括未登录流程)
- ✅ 定时任务正常运行(guest_drafts 自动清理)
- ✅ Lighthouse 分数: Performance 90+, Accessibility 95+, SEO 95+
- ✅ 生产环境可访问(carte.app)
- ✅ HTTPS 正常
- ✅ sitemap.xml 可访问
- ✅ 错误日志可查看
- ✅ 数据库有自动备份

**交付物**:
- 生产环境 URL
- 测试报告(包括未登录用户测试)
- 部署文档

---

### Phase 2: 增强功能 (4-6 周,MVP 后迭代)

**功能清单**:
- [ ] 用户 Dashboard 增强
  - RSVP 数据导出 CSV
  - 统计卡片(总数/已发布/RSVP/浏览量)
  - 邀请函筛选与搜索
- [ ] **批量邮件发送** - v2.1 新增(已登录用户专享)
  - 邮件发送对话框
  - 收件人列表输入
  - 发送状态追踪
  - 打开/点击追踪(可选)
- [ ] 多语言支持(next-intl,中英文切换)
- [ ] 终身买断($299,每天最多发布10次)
- [ ] 高级编辑器(字体选择器/颜色选择器)
- [ ] 照片画廊(H5 上传多张照片)
- [ ] 访问统计(浏览量/转化率)
- [ ] RSVP 邮件通知(提醒发给创建者)
- [ ] 更多模板(每个场景至少 10 个,本轮计划最后开发)

---

## 十一、测试策略

### 11.1 单元测试

```typescript
// src/lib/__tests__/template.test.ts
import { describe, it, expect } from 'vitest';
import { loadTemplate } from '@/lib/template';

describe('Template Loading', () => {
  it('should load template from JSON', async () => {
    const template = await loadTemplate('demo-wedding-01');
    expect(template).toBeDefined();
    expect(template.scene).toBe('wedding');
    expect(template.layers).toBeInstanceOf(Array);
  });
  
  it('should validate template structure', () => {
    const invalidTemplate = { name: 'test' }; // 缺少必填字段
    expect(() => validateTemplate(invalidTemplate)).toThrow();
  });
});
```

### 11.2 集成测试(API)

```typescript
// src/app/api/__tests__/invitations.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { POST, GET } from '../invitations/route';

describe('Invitations API', () => {
  let userId: string;
  
  beforeAll(async () => {
    // 创建测试用户
    userId = await createTestUser();
  });
  
  it('POST /api/invitations - creates invitation', async () => {
    const req = new Request('http://localhost/api/invitations', {
      method: 'POST',
      body: JSON.stringify({
        scene: 'wedding',
        title: 'Test Wedding',
        templateId: 'demo-wedding-01',
      }),
    });
    
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.slug).toBeDefined();
  });
});
```

### 11.3 E2E 测试(Playwright)

```typescript
// tests/e2e/create-invitation.spec.ts
import { test, expect } from '@playwright/test';

test('完整创建邀请函流程', async ({ page }) => {
  // 1. 登录
  await page.goto('/');
  await page.click('text=Login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.click('text=Send Code');
  // ... 填验证码
  
  // 2. 选择场景
  await page.click('text=Wedding');
  
  // 3. 填写信息
  await page.fill('input[name="bride_name"]', 'Jane');
  await page.fill('input[name="groom_name"]', 'John');
  await page.click('text=Next');
  
  // 4. 选择模板
  await page.click('.template-card:first-child');
  
  // 5. 编辑内容
  await page.dblclick('text=我们结婚啦');
  await page.keyboard.type('John & Jane');
  await page.click('text=Save');
  
  // 6. 发布(跳过支付,用测试模式)
  await page.click('text=Publish');
  
  // 7. 验证分享页
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator('text=Published')).toBeVisible();
});
```

---

## 十二、部署方案

### 12.1 Docker 化

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# 依赖阶段
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# 生产阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml(生产环境)
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/carte
      REDIS_URL: redis://redis:6379
      NEXTAUTH_URL: https://carte.app
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      S3_BUCKET: carte-assets
      S3_REGION: us-east-1
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: carte
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### 12.2 Nginx 配置

```nginx
# nginx.conf
upstream nextjs {
    server app:3000;
}

server {
    listen 80;
    server_name carte.app;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name carte.app;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static {
        proxy_pass http://nextjs;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, immutable";
    }

    location /api {
        proxy_pass http://nextjs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 12.3 CI/CD(GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker Image
        run: |
          docker build -t carte:latest .
      
      - name: Push to Registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag carte:latest ${{ secrets.DOCKER_REGISTRY }}/carte:latest
          docker push ${{ secrets.DOCKER_REGISTRY }}/carte:latest
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/carte
            docker-compose pull
            docker-compose up -d
            docker-compose exec -T app npx prisma migrate deploy
```

---

## 十三、开发指引(给 Codex)

### 13.1 开发环境要求

**必需软件**:
- Node.js 20.x LTS
- PostgreSQL 15+
- Redis 7+
- Git

**推荐工具**:
- VS Code + Prettier + ESLint
- Docker Desktop(用于本地数据库)
- Postman / Insomnia(API 测试)

### 13.2 项目初始化步骤

```bash
# 1. 创建 Next.js 项目
npx create-next-app@latest carte --typescript --tailwind --app --use-npm

cd carte

# 2. 安装依赖
npm install @prisma/client prisma
npm install next-auth@beta
npm install stripe
npm install openai
npm install fabric
npm install zustand
npm install react-hook-form zod @hookform/resolvers/zod
npm install next-intl
npm install @aws-sdk/client-s3
npm install resend
npm install redis

npm install -D @types/fabric
npm install -D playwright

# 3. 初始化 Prisma
npx prisma init

# 4. 复制本文档中的 Prisma Schema 到 prisma/schema.prisma

# 5. 创建 .env.local(参考 .env.example)

# 6. 运行迁移
npx prisma migrate dev --name init

# 7. 启动开发服务器
npm run dev
```

### 13.3 环境变量清单(.env.example)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/carte?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"

# OAuth Providers(可选)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_SINGLE="price_..."
STRIPE_PRICE_ID_LIFETIME="price_..."

# OpenAI
OPENAI_API_KEY="sk-..."

# S3-Compatible Storage
S3_BUCKET="carte-assets"
S3_REGION="us-east-1"
S3_ENDPOINT="" # 可选,用于 Cloudflare R2 / Minio
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""

# Email
RESEND_API_KEY=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 13.4 开发顺序建议

严格按照 **第十二章(开发路线图与验收标准)** 中的 Week 1-8 顺序开发:

**Week 1-2**: 基础搭建(认证 + UI 组件库)  
**Week 3-4**: 模板系统(3 个 demo 模板)  
**Week 5-6**: 编辑器(Fabric.js 集成)  
**Week 7**: AI 集成  
**Week 8**: H5 生成 + 支付  
**Week 8+**: 测试与部署准备

每周完成后,对照文档中的 ✅ 验收标准逐项检查。

### 13.5 代码规范

**TypeScript 严格模式**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true
  }
}
```

**文件命名**:
- React 组件: PascalCase (Button.tsx)
- 工具函数: camelCase (formatDate.ts)
- API Routes: kebab-case (create-checkout.ts)

**导入顺序**:
```typescript
// 1. React / Next.js
import { useState } from 'react';
import Link from 'next/link';

// 2. 第三方库
import { z } from 'zod';
import { fabric } from 'fabric';

// 3. 内部模块(使用 @ alias)
import { Button } from '@/components/ui/Button';
import { prisma } from '@/lib/prisma';
import type { Template } from '@/types/template';

// 4. 样式
import './styles.css';
```

**注释规范**:
- 复杂逻辑必须注释
- 公开 API 必须有 JSDoc
- 临时 hack 必须标注 `// TODO: ` 或 `// FIXME: `

### 13.6 Git 提交规范

使用 Conventional Commits:

```
feat: 添加模板列表页
fix: 修复编辑器图层拖拽 bug
docs: 更新 API 文档
style: 格式化代码
refactor: 重构 AI 文案生成逻辑
test: 添加 RSVP API 测试
chore: 升级依赖
```

**分支策略**:
- `main`: 稳定版本
- `dev`: 开发分支
- `feat/xxx`: 功能分支
- `fix/xxx`: 修复分支

### 13.7 关键技术注意事项

**1. Fabric.js 与 React**:
- Fabric Canvas 只在客户端运行,需要 `'use client'`
- 使用 `useRef` 持有 Canvas 实例
- 清理: `useEffect` 返回 `() => canvas.dispose()`

**2. Next.js 15 App Router**:
- 服务端组件是默认的,需要交互用 `'use client'`
- `async` 组件是服务端组件,可以直接查数据库
- API Routes 在 `app/api/` 目录,使用 Route Handlers

**3. Prisma**:
- 每次修改 schema 后运行 `npx prisma migrate dev`
- 生产环境用 `npx prisma migrate deploy`
- 开发时用 Prisma Studio: `npx prisma studio`

**4. Stripe Webhook**:
- 本地测试用 Stripe CLI: `stripe listen --forward-to localhost:3000/api/payment/webhook`
- 生产环境在 Stripe Dashboard 配置 Webhook URL
- 必须验证签名: `stripe.webhooks.constructEvent()`

**5. 国际化(next-intl)**:
- 默认语言: `en`
- 支持语言: `['en', 'zh-CN']`
- 优先完善英文翻译,中文作为第二语言

**6. 对象存储**:
- 用户上传的图片先压缩(max 1MB)
- 生成唯一文件名(UUID + 时间戳)
- 设置正确的 Content-Type 和缓存头

### 13.8 常见问题排查

**问题**: Prisma Client 报错 "No Prisma Client found"
**解决**: 运行 `npx prisma generate`

**问题**: Fabric.js 在 SSR 时报错 "document is not defined"
**解决**: 组件标记 `'use client'`,Canvas 在 `useEffect` 中初始化

**问题**: Stripe Webhook 本地测试收不到事件
**解决**: 
1. 检查 Stripe CLI 是否运行: `stripe listen`
2. 检查 webhook secret 是否正确
3. 用 ngrok 暴露本地端口: `ngrok http 3000`

**问题**: Redis 连接失败
**解决**: 
1. 检查 Redis 是否启动: `redis-cli ping`
2. 检查 REDIS_URL 环境变量

**问题**: 图片上传后 H5 页面显示不出来
**解决**:
1. 检查 S3 Bucket CORS 配置
2. 检查图片 URL 是否可公开访问
3. 检查浏览器控制台是否有跨域错误

---

## 十四、验收清单(给产品 Owner)

### 14.1 功能完整性验收

#### Phase 1 - MVP 核心功能

**认证系统**:
- [ ] 用户可以通过邮箱 + 验证码注册/登录
- [ ] 用户可以通过 Google OAuth 登录
- [ ] 登录状态持久化(刷新页面不丢失)
- [ ] 登出功能正常

**模板系统**:
- [ ] 数据库中有 3 个 demo 模板(婚礼/生日/商务各 1 个)
- [ ] 模板列表页显示缩略图网格
- [ ] 可以按场景筛选模板
- [ ] 点击模板可查看大图预览
- [ ] 每个模板都有完整的元数据(name/scene/style/tags)

**编辑器**:
- [ ] 选择模板后进入编辑器
- [ ] 画布正确加载模板内容(背景 + 所有图层)
- [ ] 可以双击文本图层编辑内容
- [ ] 可以点击图片图层上传替换(支持 JPG/PNG,最大 5MB)
- [ ] 可以拖拽元素调整位置
- [ ] 可以缩放/旋转元素
- [ ] 图层面板显示所有图层,可切换显示/隐藏
- [ ] 配色方案切换功能正常(至少 3 种配色)
- [ ] 撤销/重做功能正常(支持至少 20 步历史)
- [ ] 点击"保存"后数据持久化(刷新页面后编辑内容保留)
- [ ] 实时预览正常(右侧手机预览窗口)

**AI 功能**:
- [ ] 用户填写活动信息后可以生成文案
- [ ] AI 返回 3 条不同风格的文案备选
- [ ] 用户可以选择一条文案应用到邀请函
- [ ] AI 超时/失败时有降级策略(返回预设文案)
- [ ] AI 调用成本 < $0.001/次

**H5 邀请函**:
- [ ] 编辑完成后可以点击"发布"
- [ ] 发布前跳转到 Stripe 支付页面
- [ ] 支付成功后跳转回 Dashboard,状态显示"已发布"
- [ ] 生成的短链接可访问(格式: /i/{slug})
- [ ] H5 页面在移动端显示正常(iOS Safari + Android Chrome 测试)
- [ ] H5 页面响应式布局正确(320px - 1920px)
- [ ] 背景显示正确(图片/视频/HTML 三种类型都要测试)
- [ ] 所有图层按正确顺序渲染
- [ ] 文字、图片、颜色与编辑器预览一致

**RSVP 功能**:
- [ ] H5 页面底部显示 RSVP 表单
- [ ] 表单包含: 姓名/邮箱/状态/人数/饮食偏好/留言
- [ ] 表单验证正常(姓名必填、邮箱格式校验)
- [ ] 提交成功后显示确认消息
- [ ] RSVP 数据保存到数据库
- [ ] Dashboard 中可以查看 RSVP 列表
- [ ] RSVP 数据可以导出为 CSV

**支付功能**:
- [ ] Stripe Checkout 页面正常加载
- [ ] 测试模式下可以用测试卡号完成支付
- [ ] 支付成功后 Webhook 触发
- [ ] 邀请函状态更新为"已发布"
- [ ] 支付记录保存到数据库
- [ ] Dashboard 显示支付历史

**Dashboard**:
- [ ] 显示用户的所有邀请函(卡片网格)
- [ ] 可以按状态筛选(草稿/已发布)
- [ ] 可以按场景筛选
- [ ] 点击"编辑"可以重新进入编辑器
- [ ] 点击"查看数据"可以看到 RSVP 统计
- [ ] 点击"复制"可以克隆邀请函
- [ ] 点击"删除"可以删除邀请函(需确认)

**分享功能**:
- [ ] 发布后显示分享页
- [ ] 分享页显示短链接(可一键复制)
- [ ] 分享页显示二维码(可下载)
- [ ] 链接可以直接分享到社交媒体(Open Graph 标签正确)

### 14.2 性能验收

- [ ] 首页 Lighthouse 性能分数 ≥ 90
- [ ] 编辑器页面 Lighthouse 性能分数 ≥ 85
- [ ] H5 页面 Lighthouse 性能分数 ≥ 90
- [ ] H5 页面首屏加载时间 < 2 秒(4G 网络)
- [ ] 编辑器操作流畅(拖拽/缩放无明显卡顿)
- [ ] 图片上传响应时间 < 3 秒(1MB 图片)

### 14.3 兼容性验收

**浏览器**:
- [ ] Chrome 最新版
- [ ] Safari 最新版(macOS + iOS)
- [ ] Firefox 最新版
- [ ] Edge 最新版

**移动设备**(H5 邀请函):
- [ ] iPhone (iOS Safari)
- [ ] Android 手机(Chrome)
- [ ] iPad(横屏 + 竖屏)

**屏幕尺寸**:
- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone 12/13)
- [ ] 768px (iPad 竖屏)
- [ ] 1024px (iPad 横屏)
- [ ] 1920px (桌面)

### 14.4 安全性验收

- [ ] 未登录用户无法访问 Dashboard
- [ ] 用户只能编辑自己的邀请函
- [ ] 用户只能查看自己的 RSVP 数据
- [ ] API 端点有适当的鉴权
- [ ] Stripe Webhook 签名验证正确
- [ ] 用户上传的图片有类型和大小限制
- [ ] RSVP 表单有防刷机制(IP 限流)
- [ ] XSS 防护(用户输入的文本经过转义)
- [ ] CSRF 防护(POST 请求有 CSRF Token)

### 14.5 国际化验收

- [ ] 网站支持英文(`en`)
- [ ] 网站支持中文(`zh-CN`)
- [ ] 语言切换功能正常
- [ ] 首次访问根据浏览器语言自动跳转
- [ ] URL 包含语言前缀(如 `/en/` 或 `/zh-CN/`)
- [ ] 所有界面文案都已翻译(无硬编码英文)
- [ ] 日期格式本地化(英文: MM/DD/YYYY,中文: YYYY年MM月DD日)
- [ ] 货币显示正确(美元: $9.90,人民币: ¥29.9)

### 14.6 SEO 验收

- [ ] 所有页面有正确的 `<title>` 标签
- [ ] 所有页面有 `<meta name="description">` 标签
- [ ] 首页有 Open Graph 标签(og:title/og:image/og:description)
- [ ] H5 邀请函页面有 Open Graph 标签(用于社交分享)
- [ ] `/sitemap.xml` 可访问
- [ ] `/robots.txt` 配置正确
- [ ] 模板详情页 SSR 渲染(View Page Source 可以看到内容)
- [ ] H5 邀请函页面 SSR 渲染

### 14.7 错误处理验收

- [ ] 404 页面友好
- [ ] 500 错误页面友好
- [ ] 网络请求失败有错误提示
- [ ] 表单提交失败有错误提示
- [ ] 支付失败有明确提示
- [ ] AI 生成失败有降级策略
- [ ] 图片加载失败显示占位符

---

## 十五、项目决策记录

**确认日期**: 2026-08-30

### 已确认的决策:

✅ **域名**: 开发阶段暂无域名,使用 localhost  
✅ **服务器**: 不在文档中规定,开发者后续自行安排  
✅ **首批市场**: 欧美(英文优先,中文作为第二语言)  
✅ **开发方式**: 全部交给 Codex 开发,产品 Owner 自行验收  
✅ **模板数量**: MVP 仅需 3 个 demo 模板  
✅ **模板背景类型**: 支持图片/HTML/视频三种类型  
✅ **支付方式**: 仅 Stripe(去除支付宝/微信)  
✅ **编辑器复杂度**: 可视化拖拽(Fabric.js),不支持添加新元素  

### 技术栈锁定:

- 前端: Next.js 15 + React 19 + TypeScript
- 样式: Tailwind CSS + HeadlessUI
- 编辑器: Fabric.js 6.x
- 状态: Zustand
- 数据库: PostgreSQL 15+ (Prisma ORM)
- 缓存: Redis 7+
- 对象存储: S3-compatible
- AI: OpenAI GPT-4o-mini
- 支付: Stripe
- 认证: Auth.js v5
- 邮件: Resend
- 国际化: next-intl

### 不在 MVP 范围:

❌ 移动端 App(React Native / Flutter)  
❌ 微信小程序  
❌ 照片墙/留言板(UGC,需审核)  
❌ 在线礼金(需支付牌照)  
❌ 视频嵌入(除背景视频外)  
❌ 模板市场(用户贡献模板)  
❌ 团队协作  
❌ 白标方案  

---

## 十六、下一步行动

**文档状态**: ✅ 已完成,可交付给 Codex 开发

**开发者(Codex)下一步**:
1. 阅读本文档(建议打印 PDF 或在第二屏幕打开)
2. 按照 **第十三章 13.2** 初始化项目
3. 严格按照 **第十二章(Week 1-8)** 顺序开发
4. 每周完成后,参考 **第十四章** 自行验收

**产品 Owner 下一步**:
1. 将本文档交给 Codex
2. 监控开发进度(每周检查一次)
3. 每周验收(对照第十四章清单)
4. 设计 3 个 demo 模板的视觉稿(Week 3 之前需要)
5. 准备 Stripe 测试账号和 OpenAI API Key

**关键里程碑**:
- Week 2 结束: 基础框架搭建完成,可以登录
- Week 4 结束: 模板系统完成,可以浏览模板
- Week 6 结束: 编辑器完成,可以编辑内容
- Week 8 结束: MVP 完整功能上线,可以付费发布

---

**文档版本**: v2.0 Final  
**最后更新**: 2026-08-30  
**文档状态**: ✅ 已完成,Ready for Codex  
**预计开发周期**: 6-8 周  
**预计 MVP 上线**: 2026年10月中旬
