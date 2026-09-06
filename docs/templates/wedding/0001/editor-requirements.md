# 0001 对编辑器的反推要求

## 数据模型

现有 `EditorContent` 以 `canvas + layers` 为中心，适合海报式自由定位；0001 的主要内容是长页面分区、轮播、时间线、地图和表单。建议增加 `pageModel: h5-long-scroll` 与语义 sections，同时保留现有 `layers` 作为 legacy/fallback。持久化字段应使用 `dataPath` 和稳定 item id，模板 CSS selector 只用于导入迁移。

推荐的最小模型是：

```text
InvitationDocument
  document / navigation
  sections[]: hero | story | gallery | celebration | venue | findUs | rsvp | footer
  assets[]: assetId, kind, url, alt, crop, focalPoint
  theme: palette, typography, motion
  effects: particles, petals, noise, reveal
  music: asset-library reference, playback policy
```

## 组件边界

- `HeroEditor`: 姓名、日期、地点、背景上传和焦点裁剪。
- `StoryEditor`: 富文本行、段落、签名、统计项 repeater。
- `AlbumEditor`: 多图上传、缩略图排序、删除、alt/caption、自动播放设置。
- `TimelineEditor`: 时间、标签、标题、描述、排序。
- `VenueEditor`: 图片、地址、导航链接、交通提示。
- `MapEditor`: 地址搜索、坐标、provider、预览和外链生成。
- `RsvpFormBuilder`: 固定字段类型的标签/placeholder/选项配置，提交绑定现有 RSVP API。
- `MusicPicker`: 只读素材库选择；上传入口不属于此模板要求。
- `EffectsPanel`: 粒子、花瓣、噪声、reveal 和 reduced-motion 设置。

## Figma 风格交互

编辑器画布应显示长页面 section outline，支持缩放、拖拽滚动、选中 section/item 后在右侧属性面板编辑。文本、图片、Repeater、交互配置使用对应控件；时间线、相册和表单保持结构化约束，不能退化为互相覆盖的自由图层。撤销/重做应以语义文档快照为单位。

## Live 预览

模板列表卡片和模板详情页应渲染真实页面预览（建议使用 iframe 或受控 React renderer），而不是 `thumbnailUrl`/`previewUrl` 静态图片。预览需要：

1. 使用示例邀请数据，不读取或修改用户邀请函。
2. 保留相册按钮、键盘/触摸切换、音乐手势按钮、地图链接和 RSVP 视觉状态。
3. 在桌面和移动 viewport 都按真实 CSS 渲染，并允许 reduced-motion。
4. 对外部地图和音频失败提供降级状态，不能阻塞模板浏览。

## 资源策略

背景和相册采用统一 `assets` 表/存储槽位，内容只保存 `assetId` 和裁剪参数；兼容旧数据时可保留 data URL。音乐从素材库选择 `assetId`，发布页由播放器读取 URL；禁止把用户上传音频混入模板 JSON。相同图片在多个位置使用同一个 asset 引用。

## 已确认的产品边界

1. `h5-long-scroll` 是所有场景的通用页面模型，不只服务 wedding。
2. 用户可以新增、删除和重排整个 section；模板提供默认 section，编辑器需要保护必需 section 的最小约束。
3. 相册最多 9 张，上传后的压缩/CDN 属于资源服务实现事项。
4. 音乐由用户后续上传到素材库；当前接入使用明确的 placeholder asset，不在编辑器里提供用户音频上传。
5. 中文首选高德地图，其他语言首选 Google Maps；模型仍保留 provider 选择和坐标字段。
6. Figma 风格编辑器改用 section scene graph，不继续扩大 Fabric 画布的职责；旧 `canvas + layers` 数据保留迁移兼容。
7. 模板预览中的 RSVP 只展示交互和成功状态，不写入数据库、不触发通知。
