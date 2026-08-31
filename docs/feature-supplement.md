# Carte 功能补充设计文档

**版本**: v2.1 (基于 v2.0 的核心需求变更)  
**变更日期**: 2026-08-30  
**变更原因**: 支持未登录用户制作邀请函

---

## 核心变更:未登录用户流程

### 变更前(v2.0)

```
用户流程:
1. 访问首页 → 必须登录
2. 登录后才能选择模板
3. 编辑 → 保存 → 发布(支付)
```

**问题**: 门槛太高,用户无法先体验产品

### 变更后(v2.1)

```
未登录用户:
1. 访问首页 → 直接"开始创作"(无需登录)
2. 选择场景 → 选择模板 → 编辑(全功能)
3. 点击"发布"时要求登录 + 支付
4. 数据临时存储 7 天,登录后自动迁移

已登录用户:
1. 访问首页 → 直接"开始创作"
2. 全程自动保存到账户
3. Dashboard 查看历史 + 额外功能(批量邮件)
```

**优势**: 
- 降低门槛,先体验后付费
- 符合 Freemium 模式
- 未登录用户数据不会丢失(7天内)

---

## 一、新增功能:场景选择页

### 1.1 路由与入口

**路由**: `/create`

**入口**:
- 首页所有 CTA 按钮("Start creating", "Create your invitation")
- 顶部导航的"开始创作"按钮

### 1.2 页面设计

