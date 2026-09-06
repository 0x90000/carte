# 0001 模板结构拆解

## 页面骨架

这是一个响应式婚礼 H5 长页面，不是单张 750 x 1334 海报。`index.html` 的页面顺序是 Hero、Story、Gallery、Celebration、Venue、Find Us、RSVP、Footer。桌面端用多列编辑版式，760px 以下切换为单列；Hero 使用 `100svh`，其余分区按内容撑高。

## Hero

- `wedding-hero.png` 全屏背景，`cover`，默认位置 `center 62%`，有饱和度/对比度处理。
- 文字：眉题、两位新人姓名、日期、城市和场地。
- 装饰：上下渐变暗角、中心金色光晕、横线加 sparkles 图标、向下滚动提示、右侧竖排编号。
- 行为：背景缓慢呼吸缩放；滚动后顶栏增加半透明背景和毛玻璃。
- 编辑器要提供背景图上传、裁剪/焦点位置、叠层开关和姓名/日期/地点字段。

## Story

- 深色背景，分区编号 `01 / OUR STORY`。
- 左侧标签和大标题，标题包含一行金色斜体强调；右侧两段正文和签名。
- 底部为三个可增删统计项，当前是相处天数、未来天数和承诺数量。
- 所有正文、标签、标题分行和统计项都应是结构化文本，不要把 `<br>` 直接保存为内容。

## Gallery / Story Album

- 浅色 `#e7e2d7` 横向分区，左侧是主相册，右侧是文案，右下角有旋转小图。
- 当前相册有 3 个 slide，分别复用花束、Hero、新人场地图片；每项包含图片、alt 和 caption。
- `script.js:20-73` 实现左右按钮、dots、ArrowLeft/ArrowRight、pointer swipe、自动播放（6200ms），鼠标悬停和键盘聚焦时暂停。
- 相册是可编辑的图片 repeater，建议最多 9 张；图片上传和排序应是编辑器一级能力。

## Celebration

- 深色时间线分区，编号 `02 / THE CELEBRATION`。
- 日期标签、标题、引导文案和可排序事件列表。
- 每个事件有时间、英文类型标签、中文标题和描述；当前有 Arrival、Ceremony、Dinner、After Party 四项。
- 时间线的节点、竖线和 reveal 属于布局/效果，不应作为普通自由图层让用户破坏结构。

## Venue

- 浅灰绿色分区，左侧场地图片，右侧场地标题、地址、导航/地图操作和交通提示。
- 当前 `venue-garden.png` 同时出现在相册和 Venue；标准模型使用同一 asset 引用，避免复制上传。
- 导航链接为高德 URI，地图按钮滚动到 Find Us；交通提示是可编辑 icon-text repeater。

## Find Us

- 深色地图分区，编号 `04 / FIND US`，左侧标题和说明，右侧嵌入 OpenStreetMap。
- 当前坐标为 `30.1804, 120.0917`，bbox 为 `120.068,30.165,120.115,30.197`；外部打开链接使用同一坐标。
- 地图 provider、坐标、bbox、embed URL 和外链都要进入模型；编辑器至少要支持地址搜索/坐标确认，不能只编辑一条 URL。

## RSVP

- 浅色表单卡片，左侧截止日期、标题和说明，右侧表单。
- 字段：姓名（必填）、人数（1-4）、出席意愿（到场/缺席）、祝福留言（选填）、提交按钮。
- 静态模板的 JS 只在本地显示成功提示，未调用 RSVP API；接入产品时必须绑定当前 invitation slug 和现有 RSVP 服务。
- 成功提示是 status live region；编辑器需要允许修改标签、placeholder、选项和成功文案，同时保留字段类型约束。

## Footer 与全局效果

- Footer 三列文字：新人姓名、祝福短句、日期。
- 全局噪声来自 CSS 内嵌 SVG `feTurbulence`；花瓣来自 6 个 CSS span；粒子来自 Three.js `PointsMaterial`。
- 动画均应尊重 `prefers-reduced-motion: reduce`。音乐按钮必须由用户手势启动；当前源码是 Web Audio 合成旋律，没有音频文件。

## 外部依赖和迁移注意

Google Fonts、Lucide、Three.js、OpenStreetMap 和高德 URI 都是运行时依赖。模板预览若只展示 `previewUrl` 静态图，会丢失相册、音乐、地图和 RSVP 行为，因此预览必须使用和公开邀请函相同的 live renderer，并使用隔离的示例数据。
