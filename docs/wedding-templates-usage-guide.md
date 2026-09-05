# 🚀 婚礼模板导入和使用指南

## 快速开始

### 1. 导入模板到数据库

创建一个脚本来导入所有模板：

```typescript
// scripts/import-wedding-templates.ts
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

const templateFiles = [
  'wedding-romantic.json',
  'wedding-luxe.json',
  'wedding-garden.json',
  'wedding-sunset.json',
  'wedding-minimal.json',
  'wedding-vintage.json',
  'wedding-ocean.json',
  'wedding-golden.json',
  'wedding-forest.json',
  'wedding-starry.json',
];

async function importTemplates() {
  for (const file of templateFiles) {
    const filePath = join(__dirname, '../prisma/templates', file);
    const template = JSON.parse(readFileSync(filePath, 'utf-8'));
    
    await prisma.template.create({
      data: {
        id: template.id,
        name: template.name,
        scene: template.scene,
        style: template.style,
        description: template.description,
        tags: template.tags,
        thumbnailUrl: template.thumbnailUrl,
        previewUrl: template.previewUrl,
        canvas: template.canvas,
        layers: template.layers,
        variables: template.variables,
        colorSchemes: template.colorSchemes,
        settings: template.settings,
        featured: true,
        published: true,
      },
    });
    
    console.log(`✓ 导入模板: ${template.name}`);
  }
  
  console.log('\n🎉 所有模板导入成功！');
}

importTemplates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 2. 运行导入脚本

```bash
npx tsx scripts/import-wedding-templates.ts
```

---

## 模板使用示例

### 在编辑器中加载模板

```typescript
// app/editor/[id]/page.tsx
import { prisma } from '@/lib/prisma';

export default async function EditorPage({ params }: { params: { id: string } }) {
  const template = await prisma.template.findUnique({
    where: { id: params.id }
  });
  
  return <Editor initialTemplate={template} />;
}
```

### 创建邀请函实例

```typescript
// 用户点击"使用模板"按钮
async function useTemplate(templateId: string) {
  const response = await fetch('/api/invitations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId }),
  });
  
  const invitation = await response.json();
  router.push(`/editor/${invitation.id}`);
}
```

---

## 模板预览

### 生成缩略图

可以使用 Puppeteer 或 Canvas 生成预览图：

```typescript
// scripts/generate-thumbnails.ts
import puppeteer from 'puppeteer';

async function generateThumbnail(templateId: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // 设置视口
  await page.setViewport({ width: 750, height: 1334 });
  
  // 渲染模板
  await page.goto(`http://localhost:3000/preview/${templateId}`);
  
  // 截图
  await page.screenshot({
    path: `public/templates/${templateId}/thumbnail.png`,
    clip: { x: 0, y: 0, width: 750, height: 1334 }
  });
  
  await browser.close();
}
```

---

## 模板筛选和展示

### 在模板页面展示

```typescript
// app/templates/page.tsx
import { prisma } from '@/lib/prisma';

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    where: { 
      scene: 'wedding',
      published: true 
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return (
    <div className="grid grid-cols-3 gap-6">
      {templates.map(template => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}
```

### 按风格筛选

```typescript
const styles = ['romantic', 'luxury', 'botanical', 'minimal', 'vintage', 'coastal', 'rustic'];

const filteredTemplates = await prisma.template.findMany({
  where: { 
    scene: 'wedding',
    style: { in: selectedStyles }
  }
});
```

---

## 动画实现

### CSS动画定义

在 `globals.css` 中添加动画：

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes shimmer {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
  100% { filter: brightness(1); }
}

@keyframes sway {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(3deg); }
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.1); }
  50% { transform: scale(1); }
  75% { transform: scale(1.05); }
}
```

### 在组件中应用动画

```typescript
// components/invitation-renderer.tsx
function renderLayer(layer: Layer) {
  const animationStyle = layer.animation ? {
    animation: `${layer.animation.type} ${layer.animation.duration}ms ease-in-out`,
    animationDelay: `${layer.animation.delay || 0}ms`,
    animationIterationCount: layer.animation.iterationCount || 1,
  } : {};
  
  return (
    <div 
      style={{
        ...animationStyle,
        position: 'absolute',
        left: layer.position.x,
        top: layer.position.y,
        width: layer.size.width,
        height: layer.size.height,
        zIndex: layer.zIndex,
      }}
    >
      {renderContent(layer)}
    </div>
  );
}
```

---

## 测试清单

- [ ] 所有模板都能在编辑器中正常加载
- [ ] 所有动画效果正常播放
- [ ] 变量替换功能正常工作
- [ ] 配色方案切换正常
- [ ] 导出为图片功能正常
- [ ] 响应式显示正常
- [ ] 性能测试通过（动画流畅）

---

## 性能优化

### 1. 懒加载动画
```typescript
const [animationsEnabled, setAnimationsEnabled] = useState(false);

useEffect(() => {
  // 页面加载完成后再启动动画
  setTimeout(() => setAnimationsEnabled(true), 100);
}, []);
```

### 2. 使用 CSS will-change
```css
.animated-layer {
  will-change: transform, opacity;
}
```

### 3. 减少重绘
```typescript
// 使用 transform 而不是 position
animation: translateY() instead of top/bottom
```

---

## 常见问题

### Q: 动画不流畅？
A: 检查浏览器性能，尝试减少同时播放的动画数量

### Q: SVG 显示不正确？
A: 确保 viewBox 设置正确，使用 preserveAspectRatio

### Q: 渐变不显示？
A: 检查渐变定义的语法，确保颜色格式正确

---

## 下一步计划

1. ✅ 创建10个婚礼模板
2. ⏳ 导入到数据库
3. ⏳ 生成缩略图和预览图
4. ⏳ 在前端展示
5. ⏳ 测试所有功能
6. ⏳ 收集用户反馈
7. ⏳ 创建更多场景的模板（生日、商务等）

---

**模板已准备就绪，可以开始导入和使用！** 🎉