```tsx
// /create/page.tsx
export default function CreatePage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      {/* 页面标题 */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-semibold mb-4">
          What are you celebrating?
        </h1>
        <p className="text-lg text-muted-foreground">
          Choose the moment you're making room for.
        </p>
      </div>
      
      {/* 场景卡片网格 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {scenes.map(scene => (
          <SceneCard key={scene.id} scene={scene} />
        ))}
      </div>
      
      {/* 底部说明 */}
      <p className="mt-12 text-center text-sm text-muted-foreground">
        No account needed to start. We'll ask when you're ready to publish.
      </p>
    </div>
  );
}

// 场景卡片组件
function SceneCard({ scene }) {
  return (
    <Link href={`/templates?scene=${scene.id}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-6 text-center space-y-4">
          {/* 图标 */}
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <scene.icon className="h-8 w-8" />
          </div>
          
          {/* 标题 */}
          <h3 className="text-xl font-semibold">{scene.name}</h3>
          
          {/* 描述 */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {scene.description}
          </p>
          
          {/* 示例标签 */}
          <div className="flex flex-wrap gap-2 justify-center">
            {scene.examples.map(ex => (
              <Badge key={ex} variant="secondary" className="text-xs">
                {ex}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### 1.3 场景数据

```typescript
const scenes = [
  {
    id: 'wedding',
    name: 'Wedding',
    description: 'Celebrate your love story with those who matter most.',
    icon: Heart,
    examples: ['Engagement', 'Ceremony', 'Reception'],
    color: '#f4e4c1', // 金色
  },
  {
    id: 'birthday',
    name: 'Birthday',
    description: 'Mark another year with the people who make it bright.',
    icon: Cake,
    examples: ['Milestone', 'Surprise', 'Kids party'],
    color: '#ffd1dc', // 粉色
  },
  {
    id: 'business',
    name: 'Business Event',
    description: 'Gather for growth, connection, and shared purpose.',
    icon: Briefcase,
    examples: ['Conference', 'Launch', 'Networking'],
    color: '#e0e7ff', // 蓝色
  },
  {
    id: 'other',
    name: 'Other Gathering',
    description: 'Any moment worth coming together for.',
    icon: Sparkles,
    examples: ['Baby shower', 'Graduation', 'Housewarming'],
    color: '#d4f4dd', // 绿色
  },
];
```

### 1.4 验收标准

- [ ] 页面显示 4 个场景卡片
- [ ] 卡片 hover 有提升动画
- [ ] 点击卡片跳转到 `/templates?scene={id}`
- [ ] 页面底部有"无需账户"提示
- [ ] 响应式布局正常(手机 2 列,桌面 4 列)
- [ ] 未登录状态可以访问

---

## 二、未登录用户数据存储方案

### 2.1 数据库新增表

```sql
-- 访客草稿表(临时存储,7天 TTL)
CREATE TABLE guest_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,  -- 从 Cookie 读取
  
  -- 邀请函内容(与 invitations.content 结构相同)
  scene VARCHAR(50) NOT NULL,
  title VARCHAR(200),
  content JSONB NOT NULL,
  template_id UUID REFERENCES templates(id),
  
  -- 活动信息
  event_date TIMESTAMP,
  event_location TEXT,
  
  -- 配置
  settings JSONB DEFAULT '{}',
  
  -- 过期管理
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,  -- created_at + 7 days
  
  -- 索引
  INDEX idx_session_id (session_id),
  INDEX idx_expires_at (expires_at)
);

-- 定时清理任务(每小时运行)
-- 方案 A: PostgreSQL 自带的 pg_cron 扩展
SELECT cron.schedule(
  'cleanup-guest-drafts',
  '0 * * * *',  -- 每小时
  'DELETE FROM guest_drafts WHERE expires_at < NOW()'
);

-- 方案 B: 应用层定时任务(Node.js cron)
// src/lib/cron.ts
import cron from 'node-cron';

cron.schedule('0 * * * *', async () => {
  await prisma.guestDraft.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  console.log('[Cron] Cleaned expired guest drafts');
});
```

### 2.2 Session ID 生成与管理

```typescript
// src/lib/session.ts
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

export function getOrCreateSessionId(): string {
  const cookieStore = cookies();
  let sessionId = cookieStore.get('carte_session_id')?.value;
  
  if (!sessionId) {
    sessionId = randomUUID();
    cookieStore.set('carte_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 天
    });
  }
  
  return sessionId;
}
```

### 2.3 API 调整(支持未登录用户)

```typescript
// POST /api/invitations
// 创建邀请函(登录用户 → invitations 表,未登录 → guest_drafts 表)

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();
  
  if (session?.user) {
    // 已登录用户 → 存到 invitations 表
    const invitation = await prisma.invitation.create({
      data: {
        userId: session.user.id,
        scene: body.scene,
        title: body.title,
        content: body.content,
        templateId: body.templateId,
        slug: generateSlug(),
        status: 'draft',
      },
    });
    
    return Response.json({ 
      success: true, 
      data: invitation 
    });
  } else {
    // 未登录用户 → 存到 guest_drafts 表
    const sessionId = getOrCreateSessionId();
    
    const draft = await prisma.guestDraft.create({
      data: {
        sessionId,
        scene: body.scene,
        title: body.title,
        content: body.content,
        templateId: body.templateId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 天后
      },
    });
    
    return Response.json({ 
      success: true, 
      data: draft,
      isGuest: true,
      expiresIn: '7 days',
    });
  }
}

// PATCH /api/invitations/:id
// 更新邀请函(同时支持 invitation ID 和 guest_draft ID)

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const body = await req.json();
  
  if (session?.user) {
    // 已登录 → 更新 invitations 表
    const invitation = await prisma.invitation.update({
      where: { 
        id: params.id,
        userId: session.user.id, // 确保用户只能改自己的
      },
      data: body,
    });
    
    return Response.json({ success: true, data: invitation });
  } else {
    // 未登录 → 更新 guest_drafts 表
    const sessionId = getOrCreateSessionId();
    
    const draft = await prisma.guestDraft.update({
      where: { 
        id: params.id,
        sessionId, // 确保用户只能改自己的
      },
      data: body,
    });
    
    return Response.json({ 
      success: true, 
      data: draft,
      isGuest: true,
    });
  }
}
```

### 2.4 前端状态管理(区分登录/未登录)

```typescript
// src/stores/invitationStore.ts
import { create } from 'zustand';

interface InvitationStore {
  invitation: Invitation | GuestDraft | null;
  isGuest: boolean;
  expiresAt?: Date;
  
  loadInvitation: (id: string) => Promise<void>;
  updateInvitation: (data: Partial<Invitation>) => Promise<void>;
  publishInvitation: () => Promise<void>;
}

export const useInvitationStore = create<InvitationStore>((set, get) => ({
  invitation: null,
  isGuest: false,
  
  loadInvitation: async (id: string) => {
    const res = await fetch(`/api/invitations/${id}`);
    const json = await res.json();
    
    set({ 
      invitation: json.data,
      isGuest: json.isGuest || false,
      expiresAt: json.data.expiresAt ? new Date(json.data.expiresAt) : undefined,
    });
  },
  
  updateInvitation: async (data) => {
    const { invitation } = get();
    if (!invitation) return;
    
    const res = await fetch(`/api/invitations/${invitation.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    const json = await res.json();
    set({ invitation: json.data });
  },
  
  publishInvitation: async () => {
    const { invitation, isGuest } = get();
    if (!invitation) return;
    
    if (isGuest) {
      // 未登录用户 → 跳转到登录页,带上 continue 参数
      const continueUrl = `/editor/${invitation.id}?action=publish`;
      window.location.href = `/login?continue=${encodeURIComponent(continueUrl)}`;
    } else {
      // 已登录用户 → 直接创建支付
      const res = await fetch(`/api/invitations/${invitation.id}/publish`, {
        method: 'POST',
      });
      const json = await res.json();
      
      // 跳转到 Stripe Checkout
      window.location.href = json.data.checkoutUrl;
    }
  },
}));
```

### 2.5 登录后迁移访客数据

```typescript
// POST /api/auth/migrate-guest-data
// 登录成功后,将 guest_drafts 迁移到 invitations 表

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const sessionId = getSessionIdFromCookie();
  if (!sessionId) {
    return Response.json({ success: true, migrated: 0 });
  }
  
  // 查找该 session_id 下的所有草稿
  const guestDrafts = await prisma.guestDraft.findMany({
    where: { sessionId },
  });
  
  // 迁移到 invitations 表
  const migrated = await Promise.all(
    guestDrafts.map(draft =>
      prisma.invitation.create({
        data: {
          userId: session.user.id,
          scene: draft.scene,
          title: draft.title,
          content: draft.content,
          templateId: draft.templateId,
          eventDate: draft.eventDate,
          eventLocation: draft.eventLocation,
          settings: draft.settings,
          slug: generateSlug(),
          status: 'draft',
        },
      })
    )
  );
  
  // 删除原草稿
  await prisma.guestDraft.deleteMany({
    where: { sessionId },
  });
  
  return Response.json({ 
    success: true, 
    migrated: migrated.length,
  });
}
```

---

## 三、新增功能:批量邮件发送

### 3.1 功能需求

**使用场景**: 
- 用户创建好邀请函后,想直接通过邮件发送给所有宾客
- 而不是复制链接一个个手动发

**入口**:
- Dashboard → 点击某个邀请函 → "Send via Email" 按钮
- 或者发布成功页面 → "Send to guests" 按钮

### 3.2 数据库设计

```sql
-- 邮件发送记录表
CREATE TABLE email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID REFERENCES invitations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 收件人信息
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(100),
  
  -- 邮件内容
  subject VARCHAR(500) NOT NULL,
  message TEXT,  -- 自定义邮件正文(可选)
  
  -- 状态追踪
  status VARCHAR(20) DEFAULT 'pending',  -- pending/sent/failed/bounced
  
  -- 交互追踪(可选,需要邮件服务商支持)
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  
  -- 错误信息
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_invitation (invitation_id),
  INDEX idx_status (status),
  INDEX idx_sent_at (sent_at)
);
```

### 3.3 API 设计

```typescript
// POST /api/invitations/:id/send-emails
// 批量发送邮件

