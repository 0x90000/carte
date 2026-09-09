# Carte

Carte 是一个面向个人用户的数字邀请函工作室。用户可以从模板开始，填写活动信息，替换图片和文案，在桌面端或移动端实时预览，然后生成可分享的公开邀请函页面。

当前产品以婚礼邀请函为主要场景，同时保留 `birthday`、`business`、`baby` 和 `other` 场景的数据模型。婚礼模板采用响应式长页面模型，支持 Hero、故事、相册、庆典日程、场地、地图、RSVP 和页脚等语义化 section；传统海报式模板仍通过画布和图层模型兼容。

## 目录

- [产品介绍](#产品介绍)
- [产品能力](#产品能力)
- [技术栈](#技术栈)
- [技术架构](#技术架构)
- [核心数据流](#核心数据流)
- [内容模型](#内容模型)
- [项目结构](#项目结构)
- [页面与 API](#页面与-api)
- [本地开发](#本地开发)
- [环境变量](#环境变量)
- [模板开发与同步](#模板开发与同步)
- [Docker 与部署](#docker-与部署)
- [测试与质量检查](#测试与质量检查)
- [安全、权限与可靠性](#安全权限与可靠性)
- [已知限制与后续方向](#已知限制与后续方向)
- [相关文档](#相关文档)
- [许可证与素材授权](#许可证与素材授权)

## 产品介绍

Carte 的目标是把“设计一张邀请函”变成一条可重复的内容生产流程：

1. 用户选择一个场景和模板。
2. 系统将模板结构复制为一份邀请函草稿。
3. 用户在编辑器中修改结构化内容和视觉属性。
4. 编辑器自动保存，用户可以随时撤销、重做或刷新页面恢复本地草稿。
5. 用户发布后得到一个稳定的 `/i/:slug` 公开链接。
6. 收件人浏览邀请函并提交 RSVP，主办人可以在 Dashboard 中查看、通知和导出回执。

产品同时支持两类用户状态：

- 未登录用户可以先创建访客草稿，草稿通过浏览器 session 关联并默认保留 7 天。
- 登录用户可以长期保存邀请函、发布、查看统计和管理 RSVP。邮箱验证码登录可用，Google OAuth 在配置凭据后启用。

## 产品能力

### 模板与预览

- 模板按场景、风格和标签筛选。
- 模板列表和详情页使用 live renderer 直接渲染页面结构，不依赖静态缩略图来模拟长页面。
- 桌面端默认展示适合 PC 浏览器的预览尺寸，也可以切换移动端设备比例。
- 长页面模板使用 `h5-long-scroll` 模型；旧模板使用 `canvas + layers` 模型。
- 当前婚礼模板库包含 `wedding-0001` 至 `wedding-0011` 共 11 套描述文件，均位于 `prisma/templates/`。

### 编辑器

- 传统画布编辑器基于 Fabric.js，适合自由定位文本、图片、形状和装饰图层。
- scene graph 编辑器以 section 为单位组织长页面，支持选择、排序、显示/隐藏、删除和新增 section。
- scene graph 的右侧 Inspector 由模板提供的 `editorSchema` 驱动：字段路径、控件类型、分组、选项、列表上限和媒体上传规则都属于模板描述，不绑定某一种活动场景。
- 支持编辑标题、正文、日期、地点、颜色方案、图片引用、地图配置和 RSVP 字段。
- 相册支持用户在浏览器选择图片，最多 9 张；模板数据会在归一化时再次限制为 9 张。
- 编辑器提供撤销、重做、显式保存和延迟自动保存。
- 编辑内容同步到服务端，同时写入浏览器 `localStorage`，用于网络波动或刷新后的恢复。
- 图片当前以内容中的 data URL 形式暂存，背景图、相册和 section 图片都可以替换。
- 背景音乐使用素材库引用；音乐播放必须经过用户手势，未配置真实音乐时使用占位素材记录。

### 婚礼邀请函运行时

- Hero 首屏、情侣姓名、日期、地点和滚动提示。
- Story 叙事 section，包含标题、段落、签名和统计数据。
- Gallery 相册，支持自动播放、箭头、圆点、键盘和触摸操作。
- Celebration 时间线，用于仪式、晚宴等日程展示。
- Venue 场地信息、地址、交通操作和配图。
- Find Us 地图 section。中文优先高德，其他语言优先 Google Maps；内容模型仍支持 OpenStreetMap 和自定义链接。
- RSVP 表单以及成功状态展示。公开邀请函会写入 RSVP 数据，模板预览只展示交互状态，不提交真实数据。
- Footer 收尾信息、粒子、噪点、花瓣和 reveal 等效果配置。

### AI、分享与运营

- OpenAI 文案生成接口，服务不可用时返回预设 fallback 文案。
- AI 模板推荐接口，根据场景、风格、色调和关键词返回模板候选。
- 单次发布和 lifetime publishing 两种 Stripe 支付路径。
- 测试服务器可通过 `TEST_PUBLISH_BYPASS=1` 跳过支付发布；生产环境必须关闭该开关。
- 发布后的分享页提供公开 URL、二维码、访问量、RSVP 数量和响应率。
- RSVP 去重、限流、通知摘要、邮件队列和 CSV 导出。
- Resend 用于验证码、邀请邮件和 RSVP 通知；Redis 不可用时相关异步能力会进入降级路径。

## 技术栈

| 层次 | 技术 | 用途 |
| --- | --- | --- |
| 运行时 | Node.js 24 | 本地开发、Docker 构建和生产运行时 |
| Web 框架 | Next.js 15.5.24 App Router | 页面、Server Components、Route Handlers 和构建产物 |
| UI | React 19.1.0、TypeScript 5 | 组件化界面和类型安全 |
| 样式 | Tailwind CSS 4、PostCSS | 响应式布局和设计基础样式 |
| 交互组件 | Radix UI、Headless UI、`lucide-react` | 无障碍基础组件、图标和交互原语 |
| 编辑器 | Fabric.js 7.4.0 | 传统画布的图层、拖拽、缩放和文本编辑 |
| 动效 | `framer-motion` | 编辑器和页面的状态动效 |
| 状态 | Zustand 5、React hooks | 编辑器局部状态、历史记录和异步状态 |
| 表单 | React Hook Form、Zod 4 | 表单状态、校验和 API 输入解析 |
| 国际化 | `next-intl` 4 | `en`、`zh-CN` 路由和翻译 |
| ORM | Prisma 6.19.0 | PostgreSQL 类型化访问、迁移和事务 |
| 数据库 | PostgreSQL 15 Alpine | 用户、模板、邀请函、支付和 RSVP 的事实来源 |
| 缓存与队列 | Redis 7 Alpine | 公开邀请函缓存、限流、邮件队列和通知状态 |
| 认证 | Auth.js v5、Prisma Adapter | 邮箱验证码、Google OAuth、JWT session |
| 邮件 | Resend、Nodemailer | 验证码、邀请邮件和 RSVP 通知 |
| 支付 | Stripe | Checkout、Webhook、单次发布和 lifetime 权限 |
| AI | OpenAI SDK | 文案生成和模板推荐 |
| 媒体 | 浏览器 FileReader、原生 `<img>`；AWS SDK 已纳入依赖 | 当前编辑器本地 data URL；对象存储接入预留 |
| 其他 | `qrcode`、`node-cron` | 分享二维码、定时清理和通知任务 |
| 测试 | Playwright、TypeScript、ESLint | E2E、类型检查和代码质量检查 |
| 部署 | Docker、Docker Compose | 多阶段构建、应用/数据库/Redis 编排 |

## 技术架构

Carte 是一个 Next.js 单体应用。页面渲染、编辑器、API 和领域服务在同一个仓库中，通过清晰的 Server/Client 边界访问数据库和外部服务。

```mermaid
flowchart TB
    Browser[浏览器\n桌面端 / 移动端] --> Next[Next.js App Router]
    Next --> Pages[页面与 Server Components]
    Next --> Client[Client Components\n编辑器 / 预览 / RSVP]
    Next --> Routes[Route Handlers\napp/api/**]
    Pages --> Auth[Auth.js session]
    Pages --> Domain[lib/* 领域服务]
    Client --> Routes
    Routes --> Domain
    Domain --> Prisma[Prisma Client]
    Prisma --> Postgres[(PostgreSQL 15)]
    Domain --> Redis[(Redis 7)]
    Domain --> Stripe[Stripe]
    Domain --> Resend[Resend]
    Domain --> OpenAI[OpenAI]
    Domain --> Maps[高德 / Google Maps]
```

### Server Components 与 Client Components

Server Components 默认负责：

- 查询模板、邀请函和 Dashboard 数据。
- 读取 Auth.js session 并执行页面级权限判断。
- 生成 metadata、Open Graph、canonical URL、sitemap 和 robots 内容。
- 将 Prisma 查询结果序列化为编辑器或邀请函渲染器的初始 props。

Client Components 负责：

- Fabric.js 画布生命周期和图层交互。
- scene graph section 选择、排序、删除、新增和属性编辑。
- 实时 live preview、桌面/移动端预览切换和初始滚动位置重置。
- 图片选择、相册管理、RSVP 表单和用户手势触发的音乐状态。
- 自动保存、localStorage 恢复、撤销/重做和发布按钮状态。

### 领域服务边界

`lib/` 是外部服务和业务规则的集中位置：

- `lib/prisma.ts`：复用 PrismaClient，避免开发热重载创建过多连接。
- `lib/session.ts`：读取和生成访客 session 标识。
- `lib/templates.ts`：模板场景、结构类型、列表筛选和结构归一化入口；同时保留模板 `editorSchema` 的结构类型。
- `lib/public-invitation.ts`：公开邀请函读取、缓存和失效。
- `lib/publishing.ts`：发布权限、lifetime 日限额和测试绕过逻辑。
- `lib/payment.ts`、`lib/stripe.ts`：Stripe webhook、支付幂等和发布事务。
- `lib/rsvp.ts`、`lib/rsvp-notification.ts`：RSVP 校验、去重、通知摘要和邮件任务。
- `lib/invitation-email.ts`、`lib/invitation-email-queue.ts`：邀请邮件发送和 Redis 队列。
- `lib/rate-limit.ts`、`lib/redis.ts`：限流和 Redis 连接降级。
- `lib/openai.ts`、`lib/ai-fallback.ts`：AI 请求和预设文案 fallback。
- `lib/i18n.ts`、`lib/site-url.ts`：语言路径和绝对 URL。

### 运行环境

Docker Compose 默认启动三个长期运行服务和一个工具 profile：

| 服务 | 容器端口 | 宿主端口 | 说明 |
| --- | ---: | ---: | --- |
| `app` | 3000 | 3010 | Next.js standalone server |
| `postgres` | 5432 | 127.0.0.1:55432 | PostgreSQL 数据卷 |
| `redis` | 6379 | 127.0.0.1:56379 | Redis 数据卷 |
| `migrate` | - | - | `tools` profile 下执行 Prisma migration |

PostgreSQL 和 Redis 只绑定宿主机 loopback，避免直接暴露到公网。应用在 Compose 网络内使用服务名 `postgres` 和 `redis` 连接它们。

## 核心数据流

### 模板到草稿

```mermaid
sequenceDiagram
    actor U as 用户
    participant T as 模板页
    participant API as /api/invitations
    participant DB as PostgreSQL
    participant E as 编辑器

    U->>T: 选择场景和模板
    T->>API: POST scene/title/templateId
    API->>DB: 创建 Invitation 或 GuestDraft
    DB-->>API: 返回 id、content、session 状态
    API-->>T: 返回编辑器地址
    T->>E: 加载初始内容
    E->>E: normalizeEditorContent()
```

未登录用户创建的记录写入 `guest_drafts`，绑定 `sessionId` 和 `expiresAt`；登录用户直接写入 `invitations`。登录后调用 `/api/auth/migrate-guest-data` 可将当前 session 的访客草稿迁移到用户账户。

### 编辑与保存

1. 编辑器以服务端记录作为初始值，使用 `normalizeEditorContent` 补齐缺省画布、图层、section 和 assets 字段。
2. 每次内容变化先更新 Client Component 状态，并把内容写入 `localStorage`。
3. 延迟计时器触发 `PATCH /api/invitations/:id`，保存标题、内容、日期、地点和 settings。
4. 保存成功后清理或更新本地时间戳；刷新时只有本地版本更新才会覆盖服务端初始值。
5. 已发布邀请函的公开缓存会在内容更新和发布操作后失效。

### 发布与支付

```mermaid
sequenceDiagram
    actor U as 用户
    participant E as 编辑器
    participant P as 发布 API
    participant S as Stripe Checkout
    participant W as Stripe Webhook
    participant DB as PostgreSQL

    U->>E: 点击发布
    E->>E: 保存最新草稿
    alt 测试绕过开启
        E->>P: POST /api/invitations/:id/publish
        P->>DB: 事务更新 status=published
    else 正常支付
        E->>S: POST /api/payment/create-checkout
        S-->>U: Checkout 页面
        U->>S: 完成支付
        S->>W: checkout.session.completed
        W->>DB: 幂等写入 Payment
        W->>DB: 更新 Invitation 或 lifetimeAccessAt
    end
    DB-->>E: published + slug
```

发布 API 要求登录用户。正常模式下需要 lifetime 权限，或由 Stripe webhook 完成单次发布；测试模式使用 `publishInvitationWithoutPaymentForTest`，不会创建支付记录或 lifetime 权限。

### 公开访问与 RSVP

1. 访客访问 `/en/i/:slug` 或 `/zh-CN/i/:slug`。
2. 服务端从 Redis 缓存或 PostgreSQL 读取 `status=published` 的邀请函。
3. 页面根据 `pageModel` 选择 scene graph renderer 或 legacy canvas renderer。
4. 页面访问量异步递增 `Invitation.viewCount`。
5. RSVP 表单向 `/api/rsvp` 发起请求；接口校验公开状态、字段、联系方式和限流规则。
6. 成功回执写入 `rsvps`，按配置创建通知摘要或邮件队列任务。

## 内容模型

### 传统画布模型

适用于海报式邀请函的最小结构如下：

```json
{
  "pageModel": "canvas",
  "canvas": {
    "width": 750,
    "height": 1334,
    "background": { "type": "color", "value": "#ffffff" }
  },
  "layers": [
    {
      "id": "title",
      "type": "text",
      "name": "标题",
      "position": { "x": 80, "y": 140 },
      "size": { "width": 590, "height": 100 },
      "content": {
        "text": "我们结婚啦",
        "color": "#111827",
        "font": { "family": "Inter", "size": 52, "weight": 600, "lineHeight": 1.2 }
      }
    }
  ],
  "gallery": []
}
```

`layers` 中的 `position` 和 `size` 使用画布坐标；渲染器根据容器宽度换算为百分比和 container query 字体尺寸。图层可以是 `text`、`image`、`shape`、`svg` 或装饰类型。

### 长页面 scene graph 模型

长页面内容使用 `pageModel: "h5-long-scroll"` 和有序 `sections` 数组。每个 section 具有稳定的 `id`、语义化 `type`、可见性和独立 `data`：

```json
{
  "document": {
    "schemaVersion": "wedding-invitation-content-v2",
    "pageModel": "h5-long-scroll",
    "locale": "zh-CN"
  },
  "pageModel": "h5-long-scroll",
  "sections": [
    {
      "id": "hero",
      "type": "hero",
      "name": "Hero",
      "visible": true,
      "data": {
        "names": { "partnerA": "林深", "separator": "&", "partnerB": "许棠" },
        "date": { "value": "2026-10-18", "display": "OCTOBER 18, 2026" },
        "location": { "city": "杭州", "venue": "云栖竹径" },
        "media": { "assetId": "wedding-0001-hero", "fit": "cover" }
      }
    },
    {
      "id": "gallery",
      "type": "gallery",
      "name": "Gallery",
      "data": {
        "album": {
          "items": [
            {
              "id": "album-1",
              "media": { "assetId": "upload-abc", "fit": "cover", "alt": "婚礼照片" },
              "caption": "The beginning"
            }
          ],
          "autoplay": true,
          "intervalMs": 6200,
          "controls": { "arrows": true, "dots": true, "keyboard": true, "touch": true }
        }
      }
    }
  ],
  "assets": [
    { "id": "wedding-0001-hero", "kind": "image", "url": "/templates/wedding-0001/hero.jpg" },
    { "id": "music-placeholder-001", "kind": "audio", "url": "", "placeholder": true }
  ],
  "music": {
    "enabled": true,
    "source": "asset-library",
    "assetId": "music-placeholder-001",
    "userGestureRequired": true
  }
}
```

当前婚礼模板使用 `hero`、`story`、`gallery`、`celebration`、`venue`、`findUs`、`rsvp`、`footer` 和 `custom`。这只是当前场景的 section 注册，不是编辑器的固定枚举。其他场景可以在 `editorSchema.sectionTypes` 注册完全不同的 section type 和字段；编辑器可以新增、删除和重排整个 section，渲染器会忽略 `visible=false` 的 section。`docs/templates/wedding/0001/content-schema.json` 是婚礼内容字段的 JSON Schema，`editable-items.json` 列出每一个可编辑 item 及其控件映射。

### 可扩展编辑器 schema

模板可以在顶层 `editorSchema` 中声明自己的编辑面板，不需要修改编辑器组件。`sectionTypes` 以 section type 为 key，每个类型提供 `fields`；字段使用数据路径定位值，`tab` 决定它出现在 `content`、`media`、`style` 或 `behavior` 面板，`kind` 决定控件类型。支持的基础控件包括 `text`、`textarea`、`number`、`boolean`、`select`、`color`、`date`、`url`、`media`、`image-list`、`object-list`、`readonly` 和 `hint`。

```json
{
  "editorSchema": {
    "version": 1,
    "sectionPresets": [
      { "type": "speaker", "label": { "en": "Speaker", "zh-CN": "嘉宾" }, "data": { "name": "", "portrait": { "assetId": null } } }
    ],
    "sectionTypes": {
      "speaker": {
        "label": { "en": "Speaker", "zh-CN": "嘉宾" },
        "icon": "type",
        "fields": [
          { "path": "name", "label": { "en": "Name", "zh-CN": "姓名" }, "kind": "text" },
          { "path": "bio", "label": { "en": "Bio", "zh-CN": "简介" }, "kind": "textarea" },
          { "path": "portrait", "label": { "en": "Portrait", "zh-CN": "头像" }, "kind": "media", "tab": "media" },
          { "path": "featured", "label": { "en": "Featured", "zh-CN": "重点展示" }, "kind": "boolean", "tab": "behavior" }
        ]
      }
    }
  }
}
```

`object-list` 和 `image-list` 通过 `itemFields` 描述每一项，`maxItems` 与 `minItems` 控制数量边界；`label`、`description`、`placeholder` 和选项 label 可以使用 `{ "en": "...", "zh-CN": "..." }`。模板没有 `editorSchema` 时，编辑器会对非婚礼 section 自动推断字符串、数字、布尔值和列表字段，并把已有 section type 作为可复制的兼容 preset，保证旧内容仍可打开和增删；推断模式适合迁移和兜底，正式模板应提交明确 schema。模板 renderer 只需要在对应 DOM 元素输出 `data-editor-section` 和 `data-editor-field`，就能自动获得画布点击选中和双击文字编辑能力。

### Assets 与可编辑策略

媒体通过 `assetId` 引用，以便模板布局和用户内容解耦：

- 背景图、Hero 图、场地配图和相册图片：`kind=image`，允许用户替换。
- 音乐：`kind=audio`，来源为素材库，不允许通过当前编辑器直接上传。
- 粒子、噪点、图标等装饰：由 CSS、Three.js 或 Lucide 提供，不作为用户媒体上传。
- 相册最大 9 项，上传时和内容归一化时均执行上限。
- `alt`、`fit`、`position` 等字段跟随媒体引用保存，供无障碍和响应式渲染使用。

## 项目结构

```text
.
├─ app/
│  ├─ [locale]/                 # 带语言前缀的页面
│  ├─ api/                      # Next.js Route Handlers
│  ├─ editor/                   # 未带 locale 的兼容入口
│  ├─ templates/                # 模板列表与详情
│  ├─ i/                        # 公开邀请函兼容入口
│  ├─ globals.css               # 全局样式
│  └─ editor-modern.css         # 编辑器和 scene graph 样式
├─ components/
│  ├─ editor/                   # EditorShell、Fabric、scene graph、schema renderer、类型归一化
│  ├─ invitation/               # 公开邀请函、RSVP、长页面 renderer
│  ├─ templates/                # 模板卡片、live preview、预览模式切换
│  ├─ dashboard/                # 邀请函、支付、邮件和 RSVP 管理
│  ├─ auth/                     # 登录和邮箱验证码表单
│  └─ ui/                       # Radix/Headless 风格基础组件
├─ lib/                         # Prisma、认证、支付、邮件、AI、缓存和领域服务
├─ prisma/
│  ├─ schema.prisma             # 数据模型
│  ├─ migrations/               # 数据库迁移
│  └─ templates/                # 可导入的模板描述 JSON
├─ template/wedding/            # 原始婚礼模板 HTML/CSS/JS 和素材
├─ public/templates/            # 部署后可直接访问的模板媒体
├─ scripts/                     # 模板同步、导入、备份、清理和部署测试
├─ docs/                        # 设计、架构、模板和阶段报告
├─ messages/                    # next-intl 翻译文件
├─ tests/e2e/                   # Playwright 端到端测试
├─ Dockerfile                   # deps/builder/runner 多阶段构建
├─ docker-compose.yml           # app、postgres、redis、migrate
└─ .env.example                 # 环境变量模板
```

## 页面与 API

### 页面路由

带 `[locale]` 的路径支持 `en` 和 `zh-CN`；根目录的兼容路径由现有页面继续提供。

| 页面 | 作用 |
| --- | --- |
| `/:locale` | 首页和产品入口 |
| `/:locale/create` | 创建流程和场景选择 |
| `/:locale/templates` | 模板列表、筛选和 live preview |
| `/:locale/templates/:id` | 模板详情和使用模板入口 |
| `/:locale/editor/new` | 新建编辑器入口 |
| `/:locale/editor/:id` | 编辑已有邀请函或访客草稿 |
| `/:locale/dashboard` | 邀请函列表、统计和发布状态 |
| `/:locale/dashboard/invitations/:id/share` | 分享链接、二维码和发布统计 |
| `/:locale/dashboard/invitations/:id/rsvps` | RSVP 列表和 CSV 导出 |
| `/:locale/i/:slug` | 公开邀请函页面 |
| `/:locale/login` | 邮箱验证码和 Google 登录 |

### API 路由

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `POST` | `/api/invitations` | 创建登录用户邀请函或访客草稿 |
| `GET` | `/api/invitations` | 查询当前用户邀请函或访客草稿 |
| `GET/PATCH/DELETE` | `/api/invitations/:id` | 读取、保存或删除邀请函 |
| `POST` | `/api/invitations/:id/duplicate` | 复制登录用户的邀请函 |
| `POST` | `/api/invitations/:id/publish` | 发布邀请函，受支付或测试绕过控制 |
| `GET` | `/api/invitations/:id/rsvps` | 查询当前用户的 RSVP |
| `GET` | `/api/invitations/:id/rsvps/export` | 导出 RSVP CSV |
| `GET/POST` | `/api/invitations/:id/send-emails` | 查看或发送邀请邮件 |
| `GET` | `/api/templates` | 查询模板列表 |
| `GET` | `/api/templates/:id` | 查询模板详情 |
| `POST` | `/api/rsvp` | 公开邀请函提交 RSVP |
| `POST` | `/api/auth/request-code` | 发送邮箱验证码 |
| `POST` | `/api/auth/migrate-guest-data` | 将访客草稿迁移到登录账户 |
| `GET/POST` | `/api/auth/[...nextauth]` | Auth.js 登录回调 |
| `GET` | `/api/session` | 返回当前 session 信息 |
| `POST` | `/api/ai/generate-copy` | 生成邀请函文案 |
| `POST` | `/api/ai/recommend-templates` | 推荐模板 |
| `POST` | `/api/payment/create-checkout` | 创建 Stripe Checkout session |
| `GET` | `/api/payment/history` | 查询当前用户支付记录 |
| `POST` | `/api/payment/webhook` | 接收并验证 Stripe webhook |

API 使用 Zod 解析输入，并返回 JSON。写操作按 session 或 userId 限制资源范围；公开 RSVP 只接受已发布且 slug 匹配的邀请函。

## 数据模型

核心 Prisma 模型如下：

| 模型 | 说明 |
| --- | --- |
| `User` | 用户资料、locale、lifetime 权限和关联资源 |
| `Account` | Google 等 OAuth provider 账户 |
| `Session` | Auth.js session 数据 |
| `VerificationToken` | 邮箱验证码 token |
| `Template` | 模板元数据和完整 `structure` JSON |
| `GuestDraft` | 未登录用户的临时草稿、session 和过期时间 |
| `Invitation` | 登录用户的邀请函、slug、内容、状态和访问量 |
| `RSVP` | 访客姓名、联系方式、状态、人数和留言 |
| `RSVPNotification` | RSVP 摘要通知和重试状态 |
| `EmailSend` | 邀请邮件发送、打开、点击和错误状态 |
| `Payment` | Stripe 支付、购买类型和幂等 provider ID |
| `DailyPublishUsage` | lifetime 用户按 UTC 日期的发布计数 |
| `AIGeneration` | AI prompt、响应、模型和 token 使用量 |

`Invitation.content`、`GuestDraft.content` 和 `Template.structure` 使用 PostgreSQL JSON 存储。结构化 JSON 允许模板版本演进而不频繁修改关系表；跨用户、状态、slug 和过期时间的查询字段仍使用独立列和索引。

## 本地开发

### 前置条件

- Node.js 24 和 npm。
- Git。
- Docker Desktop 或可访问的 PostgreSQL 15、Redis 7 实例。
- 可选：Google OAuth、Resend、Stripe 和 OpenAI 的开发凭据。

### 安装与启动

```bash
# 克隆仓库并进入项目
git clone https://github.com/0x90000/carte.git
cd carte

# 安装依赖
npm install

# 创建本地环境文件
cp .env.example .env.local

# 生成 Prisma Client
npx prisma generate

# 如果本机运行了 PostgreSQL/Redis，可执行迁移
npx prisma migrate dev

# 启动 Next.js 开发服务器
npm run dev
```

开发服务器默认地址为 `http://localhost:3000`。如果使用 Docker Compose 提供数据库和 Redis，可以先执行：

```bash
docker compose up -d postgres redis
npx prisma migrate deploy
npm run dev
```

首次运行没有外部服务凭据时，仍可开发页面和编辑器：

- 没有 `OPENAI_API_KEY` 时使用预设文案 fallback。
- 没有 Google OAuth 凭据时隐藏 Google 登录 provider。
- 没有 Resend key 时不能发送真实验证码或邮件，但不影响静态页面开发。
- 音乐使用素材库占位符，浏览器要求用户手势后才会播放。
- 发布测试可设置 `TEST_PUBLISH_BYPASS=1`，详见[发布配置](#发布配置)。

### 可用脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 使用 Turbopack 启动开发服务器 |
| `npm run build` | 生成 Next.js 生产构建 |
| `npm run start` | 启动生产构建 |
| `npm run lint` | 执行 ESLint |
| `npm run test:e2e` | 执行 Playwright E2E 测试 |
| `npm run test:e2e:report` | 打开 Playwright HTML 报告 |
| `npm run db:backup` | 执行 PostgreSQL 备份脚本 |
| `npm run db:seed:templates` | 导入 `prisma/templates/*.json` |
| `npm run templates:sync:wedding` | 从原始婚礼 HTML 同步描述文件和公开素材 |
| `npm run db:cleanup:guest-drafts` | 删除已经过期的访客草稿 |

### 数据库操作

开发阶段修改 `prisma/schema.prisma` 后使用：

```bash
npx prisma migrate dev --name describe-the-change
npx prisma generate
```

部署环境只执行已经提交的迁移：

```bash
npx prisma migrate deploy
```

需要检查数据时可以运行 `npx prisma studio`。不要直接编辑生产数据库中的 JSON 内容；模板和默认结构应从仓库中的描述文件重新导入。

## 环境变量

所有变量名和默认值以 `.env.example` 为准。真实 secret 只能存放在本地未提交的 `.env.local`、服务器 secret 管理或 CI secret 中。

### 基础服务

| 变量 | 必需 | 示例 | 说明 |
| --- | --- | --- | --- |
| `DATABASE_URL` | 是 | `postgresql://carte:carte_local@localhost:55432/carte?schema=public` | Prisma PostgreSQL 连接串 |
| `REDIS_URL` | 推荐 | `redis://localhost:56379` | 缓存、限流和队列 |
| `AUTH_URL` | 是 | `http://localhost:3000` | Auth.js 回调基地址 |
| `AUTH_SECRET` | 是 | 随机长字符串 | Auth.js session 签名 |
| `NEXTAUTH_URL` | 兼容 | `http://localhost:3000` | 旧版 Auth.js 变量 |
| `NEXTAUTH_SECRET` | 兼容 | 随机长字符串 | 旧版 Auth.js secret |
| `NEXT_PUBLIC_APP_URL` | 是 | `http://localhost:3000` | 分享链接和 metadata 的公开地址 |

### 外部服务

| 变量 | 用途 |
| --- | --- |
| `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET` | 可选 Google OAuth；两者都非空时启用 |
| `RESEND_API_KEY`、`EMAIL_FROM` | 邮箱验证码、邀请邮件和 RSVP 通知 |
| `STRIPE_SECRET_KEY` | Stripe 服务端 API |
| `STRIPE_WEBHOOK_SECRET` | 验证 `/api/payment/webhook` 签名 |
| `STRIPE_PRICE_ID_SINGLE` | 单次发布价格 ID |
| `STRIPE_PRICE_ID_LIFETIME` | lifetime publishing 价格 ID |
| `OPENAI_API_KEY`、`OPENAI_MODEL` | AI 文案和模板推荐 |

### 测试与后台任务

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `E2E_TEST_MODE` | `0` | 隔离测试环境开关 |
| `E2E_TEST_EMAIL_CODE` | 空 | E2E 登录使用的固定验证码 |
| `TEST_PUBLISH_BYPASS` | `0` | 设为 `1` 后登录用户可无支付发布 |
| `GUEST_DRAFT_TTL_DAYS` | `7` | 访客草稿保留天数 |
| `GUEST_DRAFT_CLEANUP_ENABLED` | `true` | 是否启用清理任务 |
| `GUEST_DRAFT_CLEANUP_SCHEDULE` | `0 * * * *` | cron 清理计划 |
| `EMAIL_QUEUE_ENABLED` | `false` | 是否将邀请邮件放入 Redis 队列 |
| `RSVP_NOTIFICATION_ENABLED` | `false` | 是否发送 RSVP 摘要通知 |
| `RSVP_NOTIFICATION_INTERVAL_MS` | `3600000` | RSVP 摘要时间窗口 |

### 发布配置

`TEST_PUBLISH_BYPASS` 只用于隔离的测试服务器：

```bash
TEST_PUBLISH_BYPASS=1
```

发布接口在该模式下仍要求用户登录、邀请函归属正确且状态未发布，但不会创建 Payment 或扣除 lifetime 发布额度。生产环境和任何面向真实用户的环境必须保持 `TEST_PUBLISH_BYPASS=0`，并配置 Stripe webhook。

## 模板开发与同步

### 原始模板目录

原始婚礼模板位于 `template/wedding/<code>/`。每套模板通常包含：

```text
template/wedding/0001/
├─ index.html       # 结构、文案和 section 顺序
├─ styles.css       # 视觉样式、响应式规则和动效
├─ script.js        # 相册、音乐、地图和 RSVP 的交互
└─ assets/          # Hero、相册、场地等图片素材
```

原始 HTML 不是运行时直接拼接到 React 页面中的模板格式。同步脚本会把可编辑内容拆成标准描述文件：

- `prisma/templates/wedding-0001.json` 等：可导入数据库的完整模板结构。
- `public/templates/wedding-0001/` 等：部署后可访问的图片素材。
- `docs/templates/wedding/0001/`：模板 manifest、content schema、editable items 和 section 说明。

### 同步 0001 到 0011

```bash
npm run templates:sync:wedding
npm run db:seed:templates
```

同步过程会从每个目录的 `index.html` 读取标题、Hero 图片、相册、时间线、地点、RSVP 和页脚，生成统一的 `h5-long-scroll` scene graph。脚本对相册数量、事件数量和必要 section 使用断言；任一输入结构不符合预期时应让同步失败，而不是导入不完整模板。

### 新增模板的约定

1. 在 `template/<scene>/<code>/` 加入源文件和素材。
2. 为模板设置稳定的 `id`、名称、场景、风格、标签、描述和排序。
3. 明确 `pageModel`。长页面使用 `h5-long-scroll`，海报式内容使用 `canvas`。
4. 媒体使用稳定 `assetId`，不要把模板布局绑定到临时 CSS selector。
5. 对用户可编辑字段补充 `editable-items.json`，对内容约束补充 JSON Schema。
6. 运行同步脚本、导入脚本、类型检查和模板 E2E。
7. 在模板详情页确认 live preview、桌面/移动端切换和初始滚动位置均正确。

### 预览渲染链路

`components/templates/live-template-preview.tsx` 会先执行 `normalizeEditorContent`：

- 有 `pageModel=h5-long-scroll` 且存在 sections 时，使用 `SceneGraphInvitation`。
- 否则使用 legacy canvas renderer，按画布坐标绘制 layers。
- 预览传入 `previewOnly=true`，RSVP 仅展示交互和成功状态，不调用真实 RSVP API。
- 预览通过 `useInitialScrollReset` 在模板切换或设备模式切换后回到 Hero，避免错误地停留在地图 section。

公开邀请函使用同一套 scene graph renderer，但 `previewOnly=false` 并绑定真实 `invitationSlug`，从而保持预览和发布页面的结构一致。

## Docker 与部署

### 本地 Compose

```bash
docker compose up -d --build postgres redis
docker compose --profile tools run --rm migrate
docker compose up -d --build app
```

应用映射为 `http://localhost:3010`。数据库和 Redis 端口仅监听 `127.0.0.1`：

- PostgreSQL：`127.0.0.1:55432`
- Redis：`127.0.0.1:56379`

### Dockerfile 构建阶段

`Dockerfile` 使用三阶段构建：

1. `deps`：根据 lockfile 安装生产和构建依赖。
2. `builder`：复制源代码，生成 Prisma Client，执行 `npm run build`。
3. `runner`：只复制 `public`、Next standalone 输出、静态文件、脚本和模板描述，使用 `node server.js` 启动。

生产镜像不应携带 `.env` 文件；通过 Compose `env_file`、服务器 secret 或部署平台的环境配置注入变量。

### 测试服务器部署

在服务器准备 `.env` 后执行：

```bash
docker compose up -d --build postgres redis
docker compose --profile tools run --rm migrate
docker compose up -d --build app
```

检查服务状态：

```bash
docker compose ps
docker compose logs --tail=200 app
```

应用对外端口是 `3010`，容器内部端口是 `3000`。部署后可以运行婚礼模板回归脚本：

```bash
node scripts/test-wedding-deployment.mjs http://<server>:3010
```

该脚本检查婚礼模板数量、模板素材 HTTP 状态、live preview、编辑器桌面/移动端模式和关键页面响应。真实服务器地址、账号、密码和任何 provider secret 不得写入 README、Git 或脚本参数默认值。

### 部署顺序

推荐顺序如下：

1. 拉取目标 Git 提交。
2. 备份 PostgreSQL。
3. 构建应用镜像。
4. 启动 PostgreSQL 和 Redis，等待 healthcheck。
5. 执行 `prisma migrate deploy`。
6. 启动或滚动更新 `app`。
7. 检查日志、首页、模板页、公开邀请函和 RSVP API。
8. 执行 `scripts/test-wedding-deployment.mjs`。

若迁移或健康检查失败，应停止切换应用流量并保留当前运行版本，避免在数据库未完成升级时启动新代码。

## 测试与质量检查

### 静态检查

提交前至少执行：

```bash
git diff --check
npx tsc --noEmit
npm run lint
npm run build
```

`npm run build` 会验证 Next.js Server/Client 边界、路由类型、Prisma 查询类型和生产构建。README 等文档修改不改变运行代码，但完整检查可以及时发现工作区已有的类型或 lint 问题。

### Playwright E2E

测试目录为 `tests/e2e/`，覆盖：

- 登录和国际化。
- 访客草稿创建、保存和登录迁移。
- 模板列表、模板详情和模板国际化。
- 传统编辑器、scene graph 编辑器、相册上传和撤销重做。
- 公开邀请函、RSVP、去重、限流和通知。
- Dashboard、分享页、支付和 lifetime publishing。
- SEO metadata、robots 和 sitemap。

默认 Playwright base URL 可指向测试服务器的 `:3010` 端口；本地运行时设置：

```powershell
$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"
npm run test:e2e
```

E2E 测试应使用专用数据库、Redis 和测试 provider，不要连接真实生产数据。

### 手工验收重点

- 模板首屏加载停留在 Hero，不自动滚动到地图。
- PC 预览有合适的桌面宽度和长页面滚动区域，移动模式保持设备比例。
- 模板卡片展示真实 live page，而非只显示静态图片。
- 相册最多 9 张，删除和替换后预览与公开页面一致。
- RSVP 预览不会污染数据库；公开页面提交后能在 Dashboard 看到回执。
- 分享页显示真实 `viewCount`、RSVP 数量和 `responseRate`。
- 关闭支付测试绕过后，发布路径返回支付要求而不是静默发布。

## 安全、权限与可靠性

### 认证与资源权限

- Dashboard、编辑器的登录邀请函和 RSVP 管理按 `userId` 查询。
- 未登录编辑器只能读取当前浏览器 `sessionId` 且未过期的 `GuestDraft`。
- 访客草稿默认 7 天过期，清理脚本按 `expiresAt` 删除。
- 登录后通过迁移事务将访客草稿归属到用户，避免跨用户读取。
- 公开页面只接受 `status=published` 的 slug。

### 输入与输出

- Route Handler 使用 Zod 校验 JSON、日期、场景、RSVP 字段和支付购买类型。
- 用户文案作为 React 文本渲染，不把未信任内容当作 HTML 执行。
- 图片使用原生 `<img>` 渲染，以支持 data URL 和模板资源；上传控件限制图片 MIME 类型。
- RSVP 至少需要邮箱或手机号之一，并对同一邀请函联系人去重。
- RSVP 和认证接口使用 Redis 限流；Redis 不可用时接口返回明确的服务不可用错误。

### 支付与幂等

- Stripe webhook 先验证签名，再检查支付状态和 metadata。
- `providerSessionId`、`providerPaymentId` 用于避免重复处理。
- 发布和 lifetime 日限额更新在 Prisma serializable transaction 中完成，并对可重试的序列化冲突进行有限重试。
- 支付成功、邀请函发布和缓存失效必须保持同一业务顺序；异常时通过日志和 webhook 重试恢复。

### 外部服务降级

- OpenAI 无 key、超时或返回无效数据时使用 `lib/ai-fallback.ts` 的预设文案。
- Redis 连接异常时公开邀请函可以回源 PostgreSQL；限流和队列能力会返回受控错误或进入同步路径。
- 邮件发送失败会保存 `EmailSend`/`RSVPNotification` 错误状态和重试次数，不阻塞邀请函页面渲染。
- 地图内容保存坐标和 provider 配置。中文默认高德，其他语言默认 Google；外部地图不可用时仍可展示地址文字。

## 已知限制与后续方向

当前实现的边界：

- 用户图片主要以 data URL 写入 JSON，尚未完成生产级对象存储、压缩、病毒扫描和 CDN 生命周期管理。
- 音乐素材库接口目前使用占位 asset；真实曲库、版权元数据和播放列表管理尚未接入。
- 模板同步脚本针对当前婚礼 HTML 结构使用解析规则；更广泛的第三方模板导入需要版本化适配器。
- Fabric 画布和 scene graph 并存，旧模板仍需维护 legacy renderer 和迁移逻辑。
- Redis 队列消费者和周期任务需要在部署环境中单独规划进程、监控和失败告警。
- 当前统计只有页面访问量、RSVP 数量和响应率；没有完整的访客漏斗、设备分布或事件分析。
- 地图依赖外部 provider，未在应用内实现完整的地图瓦片渲染。

后续可以按优先级推进：

1. 引入 S3-compatible 对象存储和签名上传 API，将 data URL 迁移为 asset record。
2. 建立音乐素材库、授权记录、预加载和播放状态模型。
3. 将模板 schema、编辑器控件和 renderer 注册为可扩展 section plugin。
4. 完善模板版本迁移、草稿冲突提示和多人协作基础。
5. 将邮件队列、清理任务和 RSVP digest 拆为可监控的 worker。
6. 增加图片优化、CDN、缓存命中率和公开页面性能指标。

## 相关文档

- [婚礼模板 0001 manifest](docs/templates/wedding/0001/template-manifest.json)
- [婚礼模板 0001 content schema](docs/templates/wedding/0001/content-schema.json)
- [婚礼模板 0001 editable items](docs/templates/wedding/0001/editable-items.json)
- [婚礼模板 section 说明](docs/templates/wedding/0001/sections.md)
- [婚礼模板编辑器需求](docs/templates/wedding/0001/editor-requirements.md)
- [模板使用指南](docs/wedding-templates-usage-guide.md)
- [快速开始补充文档](docs/QUICK-START.md)
- [技术规格文档](docs/tech-spec.md)
- [详细技术规格文档](docs/tech-spec-detailed.md)
- [编辑器现代化说明](docs/EDITOR-CSS-MODERNIZATION.md)
- [UI 重构清单](docs/ui-refactor-checklist.md)

## 许可证与素材授权

仓库当前未声明公开开源许可证，默认按项目所有者授权使用。未经项目所有者许可，不要复制、再分发或商用仓库中的代码、模板和图片素材。

模板引用的外部服务和字体必须遵守各自的服务条款与许可证。发布新模板时请记录素材来源、授权范围、署名要求和是否允许公开分享；不得把未获授权的音乐或图片提交到 `template/`、`public/` 或模板 JSON 中。

## Git 提交约定

建议使用 Conventional Commits：

```text
feat: add wedding scene section
fix: reset live preview to hero
docs: expand project README
refactor: split invitation renderer
test: cover RSVP deduplication
chore: update dependencies
```

一个提交应围绕一个明确目的，模板素材同步、数据库迁移和功能代码变更尽量分开，方便回滚和审查。提交前检查：

```bash
git status --short
git diff --check
npx tsc --noEmit
npm run lint
```
