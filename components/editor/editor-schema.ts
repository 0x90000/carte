import type { EditorContent, EditorSchema, EditorSchemaField } from "@/components/editor/types";

export type EditorSchemaLocale = "en" | "zh-CN";

export function schemaText(value: string | Record<string, string> | undefined, locale: string, fallback = "") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value[locale] ?? value[locale.toLowerCase()] ?? value.en ?? value["zh-CN"] ?? fallback;
}

function field(path: string, label: string | Record<string, string>, kind: EditorSchemaField["kind"] = "text", extra: Partial<EditorSchemaField> = {}): EditorSchemaField {
  return { path, label, kind, ...extra };
}

const zh = (en: string, chinese: string) => ({ en, "zh-CN": chinese });

const weddingSchema: EditorSchema = {
  version: 1,
  sectionPresets: [
    { type: "hero", label: zh("Hero", "首屏"), data: { eyebrow: "Your story begins", names: { partnerA: "Name", separator: "&", partnerB: "Name" }, date: { display: "Your date" }, location: { city: "City", venue: "Venue" }, media: { assetId: null, url: "", fit: "cover" }, scrollCue: { label: "SCROLL TO EXPLORE", targetSectionId: "story" } } },
    { type: "story", label: zh("Story", "故事"), data: { label: "TO OUR DEAREST FRIENDS & FAMILY", heading: { lines: ["Tell your story"] }, paragraphs: ["Write a note for your guests."], signature: { caption: "with all our love", names: "A & B" } } },
    { type: "gallery", label: zh("Gallery", "相册"), data: { label: "A LITTLE PREVIEW", heading: { lines: ["Your memories"] }, album: { items: [], autoplay: true, intervalMs: 6200, controls: { arrows: true, dots: true, keyboard: true, touch: true } }, secondaryImage: { assetId: null, url: "", fit: "cover" } } },
    { type: "celebration", label: zh("Celebration", "日程"), data: { dateLabel: "YOUR DATE", heading: { lines: ["The day"] }, intro: "Every moment prepared for meeting you.", events: [] } },
    { type: "venue", label: zh("Venue", "场地"), data: { title: { lines: ["Your venue"] }, address: ["Address"], image: { assetId: null, url: "", fit: "cover" }, actions: [], meta: [] } },
    { type: "findUs", label: zh("Find Us", "地图"), data: { heading: { lines: ["Find us"] }, description: "Add directions for your guests.", map: { provider: "google", latitude: 0, longitude: 0, externalUrl: "https://www.google.com/maps" } } },
    { type: "rsvp", label: "RSVP", data: { enabled: true, deadline: "KINDLY REPLY BY", heading: { lines: ["Will you join us?"] }, description: "Tell us if you can make it.", fields: { name: { label: "Name", placeholder: "Your name", required: true }, guests: { label: "Guests", min: 1, max: 4, default: 1 }, attending: { label: "Attendance", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] }, message: { label: "Message", placeholder: "A note for us" }, submitLabel: "Send RSVP" }, successMessage: "Thank you for your reply." } },
    { type: "footer", label: zh("Footer", "页脚"), data: { items: ["YOUR NAMES", "WITH LOVE, ALWAYS", "2026 / 10 / 18"] } },
    { type: "custom", label: zh("Custom section", "自定义分区"), data: { heading: { lines: ["Your section"] }, body: "Add a note for guests." } },
  ],
  sectionTypes: {
    hero: { label: zh("Hero", "首屏"), icon: "type", fields: [
      field("eyebrow", zh("Eyebrow", "眉题")), field("names.partnerA", zh("Name A", "姓名 A")), field("names.separator", zh("Separator", "分隔符")), field("names.partnerB", zh("Name B", "姓名 B")), field("date.display", zh("Date", "日期")), field("location.city", zh("City", "城市")), field("location.venue", zh("Venue", "场地")), field("scrollCue.label", zh("Scroll cue", "滚动提示")),
      field("media", zh("Hero image", "首屏图片"), "media", { tab: "media", uploadPath: "media" }), field("scrollCue.targetSectionId", zh("Scroll target", "跳转目标"), "text", { tab: "behavior" }),
    ] },
    story: { label: zh("Story", "故事"), icon: "type", fields: [field("label", zh("Label", "标签")), field("heading.lines", zh("Heading", "标题"), "text", { kind: "text" }), field("paragraphs", zh("Paragraphs", "段落"), "textarea", { multiline: true }), field("signature.caption", zh("Signature caption", "署名说明")), field("signature.names", zh("Signature", "署名"))] },
    gallery: { label: zh("Gallery", "相册"), icon: "images", fields: [field("label", zh("Label", "标签")), field("heading.lines", zh("Heading", "标题")), field("indexLabel", zh("Index label", "索引标签")), field("album.items", zh("Album", "相册"), "image-list", { tab: "media", maxItems: 9, itemLabel: zh("Photo", "照片"), itemFields: [field("media", zh("Image", "图片"), "media", { uploadPath: "media" }), field("caption", zh("Caption", "图片说明"))] }), field("album.autoplay", zh("Autoplay", "自动播放"), "boolean", { tab: "behavior" }), field("album.intervalMs", zh("Interval (ms)", "切换间隔（毫秒）"), "number", { tab: "behavior" })] },
    celebration: { label: zh("Celebration", "日程"), icon: "sliders", fields: [field("dateLabel", zh("Date label", "日期标签")), field("heading.lines", zh("Heading", "标题")), field("intro", zh("Intro", "引导文案"), "textarea", { multiline: true }), field("events", zh("Schedule", "日程"), "object-list", { itemLabel: zh("Event", "日程项"), itemFields: [field("time", zh("Time", "时间")), field("label", zh("Label", "标签")), field("title", zh("Title", "标题")), field("description", zh("Description", "描述"), "textarea", { multiline: true })] })] },
    venue: { label: zh("Venue", "场地"), icon: "image", fields: [field("title.lines", zh("Title", "标题")), field("address", zh("Address", "地址"), "textarea", { multiline: true }), field("photoLabel", zh("Photo label", "图片标签")), field("image", zh("Venue image", "场地图片"), "media", { tab: "media", uploadPath: "image" })] },
    findUs: { label: zh("Find Us", "地图"), icon: "map", fields: [field("heading.lines", zh("Heading", "标题")), field("description", zh("Description", "描述"), "textarea", { multiline: true }), field("map.markerLabel", zh("Marker label", "地图标记")), field("map.provider", zh("Map provider", "地图服务"), "select", { tab: "behavior", options: [{ value: "google", label: "Google Maps" }, { value: "amap", label: zh("Amap", "高德地图") }, { value: "openstreetmap", label: "OpenStreetMap" }] }), field("map.latitude", zh("Latitude", "纬度"), "number", { tab: "behavior" }), field("map.longitude", zh("Longitude", "经度"), "number", { tab: "behavior" }), field("map.externalUrl", zh("Map URL", "地图链接"), "url", { tab: "behavior" })] },
    rsvp: { label: "RSVP", icon: "panel", fields: [field("enabled", zh("Enabled", "启用"), "boolean", { tab: "behavior" }), field("deadline", zh("Deadline", "截止时间")), field("heading.lines", zh("Heading", "标题")), field("description", zh("Description", "描述"), "textarea", { multiline: true }), field("successMessage", zh("Success message", "成功提示"))] },
    footer: { label: zh("Footer", "页脚"), icon: "type", fields: [field("items", zh("Footer lines", "页脚文案"), "textarea", { multiline: true })] },
    custom: { label: zh("Custom section", "自定义分区"), icon: "plus", fields: [field("heading.lines", zh("Heading", "标题")), field("body", zh("Body", "正文"), "textarea", { multiline: true }), field("description", zh("Description", "描述"), "textarea", { multiline: true })] },
  },
};