interface SendEmailsRequest {
  recipients: Array<{
    email: string;
    name?: string;
  }>;
  subject?: string;      // 可选,默认用活动标题
  message?: string;      // 可选,自定义邮件正文
  sendImmediately?: boolean;  // 默认 false,先预览
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const invitation = await prisma.invitation.findUnique({
    where: { 
      id: params.id,
      userId: session.user.id,
      status: 'published',  // 只能发送已发布的
    },
  });
  
  if (!invitation) {
    return Response.json({ error: 'Invitation not found' }, { status: 404 });
  }
  
  const { recipients, subject, message, sendImmediately } = await req.json();
  
  // 默认主题和正文
  const finalSubject = subject || `You're invited: ${invitation.title}`;
  const finalMessage = message || generateDefaultMessage(invitation);
  
  // 创建发送记录
  const sends = await Promise.all(
    recipients.map(recipient =>
      prisma.emailSend.create({
        data: {
          invitationId: invitation.id,
          userId: session.user.id,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          subject: finalSubject,
          message: finalMessage,
          status: 'pending',
        },
      })
    )
  );
  
  if (sendImmediately) {
    // 立即发送(后台任务)
    await queueEmailSending(sends.map(s => s.id));
  }
  
  return Response.json({ 
    success: true, 
    totalRecipients: sends.length,
    preview: !sendImmediately,
  });
}

