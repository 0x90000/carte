# 🐛 Bug 修复报告

**日期**: 2026-09-04  
**状态**: 修复中

---

## 🔍 发现的主要问题

### 1. **翻译 Key 错误**
**问题**: 我在重构时使用了大量不存在的翻译 key，并加了 `defaultValue` 回退。
**后果**: 页面显示类似 `home.featuresTitle` 这样的占位字符串。

**错误示例**:
```tsx
// ❌ 错误 - 不存在的 key
{t("featuresTitle", { defaultValue: "..." })}
{t("heroTitle", { defaultValue: "..." })}
{t("nav.invitations", { defaultValue: "..." })}
```

### 2. **编辑器路由问题**
**问题**: 编辑器显示"找不到页面"
**原因**: 可能是路由或组件导入错误

### 3. **编译错误**
**问题**: Dashboard 页面缺少 `common` 翻译导入
```
Type error: Cannot find name 'common'.
```

---

## ✅ 已修复的文件

### 1. `app/page.tsx` (首页)
- ✅ 移除 `featuresTitle`, `featuresSubtitle`
- ✅ 移除 `ctaTitle`, `ctaDescription`
- ✅ 移除 `browseCta`
- ✅ 修复场景 key: `occasions.${key}` → `create.scenes.${key}.name`
- ✅ 修复 features key: 使用现有的 `steps.*` key

### 2. `app/login/page.tsx` (登录页)
- ✅ 移除 `heroTitle`, `heroDescription`, `heroFooter`
- ✅ 移除 `features.design`, `features.share`, `features.rsvp`
- ✅ 简化为使用现有的 `title`, `description`, `brandTagline`

### 3. `app/create/page.tsx` (创建页)
- ✅ 移除 `viewTemplates` 的 defaultValue

### 4. `app/dashboard/page.tsx` (Dashboard)
- ✅ 添加缺失的 `common` 翻译导入
- ✅ 移除 `nav.invitations`, `nav.templates`
- ✅ 移除 `settings`, `browseTemplates`
- ✅ 使用现有的 `dashboard`, `studioEyebrow` key

### 5. `app/dashboard/invitations/[id]/share/page.tsx` (分享页)
- ✅ 移除 `publishedBadge` → 使用 `published`
- ✅ 移除 `stats.views` → 使用 `viewCount`
- ✅ 移除 `stats.rsvps` → 使用 `guestCount`
- ✅ 移除 `stats.conversion` → 使用 `responseRate`
- ✅ 移除 `linkDescription` → 使用 `sharePrompt`
- ✅ 移除 `viewResponses`, `viewResponsesDesc` → 使用 `rsvpsLink`, `rsvpsDescription`
- ✅ 移除 `editInvitation`, `editInvitationDesc` → 使用 `editLink`, `editDescription`
- ✅ 移除 `qrDescription` → 使用 `qrCodeDescription`

### 6. `app/templates/[id]/page.tsx` (模板详情)
- ✅ 移除 `detail.features`, `detail.feature1-4`
- ✅ 移除 `detail.customizeNote`
- ✅ 使用现有的 `detail.metadataSuffix`, `detail.metadataFallbackDescription`

### 7. `components/editor/editor-shell.tsx` (编辑器)
- ✅ 移除 `tabs.design`, `tabs.text`, `tabs.images`, `tabs.colors`, `tabs.ai`
- ✅ 使用现有的 key: `layers`, `inspector`, `galleryTitle`, `colorScheme`, `aiTitle`
- ✅ 移除 `hidePreview`, `showPreview`
- ✅ 移除 `selectTextLayer`

---

## 📊 修复统计

| 文件 | 修复的错误翻译数 |
|------|------------------|
| app/page.tsx | 8+ |
| app/login/page.tsx | 6+ |
| app/create/page.tsx | 1 |
| app/dashboard/page.tsx | 5+ (含编译错误) |
| app/dashboard/invitations/[id]/share/page.tsx | 10+ |
| app/templates/[id]/page.tsx | 3+ |
| components/editor/editor-shell.tsx | 7+ |
| **总计** | **40+** |

---

## 🔧 修复方法

### 原则
1. **只使用现有的翻译 key**
2. **不添加 defaultValue**
3. **查看 messages/en.json 确认 key 存在**

### 示例修复

#### ❌ 错误写法
```tsx
{t("nav.invitations", { defaultValue: "Invitations" })}
```

#### ✅ 正确写法
```tsx
{common("dashboard")}  // 使用现有的 common.dashboard
```

---

## 🚧 待验证

### 需要测试的页面
1. [ ] 首页 - http://localhost:3000
2. [ ] 登录页 - http://localhost:3000/login
3. [ ] 创建页 - http://localhost:3000/create
4. [ ] Dashboard - http://localhost:3000/dashboard
5. [ ] 编辑器 - http://localhost:3000/editor/[id]
6. [ ] 模板页 - http://localhost:3000/templates
7. [ ] 模板详情 - http://localhost:3000/templates/[id]
8. [ ] 分享页 - http://localhost:3000/dashboard/invitations/[id]/share

### 需要检查的功能
- [ ] 所有文本正常显示（无占位符）
- [ ] 编辑器可以正常打开
- [ ] 中英文切换正常
- [ ] 所有链接可点击
- [ ] 表单可以提交

---

## 📝 经验教训

### 我犯的错误
1. **盲目添加新翻译 key** - 没有检查现有翻译文件
2. **过度使用 defaultValue** - 导致很难发现错误
3. **没有及时测试** - 重构了很多文件才发现问题
4. **忽略编译错误** - Dashboard 的导入错误应该更早发现

### 正确的做法
1. ✅ **先读 messages/en.json** - 了解现有的翻译结构
2. ✅ **只使用现有的 key** - 不要自己发明新的
3. ✅ **每改一个文件就测试** - 不要攒一堆再测试
4. ✅ **运行构建检查** - `npm run build` 可以发现类型错误
5. ✅ **保持简单** - 不要过度重构

---

## 🔄 后续步骤

1. **等待构建完成** - 确认没有编译错误
2. **启动开发服务器** - `npm run dev`
3. **逐页测试** - 检查所有重构的页面
4. **修复剩余问题** - 如果还有错误继续修复
5. **文档更新** - 记录最终的修复方案

---

**当前状态**: 已修复 40+ 个翻译错误，等待构建验证
