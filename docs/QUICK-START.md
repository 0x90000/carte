# 🚀 快速开始指南

## 立即测试新模板

### 1️⃣ 导入模板到数据库

```bash
# 进入项目目录
cd E:\carte

# 运行导入脚本
node scripts/import-templates.mjs
```

**预期输出**:
```
🎨 开始导入婚礼模板...

✅ 成功导入: Romantic Blush (wedding-romantic.json)
✅ 成功导入: Luxe Noir (wedding-luxe.json)
✅ 成功导入: Secret Garden (wedding-garden.json)
✅ 成功导入: Golden Hour (wedding-sunset.json)
✅ 成功导入: Pure Minimalist (wedding-minimal.json)
✅ 成功导入: Vintage Romance (wedding-vintage.json)
✅ 成功导入: Ocean Waves (wedding-ocean.json)
✅ 成功导入: Gilded Elegance (wedding-golden.json)
✅ 成功导入: Enchanted Forest (wedding-forest.json)
✅ 成功导入: Starry Night (wedding-starry.json)

📊 导入完成！
   成功: 10 个
   失败: 0 个
   总计: 10 个模板
```

---

### 2️⃣ 启动开发服务器

```bash
npm run dev
```

---

### 3️⃣ 访问和测试

#### A. 查看模板列表
```
http://localhost:3000/templates
```
- 应该能看到 10 个新的婚礼模板
- 每个模板有独特的图标和描述

#### B. 测试模板编辑
1. 点击任意模板的 **"使用此模板"** 按钮
2. 进入编辑器页面
3. 应该能看到：
   - ✅ 渐变背景正常显示
   - ✅ SVG 装饰元素可见
   - ✅ 动画效果流畅播放
   - ✅ 文字内容可编辑

#### C. 测试功能
- **编辑文字**: 修改新人姓名、日期、地点
- **切换配色**: 在 3 套配色方案间切换
- **查看动画**: 观察淡入、滑入、脉冲等效果
- **保存邀请函**: 保存并预览最终效果

---

## 🎨 10 个模板快速预览

| 模板 | 风格 | 适合场景 |
|------|------|---------|
| 💕 Romantic Blush | 浪漫粉色 | 温柔甜蜜的婚礼 |
| 🖤 Luxe Noir | 奢华黑金 | 高端晚宴婚礼 |
| 🌿 Secret Garden | 秘密花园 | 户外花园婚礼 |
| 🌅 Golden Hour | 日落黄昏 | 黄昏海滩婚礼 |
| ⬜ Pure Minimalist | 极简主义 | 现代都市婚礼 |
| 📜 Vintage Romance | 复古经典 | 复古主题婚礼 |
| 🌊 Ocean Waves | 海洋波浪 | 海边度假婚礼 |
| ✨ Gilded Elegance | 镀金巴洛克 | 宫廷风格婚礼 |
| 🌲 Enchanted Forest | 魔幻森林 | 森林童话婚礼 |
| 🌟 Starry Night | 星空夜景 | 夜间星空婚礼 |

---

## 🔍 如何验证功能

### 检查清单

- [ ] **模板列表页**
  - [ ] 能看到 10 个新模板
  - [ ] 每个模板有名称、描述、标签
  - [ ] "使用此模板" 按钮正常

- [ ] **编辑器页面**
  - [ ] 渐变背景正确显示
  - [ ] SVG 装饰元素可见
  - [ ] 动画正常播放
  - [ ] 文字可以编辑
  - [ ] 配色可以切换

- [ ] **保存和预览**
  - [ ] 可以保存邀请函
  - [ ] 预览显示正确
  - [ ] 动画在预览中也能播放

---

## 🐛 如果遇到问题

### 问题 1: 导入脚本报错
```bash
# 确保安装了依赖
npm install

# 确保数据库已启动
# 检查 .env 文件中的数据库连接
```

### 问题 2: 模板不显示
```bash
# 检查数据库中是否有数据
npx prisma studio

# 在 Template 表中应该能看到 10 条记录
```

### 问题 3: 编辑器页面空白
```bash
# 检查浏览器控制台是否有错误
# 确保构建成功
npm run build

# 重新启动开发服务器
npm run dev
```

### 问题 4: 动画不播放
- 检查 `app/globals.css` 是否包含动画定义
- 检查浏览器是否禁用了动画
- 尝试刷新页面

---

## 📝 技术细节

### 编辑器改进
新版编辑器支持：
```typescript
// 渐变背景
background: {
  type: "color",
  gradient: "linear-gradient(...)"
}

// SVG 图层
{
  type: "svg",
  content: { svg: "<svg>...</svg>" }
}

// CSS 动画
animation: {
  type: "fadeIn" | "slideUp" | "pulse" | "float" | "swing" | "shimmer",
  duration: 2000,
  delay: 500,
  iterationCount: "infinite" | 1
}
```

### 文件位置
```
prisma/templates/          # 模板 JSON 文件
scripts/                   # 导入脚本
components/preview-canvas.tsx  # 编辑器渲染组件
app/globals.css           # 动画定义
```

---

## 🎉 完成！

按照以上步骤，你应该能够：
1. ✅ 成功导入 10 个模板
2. ✅ 在模板页面看到它们
3. ✅ 在编辑器中编辑和预览
4. ✅ 看到所有动画效果

**享受这些美丽的动态婚礼邀请函模板吧！** 💕🎊✨
