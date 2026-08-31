# Carte 设计规范与审美约束

**文档版本**: v1.0  
**最后更新**: 2026-08-30  
**适用范围**: 所有 Web 端界面(工作台/Dashboard/H5 邀请函)

---

## 目录

1. [核心设计原则](#一核心设计原则)
2. [UI 组件库规范](#二ui-组件库规范)
3. [色彩系统](#三色彩系统)
4. [字体系统](#四字体系统)
5. [布局与间距](#五布局与间距)
6. [交互规范](#六交互规范)
7. [动画与过渡](#七动画与过渡)
8. [响应式设计](#八响应式设计)
9. [禁止使用清单](#九禁止使用清单)
10. [参考案例](#十参考案例)

---

## 一、核心设计原则

### 1.1 设计哲学

**现代极简主义**:
- 少即是多,避免视觉噪音
- 留白是设计的一部分,不是空白
- 每个元素都有存在的理由

**高端感**:
- 精致的细节(圆角/阴影/渐变)
- 克制的配色(不超过 3 个主色)
- 高质量的图片和图标

**易用性优先**:
- 清晰的视觉层级
- 一致的交互模式
- 明确的操作反馈

### 1.2 目标用户审美

**欧美市场**(首要目标):
- 偏好简洁、大胆的设计
- 喜欢大面积留白
- 重视品牌调性和质感

**参考风格**:
- Linear(项目管理工具)— 极简、流畅、动画细腻
- Stripe(支付平台)— 专业、克制、高级感
- Notion(笔记工具)— 简洁、灵活、现代
- Vercel(开发平台)— 黑白灰为主、强调速度感

**避免的风格**:
- ❌ 国内 SaaS 的"信息密集"风格(表格堆砌、按钮过多)
- ❌ 过时的扁平化设计(纯色块、无深度)
- ❌ 过度装饰的 UI(渐变过多、阴影过重)

---

## 二、UI 组件库规范

### 2.1 强制使用 shadcn/ui

**为什么选 shadcn/ui**:
- 基于 Radix UI(无障碍性好)
- Tailwind CSS 原生集成
- 组件可定制(不是 NPM 包,是源码复制)
- 设计现代、精致,符合欧美审美

**安装与配置**:
```bash
npx shadcn-ui@latest init
```

**必须使用 shadcn/ui 的组件**(不允许自己写):
- Button(按钮)
- Input / Textarea(输入框)
- Select / Combobox(下拉选择)
- Dialog / AlertDialog(弹窗/确认框)
- Popover / Tooltip(浮层/提示)
- Dropdown Menu(下拉菜单)
- Tabs(标签页)
- Card(卡片)
- Badge(徽章)
- Avatar(头像)
- Progress(进度条)
- Skeleton(加载占位)
- Toast(消息提示)
- Table(表格)
- Form(表单,结合 react-hook-form)

**组件使用示例**:
```tsx
// ✅ 正确: 使用 shadcn/ui 组件
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Button variant="default" size="lg">
  创建邀请函
</Button>

// ❌ 错误: 自己写 button 或用原生 button
<button className="...">创建邀请函</button>
```

### 2.2 shadcn/ui 主题配置

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
};
```

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}
```

### 2.3 图标库

**使用 Lucide React**(shadcn/ui 官方推荐):
```bash
npm install lucide-react
```

```tsx
import { Check, X, Plus, Trash2, Edit, Download } from 'lucide-react';

<Button>
  <Plus className="mr-2 h-4 w-4" />
  创建邀请函
</Button>
```

**禁止使用**:
- ❌ Font Awesome(风格过时)
- ❌ Material Icons(太 Google 化)
- ❌ 自己画 SVG 图标(除非特殊品牌 icon)

---

## 三、色彩系统

### 3.1 主色调(Primary)

**品牌主色**(建议):
```css
/* 深邃黑 - 高级感 */
--primary: 240 5.9% 10%;  /* hsl(240, 5.9%, 10%) = #18181b */
```

**备选方案**(如果需要更有品牌感):
```css
/* 选项 A: 深蓝灰 - 专业、可信 */
--primary: 215 25% 27%;  /* #354968 */

/* 选项 B: 深紫 - 创意、高端 */
--primary: 264 40% 35%;  /* #5235A3 */

/* 选项 C: 深绿 - 自然、温和 */
--primary: 160 50% 25%;  /* #204D3F */
```

**使用规则**:
- 主要操作按钮(CTA)
- 选中状态
- 链接文字
- 品牌强调元素

### 3.2 辅助色

```css
/* 成功 */
--success: 142 76% 36%;  /* #16a34a */

/* 警告 */
--warning: 38 92% 50%;   /* #f59e0b */

/* 错误 */
--destructive: 0 84% 60%; /* #ef4444 */

/* 信息 */
--info: 217 91% 60%;     /* #3b82f6 */
```

### 3.3 中性色(背景/文字/边框)

```css
/* 背景层级 */
--background: 0 0% 100%;        /* 主背景 #ffffff */
--card: 0 0% 100%;              /* 卡片背景 #ffffff */
--secondary: 240 4.8% 95.9%;    /* 次级背景 #f5f5f5 */
--muted: 240 4.8% 95.9%;        /* 静音背景 #f5f5f5 */

/* 文字层级 */
--foreground: 240 10% 3.9%;     /* 主文字 #0a0a0a */
--muted-foreground: 240 3.8% 46.1%;  /* 次要文字 #737373 */

/* 边框 */
--border: 240 5.9% 90%;         /* #e5e5e5 */
--input: 240 5.9% 90%;          /* 输入框边框 */
```

### 3.4 配色规则

**页面配色比例**(60-30-10 法则):
- 60%: 中性色(白/灰背景)
- 30%: 次级色(卡片/容器背景)
- 10%: 主色(按钮/强调元素)

**文字颜色层级**:
- 标题: `text-foreground`(接近黑)
- 正文: `text-foreground`
- 辅助文字: `text-muted-foreground`(灰色)
- 禁用文字: `text-muted-foreground opacity-50`

**避免**:
- ❌ 纯黑(#000000)和纯白(#ffffff)直接接触(对比太强)
- ❌ 低对比度组合(灰色文字 + 灰色背景)
- ❌ 彩虹色(页面中超过 3 个主色)

---

## 四、字体系统

### 4.1 英文字体(主要)

**首选**: Inter(现代、几何、易读)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

**备选**(如果 Inter 不适合):
- **Geist**(Vercel 的字体,极简、未来感)
- **DM Sans**(几何、温和)
- **Space Grotesk**(个性、现代)

**禁止使用**:
- ❌ Arial / Helvetica(过时)
- ❌ Times New Roman(太正式)
- ❌ Comic Sans / Papyrus(太随意)
- ❌ 中文字体用于英文(如"微软雅黑"显示英文)

### 4.2 中文字体(辅助)

**首选**: 思源黑体 / Noto Sans SC

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');

:lang(zh-CN) {
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
```

**备选**:
- **苹方 / PingFang SC**(macOS/iOS 默认,优雅)
- **阿里巴巴普惠体**(开源,现代)

**禁止使用**:
- ❌ 宋体(太传统)
- ❌ 楷体(太随意)
- ❌ 微软雅黑作为唯一中文字体(显示质量差)

### 4.3 字体大小规范

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    fontSize: {
      // 主要尺寸(使用这些)
      'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px - 辅助说明
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px - 次要文字
      'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px - 正文(默认)
      'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px - 小标题
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px - 标题
      '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px - 大标题
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px - 页面标题
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px - Hero 标题
      '5xl': ['3rem', { lineHeight: '1' }],           // 48px - 超大标题
    },
  },
};
```

**使用规则**:
- 页面主标题: `text-3xl font-semibold`
- 卡片标题: `text-xl font-semibold`
- 正文: `text-base`(不写 class,这是默认值)
- 辅助说明: `text-sm text-muted-foreground`
- 占位符/标签: `text-xs text-muted-foreground`

**禁止**:
- ❌ 使用奇怪的尺寸(如 17px, 19px)
- ❌ 正文小于 14px(除非是辅助文字)
- ❌ 标题大于 48px(除非是营销页 Hero)

### 4.4 字重(Font Weight)

```typescript
fontWeight: {
  normal: '400',    // 正文
  medium: '500',    // 次要强调
  semibold: '600',  // 标题/按钮
  bold: '700',      // 强调标题
}
```

**使用规则**:
- 正文: `font-normal`(400)
- 按钮文字: `font-medium`(500)
- 标题: `font-semibold`(600)
- 特别强调: `font-bold`(700)

**禁止**:
- ❌ 使用 100/200/300(太细,可读性差)
- ❌ 使用 800/900(太粗,不优雅)

---

## 五、布局与间距

### 5.1 间距系统(Spacing Scale)

使用 Tailwind 的 4px 基准倍数:

```typescript
spacing: {
  '0': '0px',
  '1': '0.25rem',  // 4px
  '2': '0.5rem',   // 8px
  '3': '0.75rem',  // 12px
  '4': '1rem',     // 16px
  '6': '1.5rem',   // 24px
  '8': '2rem',     // 32px
  '12': '3rem',    // 48px
  '16': '4rem',    // 64px
  '24': '6rem',    // 96px
}
```

**常用间距规则**:
- 相关元素之间: `gap-2` 或 `gap-3`(8-12px)
- 段落/卡片内边距: `p-4` 或 `p-6`(16-24px)
- 页面容器内边距: `p-6` 或 `p-8`(24-32px)
- 页面分区间隔: `mb-8` 或 `mb-12`(32-48px)

### 5.2 布局容器

```tsx
// 页面主容器(最大宽度 + 居中)
<div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  {/* 内容 */}
</div>

// Dashboard 两栏布局
<div className="flex min-h-screen">
  {/* 侧边栏 */}
  <aside className="w-64 border-r bg-card">
    <nav className="p-4">...</nav>
  </aside>
  
  {/* 主内容区 */}
  <main className="flex-1 p-8">
    {/* 内容 */}
  </main>
</div>
```

### 5.3 网格系统

```tsx
// 卡片网格(响应式)
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {templates.map(t => (
    <Card key={t.id}>...</Card>
  ))}
</div>

// 表单两栏布局
<div className="grid gap-4 md:grid-cols-2">
  <div>
    <Label>姓名</Label>
    <Input />
  </div>
  <div>
    <Label>邮箱</Label>
    <Input />
  </div>
</div>
```

### 5.4 圆角(Border Radius)

```typescript
borderRadius: {
  'none': '0',
  'sm': '0.125rem',   // 2px - 小元素(badge)
  'DEFAULT': '0.25rem', // 4px - 一般元素
  'md': '0.375rem',   // 6px - 卡片/按钮
  'lg': '0.5rem',     // 8px - 大卡片
  'xl': '0.75rem',    // 12px - 容器
  '2xl': '1rem',      // 16px - 大容器
  'full': '9999px',   // 圆形/胶囊
}
```

**使用规则**:
- 按钮: `rounded-md`(6px)
- 输入框: `rounded-md`(6px)
- 卡片: `rounded-lg`(8px)
- 对话框: `rounded-xl`(12px)
- 头像: `rounded-full`(圆形)

**禁止**:
- ❌ 混用多种圆角(页面中只用 2-3 种)
- ❌ 过度圆角(除非是特殊品牌风格)

### 5.5 阴影(Shadow)

```typescript
boxShadow: {
  'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
}
```

**使用规则**:
- 卡片悬停: `hover:shadow-md`
- 弹窗: `shadow-xl`
- 下拉菜单: `shadow-lg`
- 普通卡片: `shadow-sm` 或不用

**禁止**:
- ❌ 过重的阴影(像是飘在空中)
- ❌ 彩色阴影(除非品牌特色)

---

## 六、交互规范

### 6.1 按钮状态

```tsx
// shadcn/ui Button 自带状态样式,直接使用
<Button variant="default">主要操作</Button>
<Button variant="secondary">次要操作</Button>
<Button variant="outline">边框按钮</Button>
<Button variant="ghost">幽灵按钮</Button>
<Button variant="destructive">危险操作</Button>

// 加载状态
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  处理中...
</Button>
```

**状态要求**:
- ✅ 必须有 hover 状态(颜色加深或阴影)
- ✅ 必须有 active 状态(按下时颜色更深)
- ✅ 必须有 disabled 状态(灰色 + 禁止点击)
- ✅ 加载时必须有 loading 动画(spinner)

### 6.2 表单验证

```tsx
// 使用 shadcn/ui Form + react-hook-form + zod
<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>邮箱</FormLabel>
        <FormControl>
          <Input placeholder="your@email.com" {...field} />
        </FormControl>
        <FormDescription>
          我们会向此邮箱发送邀请函链接
        </FormDescription>
        <FormMessage /> {/* 自动显示错误 */}
      </FormItem>
    )}
  />
</Form>
```

**验证规则**:
- ✅ 实时验证(onBlur 或 onChange)
- ✅ 错误信息在输入框下方显示(红色文字)
- ✅ 成功状态有绿色边框(可选)
- ❌ 禁止使用 `alert()` 显示错误

### 6.3 反馈提示

```tsx
// 使用 shadcn/ui Toast(不是 alert)
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

toast({
  title: '保存成功',
  description: '邀请函已保存为草稿',
});

toast({
  variant: 'destructive',
  title: '删除失败',
  description: '网络错误,请稍后重试',
});
```

**禁止使用**:
- ❌ `alert()` / `confirm()` / `prompt()`(原生弹窗,太丑)
- ❌ 全屏遮罩提示(除非是关键操作)
- ❌ 不自动消失的通知(用户需要手动关闭)

### 6.4 确认对话框

```tsx
// 使用 shadcn/ui AlertDialog
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">删除邀请函</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确认删除?</AlertDialogTitle>
      <AlertDialogDescription>
        此操作无法撤销。该邀请函和所有 RSVP 数据将被永久删除。
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        删除
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 6.5 加载状态

```tsx
// 页面级加载
{isLoading && (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
)}

// 卡片加载(Skeleton)
import { Skeleton } from '@/components/ui/skeleton';

<Card>
  <Skeleton className="h-48 w-full" />
  <div className="p-4">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="mt-2 h-4 w-1/2" />
  </div>
</Card>
```

**要求**:
- ✅ 首次加载显示 Skeleton(不是空白)
- ✅ 按钮加载显示 Spinner + 禁用点击
- ✅ 列表加载显示至少 3 个 Skeleton 卡片
- ❌ 禁止全屏 Loading(除非必要)

---

## 七、动画与过渡

### 7.1 过渡时长

```typescript
transitionDuration: {
  'fast': '150ms',      // 快速交互(按钮 hover)
  'base': '200ms',      // 一般过渡(默认)
  'slow': '300ms',      // 慢速过渡(对话框进入)
}
```

**使用规则**:
- 按钮/链接 hover: `transition-colors duration-fast`
- 下拉菜单展开: `transition-all duration-base`
- 对话框/侧边栏: `transition-transform duration-slow`

### 7.2 缓动函数

```typescript
transitionTimingFunction: {
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',     // 推荐,自然
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)', // 平滑
}
```

**禁止**:
- ❌ `linear`(机械感)
- ❌ `ease-in`(不自然)
- ❌ 过长的动画(> 500ms,除非特殊场景)

### 7.3 微交互动画

```tsx
// Hover 提升
<Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1">
  {/* 卡片内容 */}
</Card>

// 按钮按下
<Button className="active:scale-95 transition-transform">
  点击我
</Button>

// 淡入
<div className="animate-in fade-in duration-300">
  {/* 内容 */}
</div>
```

**推荐使用**:
- 卡片 hover 提升(translate-y + shadow)
- 按钮按下缩放(scale-95)
- 列表项淡入(fade-in + slide-in)
- 骨架屏脉动(pulse)

**禁止使用**:
- ❌ 旋转动画(除了 loading spinner)
- ❌ 弹跳动画(bounce,太幼稚)
- ❌ 闪烁动画(blink,可访问性问题)

---

## 八、响应式设计

### 8.1 断点

```typescript
screens: {
  'sm': '640px',   // 手机横屏 / 小平板
  'md': '768px',   // 平板
  'lg': '1024px',  // 小笔记本
  'xl': '1280px',  // 桌面
  '2xl': '1536px', // 大屏
}
```

### 8.2 移动优先(Mobile First)

```tsx
// ✅ 正确: 默认手机,逐渐增强
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 手机 1 列,平板 2 列,桌面 4 列 */}
</div>

// ❌ 错误: 桌面优先
<div className="grid-cols-4 sm:grid-cols-1">
  {/* 不要这样写 */}
</div>
```

### 8.3 触摸友好(移动端)

```tsx
// 按钮/点击区域最小 44x44px
<Button className="min-h-[44px] min-w-[44px]">
  <Icon />
</Button>

// 间距足够大(防止误触)
<div className="flex gap-4"> {/* 至少 16px 间距 */}
  <Button>A</Button>
  <Button>B</Button>
</div>
```

---

## 九、禁止使用清单

### 9.1 组件层面

**严格禁止**:
- ❌ 原生 HTML 元素作为交互组件:
  - `<button>` → 用 `<Button>` from shadcn/ui
  - `<input>` → 用 `<Input>` from shadcn/ui
  - `<select>` → 用 `<Select>` from shadcn/ui
  - `<dialog>` → 用 `<Dialog>` from shadcn/ui
- ❌ 原生弹窗:
  - `alert()` / `confirm()` / `prompt()`
- ❌ 低质量 UI 库:
  - Material-UI(太 Google,不符合品牌调性)
  - Ant Design(太国内 SaaS,信息密度过高)
  - Bootstrap(过时)
  - jQuery UI(古董)

### 9.2 样式层面

**严格禁止**:
- ❌ 内联样式(除非动态计算):
  ```tsx
  // ❌ 错误
  <div style={{ color: 'red', fontSize: '16px' }}>
  
  // ✅ 正确
  <div className="text-red-500 text-base">
  ```
- ❌ CSS-in-JS(styled-components / emotion):
  - 全部用 Tailwind CSS
- ❌ 传统 CSS 文件(除了 globals.css):
  - 不要创建 `component.css`
- ❌ 魔法数字(硬编码的像素值):
  ```tsx
  // ❌ 错误
  <div style={{ marginTop: '23px' }}>
  
  // ✅ 正确
  <div className="mt-6"> {/* 24px,符合 spacing scale */}
  ```

### 9.3 交互层面

**严格禁止**:
- ❌ 没有反馈的操作:
  - 点击按钮后无任何反应(至少要 loading 状态)
  - 表单提交成功无提示
- ❌ 突兀的跳转:
  - 删除后直接跳转(应该先 toast 确认,再跳转)
- ❌ 不可访问的交互:
  - 纯鼠标交互(必须支持键盘)
  - 无 `aria-label` 的图标按钮
- ❌ 假按钮:
  - `<div onClick>` → 用 `<Button>`

### 9.4 文案层面

**严格禁止**:
- ❌ 技术术语暴露给用户:
  - "请求失败" → "网络错误,请稍后重试"
  - "500 错误" → "服务暂时不可用"
- ❌ 模糊的提示:
  - "操作失败" → "删除失败:邀请函不存在"
  - "成功" → "邀请函已保存"
- ❌ 中英文混杂(同一句话):
  - "点击 Save 按钮" → "点击保存按钮" 或 "Click Save"

---

## 十、参考案例

### 10.1 优秀设计参考(必须学习)

**整体风格**:
1. **Linear** (linear.app) — 项目管理
   - 学习: 极简布局、流畅动画、黑白灰为主
2. **Stripe** (stripe.com) — 支付平台
   - 学习: 专业感、文档排版、渐变使用
3. **Vercel** (vercel.com) — 开发平台
   - 学习: 黑白对比、速度感、极简 UI
4. **Notion** (notion.so) — 笔记工具
   - 学习: 灵活布局、卡片设计、图标使用

**具体组件**:
- **按钮**: Linear 的按钮(圆角适中、阴影克制)
- **表单**: Stripe 的表单(边框清晰、标签对齐)
- **卡片**: Notion 的卡片(留白充足、阴影柔和)
- **导航**: Vercel 的导航(简洁、高对比度)

### 10.2 Dashboard 布局参考

```
┌──────────────────────────────────────────────────────────┐
│  Logo   导航链接1  导航链接2             头像  通知  设置 │ ← 顶部导航栏(64px 高)
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  页面标题                          [+ 创建按钮]  │    │ ← 页面头部(80px)
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  卡片 1   │ │  卡片 2   │ │  卡片 3   │ │  卡片 4   │  │ ← 卡片网格(24px gap)
│  │          │ │          │ │          │ │          │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  卡片 5   │ │  卡片 6   │ │  卡片 7   │ │  卡片 8   │  │
│  │          │ │          │ │          │ │          │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 10.3 编辑器布局参考

```
┌──────────────────────────────────────────────────────────┐
│  [撤销] [重做]  [保存]                    [预览] [发布]   │ ← 工具栏(56px)
├─────────┬───────────────────────────────────┬────────────┤
│         │                                   │            │
│  图层   │         画布区域(Fabric.js)        │  属性面板  │
│  列表   │                                   │            │
│         │  ┌─────────────────────────┐     │  [配色]    │
│  □ 背景 │  │                         │     │  [字体]    │
│  □ 装饰1│  │    邀请函预览区域        │     │  [位置]    │
│  ■ 标题 │  │                         │     │  [大小]    │
│  □ 正文 │  │                         │     │            │
│  □ 图片 │  └─────────────────────────┘     │  [锁定]    │
│         │                                   │  [隐藏]    │
│ (240px) │           (flex-1)                │  (320px)   │
└─────────┴───────────────────────────────────┴────────────┘
```

---

## 十一、验收清单(设计规范)

在代码 Review 或验收时,请逐项检查:

**组件使用**:
- [ ] 所有按钮使用 shadcn/ui Button 组件
- [ ] 所有输入框使用 shadcn/ui Input/Textarea 组件
- [ ] 所有弹窗使用 shadcn/ui Dialog/AlertDialog 组件
- [ ] 所有消息提示使用 shadcn/ui Toast(不是 alert)
- [ ] 所有图标使用 Lucide React(不是 Font Awesome)

**色彩系统**:
- [ ] 主色调统一(只有一个品牌主色)
- [ ] 文字颜色层级清晰(标题/正文/辅助文字)
- [ ] 没有使用纯黑(#000)或随意的灰色
- [ ] 成功/错误/警告色符合规范

**字体系统**:
- [ ] 英文使用 Inter 或 Geist
- [ ] 中文使用思源黑体或 Noto Sans SC
- [ ] 字体大小在规范的 scale 内(12/14/16/18/20/24/30/36/48px)
- [ ] 字重在规范范围内(400/500/600/700)
- [ ] 正文不小于 14px

**布局与间距**:
- [ ] 间距使用 4px 倍数(4/8/12/16/24/32/48px)
- [ ] 圆角统一(按钮/卡片/输入框)
- [ ] 阴影克制(不过重)
- [ ] 响应式布局正常(手机/平板/桌面)

**交互反馈**:
- [ ] 按钮有 hover/active/disabled 状态
- [ ] 表单验证错误在输入框下方显示
- [ ] 加载时有 loading 状态(不是空白)
- [ ] 操作成功/失败有 Toast 提示

**禁止项检查**:
- [ ] 没有使用原生 button/input/select/alert
- [ ] 没有使用内联样式(除了动态计算)
- [ ] 没有使用 Material-UI/Ant Design/Bootstrap
- [ ] 没有魔法数字(硬编码像素值)
- [ ] 没有中英文混杂文案

---

**文档版本**: v1.0  
**最后更新**: 2026-08-30  
**适用于**: Carte 项目所有 Web 端界面  
**维护者**: 产品 Owner  

**与 tech-spec-detailed.md 的关系**:
- tech-spec-detailed.md: 功能规格 + 技术实现
- design-guidelines.md: 视觉规范 + 审美约束

两份文档配合使用,确保最终产品既功能完整,又视觉精致。