const primitiveKind = (value: unknown): EditorSchemaField["kind"] => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "text";
};

function inferFields(data: Record<string, unknown>, prefix = ""): EditorSchemaField[] {
  return Object.entries(data).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      if (value.every((item) => typeof item === "string" || typeof item === "number")) return [field(path, key, "textarea", { multiline: true })];
      if (value.every((item) => item && typeof item === "object" && !Array.isArray(item))) return [field(path, key, "object-list", { itemFields: inferFields((value[0] ?? {}) as Record<string, unknown>) })];
      return [];
    }
    if (value && typeof value === "object") return inferFields(value as Record<string, unknown>, path);
    return [field(path, key, primitiveKind(value))];
  });
}

export function getEditorSchema(content: EditorContent): EditorSchema {
  if (content.editorSchema?.version === 1) return content.editorSchema;
  const scene = typeof content.scene === "string" ? content.scene : undefined;
  const isWedding = scene === "wedding" || (!scene && Boolean(recordValue(content.settings, "designVariant")));
  const types = Object.fromEntries((content.sections ?? []).map((section) => [section.type, isWedding && weddingSchema.sectionTypes?.[section.type] ? weddingSchema.sectionTypes[section.type] : { label: section.name, fields: inferFields(section.data) }]));
  if (isWedding) return { ...weddingSchema, sectionTypes: types };
  const sectionPresets = Array.from(new Map((content.sections ?? []).map((section) => [section.type, section])).values()).map((section) => ({ type: section.type, label: section.name || section.type, data: section.data ?? {} }));
  return { version: 1, sectionTypes: types, sectionPresets };
}

function recordValue(value: unknown, key: string) {
  return value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;
}

export function getSectionSchema(content: EditorContent, type: string) {
  return getEditorSchema(content).sectionTypes?.[type];
}