// 邮件模板
function generateDefaultMessage(invitation: Invitation): string {
  return `
<div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Hi there,</p>
  
  <p>You're invited to <strong>${invitation.title}</strong>!</p>
  
  <p>
    <strong>When:</strong> ${formatDate(invitation.eventDate)}<br/>
    <strong>Where:</strong> ${invitation.eventLocation}
  </p>
  
  <p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/i/${invitation.slug}" 
       style="display: inline-block; padding: 12px 24px; background: #18181b; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
      View invitation & RSVP
    </a>
  </p>
  
  <p style="color: #737373; font-size: 14px;">
    This invitation was sent via Carte. 
    <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #737373;">Learn more</a>
  </p>
</div>
  `.trim();
}

// 后台发送任务(使用队列,如 BullMQ / Inngest)
async function queueEmailSending(sendIds: string[]) {
  for (const sendId of sendIds) {
    await emailQueue.add('send-invitation-email', { sendId });
  }
}

// Worker 处理实际发送
emailQueue.process('send-invitation-email', async (job) => {
  const { sendId } = job.data;
  
  const send = await prisma.emailSend.findUnique({
    where: { id: sendId },
    include: { invitation: true },
  });
  
  if (!send) return;
  
  try {
    // 使用 Resend 发送
    await resend.emails.send({
      from: 'Carte <invitations@carte.app>',
      to: send.recipientEmail,
      subject: send.subject,
      html: send.message,
      tags: [
        { name: 'invitation_id', value: send.invitationId },
        { name: 'send_id', value: send.id },
      ],
    });
    
    // 更新状态
    await prisma.emailSend.update({
      where: { id: sendId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.emailSend.update({
      where: { id: sendId },
      data: {
        status: 'failed',
        errorMessage: error.message,
      },
    });
  }
});
```

### 3.4 前端界面

```tsx
// src/components/dashboard/SendEmailsDialog.tsx
function SendEmailsDialog({ invitation }: { invitation: Invitation }) {
  const [recipients, setRecipients] = useState<Array<{ email: string; name?: string }>>([]);
  const [subject, setSubject] = useState(invitation.title);
  const [message, setMessage] = useState('');
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mail className="mr-2 h-4 w-4" />
          Send via Email
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send invitation via email</DialogTitle>
          <DialogDescription>
            We'll send your invitation link to each recipient
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 收件人列表 */}
          <div>
            <Label>Recipients</Label>
            <Textarea 
              placeholder="Enter email addresses, one per line&#10;john@example.com&#10;jane@example.com"
              rows={5}
              value={recipients.map(r => r.email).join('\n')}
              onChange={(e) => {
                const emails = e.target.value.split('\n').filter(Boolean);
                setRecipients(emails.map(email => ({ email })));
              }}
            />
            <p className="mt-1 text-sm text-muted-foreground">
              {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {/* 主题 */}
          <div>
            <Label>Email subject</Label>
            <Input 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          {/* 自定义消息(可选) */}
          <div>
            <Label>Personal message (optional)</Label>
            <Textarea 
              placeholder="Add a personal note..."
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          {/* 预览 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Each email will include the invitation link and details.
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => {}}>
            Preview email
          </Button>
          <Button onClick={handleSend}>
            Send to {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 3.5 验收标准

- [ ] Dashboard 可以看到"Send via Email"按钮
- [ ] 点击后弹出对话框
- [ ] 可以输入多个邮箱(每行一个)
- [ ] 可以自定义主题和正文
- [ ] 点击"Send"后后台发送
- [ ] 发送状态可以在 Dashboard 查看
- [ ] 邮件内容包含邀请函链接
- [ ] 邮件格式美观(HTML)
- [ ] 支持追踪打开和点击(可选)

---

## 四、已登录用户的额外功能清单

### 4.1 功能对比表

| 功能 | 未登录用户 | 已登录用户 |
|-----|----------|----------|
| 选择场景 | ✅ | ✅ |
| 选择模板 | ✅ | ✅ |
| 编辑邀请函 | ✅ | ✅ |
| AI 文案生成 | ✅ | ✅ |
| 预览 | ✅ | ✅ |
| 发布(需支付) | ⚠️ 发布时要求登录 | ✅ |
| 保存草稿 | ✅ 临时存储 7 天 | ✅ 永久存储 |
| 查看历史邀请函 | ❌ | ✅ |
| 查看 RSVP 数据 | ❌ | ✅ |
| 导出 RSVP 为 CSV | ❌ | ✅ |
| 批量邮件发送 | ❌ | ✅ |
| 编辑已发布的邀请函 | ❌ | ✅ |
| 复制/克隆邀请函 | ❌ | ✅ |
| 访问统计 | ❌ | ✅ |

### 4.2 Dashboard 增强

```tsx
// src/app/dashboard/page.tsx
export default async function DashboardPage() {
  const session = await auth();
  const invitations = await getInvitations(session.user.id);
  
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* 顶部统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total RSVPs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.rsvps}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.views}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* 邀请函列表 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Your Invitations</h2>
        <Button asChild>
          <Link href="/create">
            <Plus className="mr-2 h-4 w-4" />
            Create new
          </Link>
        </Button>
      </div>
      
      {/* 筛选 */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* 卡片网格 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {invitations.map(invitation => (
          <InvitationCard key={invitation.id} invitation={invitation} />
        ))}
      </div>
    </div>
  );
}

function InvitationCard({ invitation }) {
  return (
    <Card>
      {/* 缩略图 */}
      <div className="aspect-[4/5] overflow-hidden rounded-t-lg bg-secondary">
        <InvitationThumbnail invitation={invitation} />
      </div>
      
      <CardHeader>
        <CardTitle className="line-clamp-1">{invitation.title}</CardTitle>
        <CardDescription>
          {formatDate(invitation.eventDate)} · {invitation.scene}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {invitation.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {invitation._count.rsvps}
          </span>
          <Badge variant={invitation.status === 'published' ? 'default' : 'secondary'}>
            {invitation.status}
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/editor/${invitation.id}`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/i/${invitation.slug}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View invitation
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/invitations/${invitation.id}/rsvps`}>
                <Users className="mr-2 h-4 w-4" />
                View RSVPs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSendEmails(invitation)}>
              <Mail className="mr-2 h-4 w-4" />
              Send via email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDuplicate(invitation)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(invitation)}
              className="text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
```

---

## 五、更新后的验收清单

### 5.1 未登录用户流程

- [ ] 首页 CTA 指向 `/create`(不是 `/login`)
- [ ] 场景选择页可以无登录访问
- [ ] 模板库可以无登录访问
- [ ] 编辑器可以无登录使用(全功能)
- [ ] 草稿自动保存到 `guest_drafts` 表
- [ ] 页面顶部有提示"Not logged in. Your draft will be saved for 7 days."
- [ ] 点击"发布"时跳转到登录页,带 `?continue=` 参数
- [ ] 登录后自动迁移 `guest_drafts` 到 `invitations` 表
- [ ] 迁移后继续支付流程

### 5.2 已登录用户增强功能

- [ ] Dashboard 显示统计卡片(总数/已发布/RSVP/浏览量)
- [ ] Dashboard 可以按状态筛选(All/Published/Draft)
- [ ] 邀请函卡片显示浏览量和 RSVP 数
- [ ] 可以点击"Send via Email"批量发送邮件
- [ ] 邮件发送对话框可输入收件人/主题/正文
- [ ] 邮件发送后可以在 Dashboard 查看发送状态
- [ ] 可以导出 RSVP 为 CSV
- [ ] 可以复制/删除邀请函
- [ ] 编辑已发布的邀请函会自动刷新 H5 缓存

### 5.3 定时任务

- [ ] 每小时清理过期的 `guest_drafts`(expires_at < NOW())
- [ ] 邮件发送使用队列(不阻塞 API 响应)
- [ ] 邮件发送失败有重试机制(最多 3 次)

---

## 六、Prisma Schema 更新

```prisma
// 在原有 schema 基础上新增:

// 访客草稿表
model GuestDraft {
  id        String   @id @default(uuid())
  sessionId String   @map("session_id")
  
  scene     String
  title     String?
  content   Json
  templateId String?  @map("template_id")
  template   Template? @relation(fields: [templateId], references: [id], onDelete: SetNull)
  
  eventDate     DateTime? @map("event_date")
  eventLocation String?   @map("event_location")
  
  settings Json @default("{}")
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  expiresAt DateTime @map("expires_at")
  
  @@index([sessionId])
  @@index([expiresAt])
  @@map("guest_drafts")
}

// 邮件发送记录表
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

// 更新 Invitation 模型(添加关联)
model Invitation {
  // ... 原有字段
  
  emailSends EmailSend[] // 新增
}

// 更新 User 模型(添加关联)
model User {
  // ... 原有字段
  
  emailSends EmailSend[] // 新增
}

// 更新 Template 模型(添加关联)
model Template {
  // ... 原有字段
  
  guestDrafts GuestDraft[] // 新增
}
```

---

## 七、环境变量新增

```bash
# .env.local

# 邮件服务(Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="invitations@carte.app"

# Session Cookie
CARTE_SESSION_SECRET="generate-a-random-secret-here"

# 访客草稿过期时间(天)
GUEST_DRAFT_TTL_DAYS=7

# 邮件队列(可选,用 Redis 或 BullMQ)
REDIS_QUEUE_URL="redis://localhost:6379"
```

---

## 八、开发优先级(更新)

### P0 - 必须完成才能上线

1. ✅ 首页(已完成)
2. 🔲 场景选择页(`/create`)
3. 🔲 模板库页面(至少 3 个模板)
4. 🔲 编辑器(简化版,能改文字/图片)
5. 🔲 H5 邀请函渲染 + RSVP 表单
6. 🔲 未登录用户数据存储(`guest_drafts` 表)
7. 🔲 登录 + 支付流程
8. 🔲 访客数据迁移(登录后)

### P1 - 上线后快速补充

9. 🔲 Dashboard(查看历史邀请函)
10. 🔲 RSVP 数据查看与导出
11. 🔲 批量邮件发送
12. 🔲 定时清理过期草稿
13. 🔲 AI 文案生成

### P2 - 后续迭代

14. 🔲 更多模板
15. 🔲 高级编辑器功能(拖拽/图层)
16. 🔲 访问统计
17. 🔲 多语言支持(中文)

---

**文档版本**: v2.1  
**最后更新**: 2026-08-30  
**适用于**: Carte MVP 后续开发  
**与 tech-spec-detailed.md 的关系**: 这是补充文档,添加了"未登录用户"和"批量邮件"两个核心功能
