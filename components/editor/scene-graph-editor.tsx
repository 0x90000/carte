"use client";

/* Preview thumbnails may be data URLs or template assets, so native img elements are intentional. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, MouseEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  Images,
  Maximize2,
  Minus,
  MousePointer2,
  Palette,
  PanelRight,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SceneGraphInvitation } from "@/components/invitation/scene-graph-invitation";
import { PreviewModeToggle } from "@/components/templates/preview-mode-toggle";
import type { PreviewMode } from "@/components/templates/live-template-preview";
import { getEditorSchema, schemaText } from "@/components/editor/editor-schema";
import type { EditorContent, EditorSceneSection, EditorSchemaField, EditorSchemaTab } from "@/components/editor/types";

type InspectorTab = "content" | "media" | "style" | "behavior";

type SceneGraphEditorProps = {
  content: EditorContent;
  locale: string;
  onChange: (content: EditorContent) => void;
  labels: {
    outline: string;
    addSection: string;
    sectionType: string;
    deleteSection: string;
    moveUp: string;
    moveDown: string;
    hideSection: string;
    showSection: string;
    inspector: string;
    selectSection: string;
    uploadImage: string;
    album: string;
    albumLimit: string;
    music: string;
    musicPlaceholder: string;
    previewMode: string;
    desktopPreview: string;
    mobilePreview: string;
  };
};

const sectionIcons: Record<string, typeof Type> = {
  hero: Type,
  story: Type,
  gallery: Images,
  celebration: SlidersHorizontal,
  venue: ImagePlus,
  findUs: Maximize2,
  rsvp: PanelRight,
  footer: ChevronDown,
  custom: Plus,
};

const schemaIcons: Record<string, typeof Type> = {
  type: Type,
  images: Images,
  sliders: SlidersHorizontal,
  image: ImagePlus,
  map: Maximize2,
  panel: PanelRight,
  plus: Plus,
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readAtPath(value: unknown, path: string) {
  return path.split(".").filter(Boolean).reduce<unknown>((cursor, part) => {
    if (cursor && typeof cursor === "object") {
      return (cursor as Record<string, unknown>)[part];
    }
    return undefined;
  }, value);
}

function updateAtPath(value: Record<string, unknown>, path: string, nextValue: unknown) {
  const parts = path.split(".").filter(Boolean);
  const next = clone(value);
  let cursor: Record<string, unknown> = next;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = nextValue;
      return;
    }
    const child = cursor[part];
    cursor[part] = child && typeof child === "object"
      ? Array.isArray(child) ? [...child] : { ...(child as Record<string, unknown>) }
      : {};
    cursor = cursor[part] as Record<string, unknown>;
  });
  return next;
}

function setAtPath(value: Record<string, unknown>, path: string, nextValue: unknown) {
  return updateAtPath(value, path, nextValue);
}

function findSchemaField(fields: EditorSchemaField[] | undefined, path: string): EditorSchemaField | undefined {
  if (!fields) return undefined;
  const normalize = (value: string) => value.split(".").filter(Boolean).map((part) => /^\d+$/.test(part) ? "*" : part).join(".");
  const target = normalize(path);
  function walk(current: EditorSchemaField[], prefix = ""): EditorSchemaField | undefined {
    for (const field of current) {
      const fullPath = prefix ? `${prefix}.${field.path}` : field.path;
      if (normalize(fullPath) === target) return field;
      if (field.itemFields) {
        const nested = walk(field.itemFields, `${fullPath}.*`);
        if (nested) return nested;
      }
    }
    return undefined;
  }
  return walk(fields);
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function useUi(locale: string) {
  return locale.toLowerCase().startsWith("zh")
    ? {
        content: "内容",
        media: "媒体",
        style: "样式",
        behavior: "交互",
        page: "页面",
        sections: "分区",
        add: "添加分区",
        selected: "当前选中",
        clickToSelect: "点击预览中的元素即可选中",
        doubleClick: "双击文字可直接编辑",
        noSelection: "选择一个分区开始编辑",
        properties: "属性",
        sectionName: "分区名称",
        sectionId: "分区 ID",
        text: "文字",
        eyebrow: "眉题",
        nameA: "姓名 A",
        nameB: "姓名 B",
        separator: "分隔符",
        date: "日期",
        deadline: "截止时间",
        city: "城市",
        venue: "场地",
        scrollCue: "滚动提示",
        label: "标签",
        indexLabel: "索引标签",
        signature: "署名",
        dateLabel: "日期标签",
        intro: "引导文案",
        time: "时间",
        title: "标题",
        description: "描述",
        successMessage: "成功提示",
        photoLabel: "图片标签",
        markerLabel: "地图标记",
        altText: "替代文本",
        fit: "适配方式",
        position: "图片位置",
        arrows: "箭头",
        dots: "圆点",
        keyboard: "键盘",
        touch: "触摸",
        latitude: "纬度",
        longitude: "经度",
        rsvpPreviewOnly: "编辑器中的 RSVP 仅用于预览，发布后的邀请函会使用实时 RSVP 接口。",
        heading: "标题",
        paragraph: "段落",
        addLine: "添加一行",
        remove: "删除",
        image: "图片",
        replace: "替换图片",
        upload: "上传图片",
        album: "相册",
        albumCount: "张",
        caption: "图片说明",
        addPhotos: "添加照片",
        colors: "颜色方案",
        visible: "显示分区",
        locked: "锁定分区",
        layout: "版式信息",
        autoplay: "自动播放",
        interval: "切换间隔（毫秒）",
        mapProvider: "地图服务",
        mapUrl: "地图链接",
        enabled: "启用",
        target: "跳转目标",
        music: "背景音乐",
        musicHint: "从音乐素材库选择。当前为占位素材。",
        reset: "重置缩放",
        zoomOut: "缩小",
        zoomIn: "放大",
        empty: "这里还没有可编辑内容。",
        address: "地址",
        events: "日程",
        addEvent: "添加日程",
        removeEvent: "删除日程",
        providerGoogle: "Google Maps",
        providerAmap: "高德地图",
        providerOsm: "OpenStreetMap",
      }
    : {
        content: "Content",
        media: "Media",
        style: "Style",
        behavior: "Behavior",
        page: "Page",
        sections: "Sections",
        add: "Add section",
        selected: "Selected",
        clickToSelect: "Click an element in the preview to select it",
        doubleClick: "Double-click text to edit inline",
        noSelection: "Select a section to start editing",
        properties: "Properties",
        sectionName: "Section name",
        sectionId: "Section ID",
        text: "Text",
        eyebrow: "Eyebrow",
        nameA: "Name A",
        nameB: "Name B",
        separator: "Separator",
        date: "Date",
        deadline: "Deadline",
        city: "City",
        venue: "Venue",
        scrollCue: "Scroll cue",
        label: "Label",
        indexLabel: "Index label",
        signature: "Signature",
        dateLabel: "Date label",
        intro: "Intro",
        time: "Time",
        title: "Title",
        description: "Description",
        successMessage: "Success message",
        photoLabel: "Photo label",
        markerLabel: "Marker label",
        altText: "Alt text",
        fit: "Fit",
        position: "Position",
        arrows: "Arrows",
        dots: "Dots",
        keyboard: "Keyboard",
        touch: "Touch",
        latitude: "Latitude",
        longitude: "Longitude",
        rsvpPreviewOnly: "RSVP interactions in this editor are preview-only. Published invitations use the live RSVP API.",
        heading: "Heading",
        paragraph: "Paragraph",
        addLine: "Add line",
        remove: "Remove",
        image: "Image",
        replace: "Replace image",
        upload: "Upload image",
        album: "Album",
        albumCount: "photos",
        caption: "Caption",
        addPhotos: "Add photos",
        colors: "Color scheme",
        visible: "Show section",
        locked: "Lock section",
        layout: "Layout information",
        autoplay: "Autoplay",
        interval: "Interval (ms)",
        mapProvider: "Map provider",
        mapUrl: "Map URL",
        enabled: "Enabled",
        target: "Scroll target",
        music: "Background music",
        musicHint: "Choose from the music library. A placeholder is active.",
        reset: "Reset zoom",
        zoomOut: "Zoom out",
        zoomIn: "Zoom in",
        empty: "There are no editable fields in this section yet.",
        address: "Address",
        events: "Schedule",
        addEvent: "Add event",
        removeEvent: "Remove event",
        providerGoogle: "Google Maps",
        providerAmap: "Amap",
        providerOsm: "OpenStreetMap",
      };
}

function Field({ label, value, onChange, multiline = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; placeholder?: string }) {
  return (
    <div className="scene-field">
      <Label>{label}</Label>
      {multiline ? <Textarea value={value} placeholder={placeholder} rows={3} onChange={(event) => onChange(event.target.value)} /> : <Input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />}
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="scene-toggle-field"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="scene-toggle-track" aria-hidden="true"><span /></span></label>;
}

function StringListEditor({ label, values, onChange, ui, multiline = false }: { label: string; values: string[]; onChange: (values: string[]) => void; ui: ReturnType<typeof useUi>; multiline?: boolean }) {
  return <div className="scene-field scene-list-editor"><div className="scene-field-header"><Label>{label}</Label><button type="button" className="scene-text-button" onClick={() => onChange([...values, ""])}><Plus size={13} aria-hidden="true" />{ui.addLine}</button></div>{values.map((value, index) => <div className="scene-list-row" key={`${label}-${index}`}>{multiline ? <Textarea value={value} rows={3} onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /> : <Input value={value} onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} />}<button type="button" className="scene-icon-button" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} aria-label={ui.remove} title={ui.remove}><Trash2 size={13} /></button></div>)}</div>;
}

function schemaMediaUrl(content: EditorContent, value: unknown) {
  const media = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const direct = textValue(media.url);
  if (direct) return direct;
  return content.assets?.find((asset) => asset.id === textValue(media.assetId))?.url ?? "";
}

function defaultSchemaValue(field: EditorSchemaField) {
  if (field.defaultValue !== undefined) return clone(field.defaultValue);
  if (field.kind === "boolean") return false;
  if (field.kind === "number") return 0;
  if (field.kind === "select") return field.options?.[0]?.value ?? "";
  if (field.kind === "image-list" || field.kind === "object-list") return [];
  return "";
}

function schemaFieldLabel(field: EditorSchemaField, locale: string) {
  return schemaText(field.label, locale, field.path);
}

function SchemaFieldEditor({ field, value, path, content, locale, ui, update, onUpload, onImageListUpload }: { field: EditorSchemaField; value: unknown; path: string; content: EditorContent; locale: string; ui: ReturnType<typeof useUi>; update: (path: string, value: unknown) => void; onUpload: (path: string, accept?: string) => void; onImageListUpload: (path: string, accept?: string) => void }) {
  const label = schemaFieldLabel(field, locale);
  const description = schemaText(field.description, locale);
  const placeholder = schemaText(field.placeholder, locale);
  const kind = field.kind ?? "text";
  if (kind === "hint") return <p className="scene-inspector-note">{description || label}</p>;
  if (kind === "readonly") return <div className="scene-readonly-field"><Label>{label}</Label><code>{textValue(value)}</code></div>;
  if (kind === "boolean") return <div className="scene-field"><ToggleField label={label} checked={value === true} onChange={(next) => update(path, next)} />{description ? <p className="scene-inspector-note">{description}</p> : null}</div>;
  if (kind === "select") return <div className="scene-field"><Label>{label}</Label><Select value={textValue(value, field.options?.[0]?.value ?? "")} onChange={(event) => update(path, event.target.value)}>{(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{schemaText(option.label, locale, option.value)}</option>)}</Select>{description ? <p className="scene-inspector-note">{description}</p> : null}</div>;
  if (kind === "media") {
    const media = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const url = schemaMediaUrl(content, value);
    return <div className="scene-media-slot"><Label>{label}</Label>{url ? <div className="scene-media-preview"><img src={url} alt={textValue(media.alt, label)} /></div> : <div className="scene-media-empty"><ImagePlus size={18} /><span>{description || ui.empty}</span></div>}<Button type="button" variant="outline" className="w-full" onClick={() => onUpload(path, field.accept)}><ImagePlus size={14} />{ui.replace}</Button>{description ? <p className="scene-inspector-note">{description}</p> : null}</div>;
  }
  if (kind === "image-list" || kind === "object-list") {
    const items = Array.isArray(value) ? value : [];
    const canAdd = field.maxItems === undefined || items.length < field.maxItems;
    const addItem = () => update(path, [...items, defaultSchemaObject(field.itemFields ?? [])]);
    return <div className="scene-subsection"><div className="scene-subsection-title"><Images size={14} />{label}<span className="scene-count-badge">{field.maxItems !== undefined ? `${items.length}/${field.maxItems}` : items.length}</span></div>{description ? <p className="scene-inspector-note">{description}</p> : null}{kind === "image-list" ? <Button type="button" variant="outline" className="w-full" onClick={() => onImageListUpload(path, field.accept)} disabled={!canAdd}><Images size={14} />{ui.addPhotos}</Button> : null}{items.map((item, index) => <div className="scene-repeater-card" key={`${path}-${index}`}><span className="scene-repeater-index">{String(index + 1).padStart(2, "0")} {schemaText(field.itemLabel, locale)}</span>{(field.itemFields ?? []).map((itemField) => <SchemaFieldEditor key={`${path}.${index}.${itemField.path}`} field={itemField} value={readAtPath(item, itemField.path)} path={`${path}.${index}.${itemField.path}`} content={content} locale={locale} ui={ui} update={update} onUpload={onUpload} onImageListUpload={onImageListUpload} />)}<button type="button" className="scene-danger-button" disabled={field.minItems !== undefined && items.length <= field.minItems} onClick={() => update(path, items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={13} />{ui.remove}</button></div>)}{kind === "object-list" || field.maxItems === undefined ? <button type="button" className="scene-text-button" disabled={!canAdd} onClick={addItem}><Plus size={13} />{ui.addLine}</button> : null}</div>;
  }
  if (Array.isArray(value)) return <StringListEditor label={label} values={value.map((item) => textValue(item))} onChange={(next) => update(path, next)} ui={ui} multiline={field.multiline || kind === "textarea"} />;
  const inputType = kind === "number" ? "number" : kind === "color" ? "color" : kind === "date" ? "date" : kind === "url" ? "url" : undefined;
  if (field.multiline || kind === "textarea") return <Field label={label} value={textValue(value)} placeholder={placeholder} multiline onChange={(next) => update(path, next)} />;
  return <div className="scene-field"><Label>{label}</Label><Input type={inputType} value={textValue(value)} placeholder={placeholder} onChange={(event) => update(path, kind === "number" ? Number(event.target.value) || 0 : event.target.value)} />{description ? <p className="scene-inspector-note">{description}</p> : null}</div>;
}

function defaultSchemaObject(fields: EditorSchemaField[]) {
  return fields.reduce<Record<string, unknown>>((object, field) => {
    if (!field.path) return object;
    return updateAtPath(object, field.path, defaultSchemaValue(field));
  }, {});
}

function SchemaInspectorPanel({ section, tab, content, locale, ui, update, onUpload, onImageListUpload }: { section: EditorSceneSection; tab: EditorSchemaTab; content: EditorContent; locale: string; ui: ReturnType<typeof useUi>; update: (path: string, value: unknown) => void; onUpload: (path: string, accept?: string) => void; onImageListUpload: (path: string, accept?: string) => void }) {
  const schema = getEditorSchema(content).sectionTypes?.[section.type];
  const fields = (Array.isArray(schema?.fields) ? schema.fields : []).filter((field) => (field.tab ?? "content") === tab);
  if (tab === "style") {
    return <div className="scene-inspector-group"><div className="scene-group-title"><Palette size={14} />{ui.style}</div><ToggleField label={ui.visible} checked={section.visible !== false} onChange={(value) => update("__section_visible", value)} /><ToggleField label={ui.locked} checked={section.locked === true} onChange={(value) => update("__section_locked", value)} /><div className="scene-style-card"><span>{ui.layout}</span><strong>{schemaText(schema?.label, locale, section.type)}</strong><small>{textValue(content.pageModel, "h5-long-scroll")}</small></div><Field label={ui.sectionName} value={section.name} onChange={(value) => update("__section_name", value)} /><div className="scene-readonly-field"><Label>{ui.sectionId}</Label><code>{section.id}</code></div>{fields.map((field) => <SchemaFieldEditor key={field.path} field={field} value={readAtPath(section.data, field.path)} path={field.path} content={content} locale={locale} ui={ui} update={update} onUpload={onUpload} onImageListUpload={onImageListUpload} />)}</div>;
  }
  if (fields.length === 0) return <div className="scene-inspector-group"><div className="scene-group-title">{tab === "media" ? <ImagePlus size={14} /> : <SlidersHorizontal size={14} />}{tab === "media" ? ui.media : ui.behavior}</div><p className="scene-empty-hint">{ui.empty}</p></div>;
  return <div className="scene-inspector-group"><div className="scene-group-title">{tab === "media" ? <ImagePlus size={14} /> : <Type size={14} />}{schemaText(schema?.label, locale, ui.text)}</div>{fields.map((field) => <SchemaFieldEditor key={field.path} field={field} value={readAtPath(section.data, field.path)} path={field.path} content={content} locale={locale} ui={ui} update={update} onUpload={onUpload} onImageListUpload={onImageListUpload} />)}</div>;
}

function Inspector({ section, tab, setTab, update, content, locale, ui, onUpload, onImageListUpload, labels }: { section: EditorSceneSection | undefined; tab: InspectorTab; setTab: (tab: InspectorTab) => void; update: (path: string, value: unknown) => void; content: EditorContent; locale: string; ui: ReturnType<typeof useUi>; onUpload: (path: string, accept?: string) => void; onImageListUpload: (path: string, accept?: string) => void; labels: SceneGraphEditorProps["labels"] }) {
  const tabs: Array<{ id: InspectorTab; label: string; icon: typeof Type }> = [{ id: "content", label: ui.content, icon: Type }, { id: "media", label: ui.media, icon: ImagePlus }, { id: "style", label: ui.style, icon: Palette }, { id: "behavior", label: ui.behavior, icon: SlidersHorizontal }];
  return <aside className="scene-inspector scene-figma-inspector" aria-label={labels.inspector}><div className="scene-inspector-header"><div><p className="scene-panel-eyebrow">{ui.selected}</p><h2>{section?.name ?? labels.inspector}</h2></div><PanelRight size={16} aria-hidden="true" /></div>{section ? <><div className="scene-inspector-tabs" role="tablist" aria-label={labels.inspector}>{tabs.map(({ id, label, icon: Icon }) => <button type="button" key={id} role="tab" aria-selected={tab === id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}><Icon size={14} /><span>{label}</span></button>)}</div><div className="scene-inspector-scroll"><SchemaInspectorPanel section={section} tab={tab} content={content} locale={locale} ui={ui} update={update} onUpload={onUpload} onImageListUpload={onImageListUpload} /></div></> : <div className="scene-no-selection"><PanelRight size={24} /><p>{labels.selectSection}</p></div>}</aside>;
}

export function SceneGraphEditor({ content, locale, onChange, labels }: SceneGraphEditorProps) {
  const ui = useUi(locale);
  const sections = useMemo(() => content.sections ?? [], [content.sections]);
  const editorSchema = useMemo(() => getEditorSchema(content), [content]);
  const sectionPresets = useMemo(() => (editorSchema.sectionPresets ?? []).filter((preset) => Boolean(preset && typeof preset.type === "string" && preset.data && typeof preset.data === "object")), [editorSchema]);
  const [selectedId, setSelectedId] = useState<string | null>(sections[0]?.id ?? null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [newType, setNewType] = useState(sectionPresets[0]?.type ?? "custom");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("content");
  const [zoom, setZoom] = useState(100);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageListInputRef = useRef<HTMLInputElement>(null);
  const previewRootRef = useRef<HTMLDivElement>(null);
  const uploadPathRef = useRef("media");
  const defaultImageAccept = "image/jpeg,image/png,image/webp";
  const selected = sections.find((section) => section.id === selectedId) ?? sections[0];

  useEffect(() => {
    if (window.matchMedia("(max-width: 760px)").matches) setPreviewMode("mobile");
  }, []);

  useEffect(() => {
    if (sections.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      if (selectedField !== null) setSelectedField(null);
      return;
    }
    if (!sections.some((section) => section.id === selectedId)) {
      setSelectedId(sections[0].id);
      setSelectedField(null);
    }
  }, [sections, selectedField, selectedId]);

  useEffect(() => {
    if (sectionPresets.length > 0 && !sectionPresets.some((preset) => preset.type === newType)) setNewType(sectionPresets[0].type);
  }, [newType, sectionPresets]);

  useEffect(() => {
    const root = previewRootRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>("[data-editor-selected]").forEach((element) => element.removeAttribute("data-editor-selected"));
    const candidates = root.querySelectorAll<HTMLElement>("[data-editor-section], [data-editor-field]");
    candidates.forEach((element) => {
      const sectionElement = element.matches("[data-editor-section]") ? element : element.closest<HTMLElement>("[data-editor-section]");
      const sectionMatch = sectionElement?.dataset.editorSection === selected?.id;
      const fieldMatch = Boolean(selectedField && sectionMatch && element.dataset.editorField === selectedField);
      if (fieldMatch || (sectionMatch && !selectedField && element.dataset.editorSection === selected?.id)) element.setAttribute("data-editor-selected", "true");
    });
  }, [content, selected?.id, selectedField, previewMode]);

  const commitSectionUpdate = useCallback((path: string, value: unknown) => {
    if (!selected) return;
    if (selected.locked === true && path !== "__section_locked") return;
    if (path === "__section_visible") { onChange({ ...clone(content), sections: sections.map((item) => item.id === selected.id ? { ...item, visible: value === true } : item) }); return; }
    if (path === "__section_locked") { onChange({ ...clone(content), sections: sections.map((item) => item.id === selected.id ? { ...item, locked: value === true } : item) }); return; }
    if (path === "__section_name") { onChange({ ...clone(content), sections: sections.map((item) => item.id === selected.id ? { ...item, name: textValue(value, item.name) } : item) }); return; }
    const nextSection = { ...selected, data: updateAtPath(selected.data, path, value) };
    onChange({ ...clone(content), sections: sections.map((item) => item.id === selected.id ? nextSection : item) });
  }, [content, onChange, sections, selected]);

  const updateSectionMeta = useCallback((sectionId: string, key: "visible" | "locked" | "name", value: unknown) => {
    onChange({
      ...clone(content),
      sections: sections.map((item) => item.id === sectionId
        ? {
            ...item,
            [key]: key === "name" ? textValue(value, item.name) : value === true,
          }
        : item),
    });
  }, [content, onChange, sections]);

  function addSection() {
    const preset = sectionPresets.find((item) => item.type === newType) ?? sectionPresets[0];
    if (!preset) return;
    const next = { id: `${preset.type}-${Date.now().toString(36)}`, type: preset.type, name: schemaText(preset.label, locale, preset.type), data: clone(preset.data) };
    onChange({ ...clone(content), pageModel: "h5-long-scroll", sections: [...sections, next] });
    setSelectedId(next.id);
    setSelectedField(null);
  }

  function moveSection(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...clone(content), sections: next });
  }

  function deleteSection(section: EditorSceneSection) {
    if (sections.length <= 1) return;
    const next = sections.filter((item) => item.id !== section.id);
    onChange({ ...clone(content), sections: next });
    if (selectedId === section.id) setSelectedId(next[0]?.id ?? null);
    setSelectedField(null);
  }

  async function readImage(file: File) {
    return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("read")); reader.onerror = () => reject(new Error("read")); reader.readAsDataURL(file); });
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selected || selected.locked === true || !file.type.startsWith("image/")) return;
    const url = await readImage(file).catch(() => "");
    if (!url) return;
    const assetId = `upload-${Date.now().toString(36)}`;
    const next = clone(content);
    next.assets = [...(next.assets ?? []), { id: assetId, kind: "image", url, name: file.name }];
    const path = uploadPathRef.current;
    next.sections = sections.map((item) => item.id === selected.id ? { ...item, data: updateAtPath(item.data, path, { assetId, url, fit: "cover", alt: file.name.replace(/\.[^.]+$/, "") }) } : item);
    onChange(next);
  }

  function handleImageListUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    event.target.value = "";
    const path = uploadPathRef.current;
    if (!selected || selected.locked === true || files.length === 0) return;
    const list = readAtPath(selected.data, path);
    const current = Array.isArray(list) ? list : [];
    const field = findSchemaField(editorSchema.sectionTypes?.[selected.type]?.fields, path);
    const itemFields = field?.itemFields ?? [];
    const mediaField = itemFields.find((itemField) => itemField.kind === "media");
    const available = Math.max(0, (field?.maxItems ?? Number.POSITIVE_INFINITY) - current.length);
    if (!available) return;
    Promise.all(files.slice(0, available).map(async (file, index) => ({ file, url: await readImage(file), index }))).then((items) => {
      const next = clone(content);
      const additions: Array<Record<string, unknown>> = [];
      const assets = [...(next.assets ?? [])];
      items.forEach(({ file, url, index }) => {
        const assetId = `upload-${Date.now().toString(36)}-${index}`;
        const item = defaultSchemaObject(itemFields);
        if (mediaField) setAtPath(item, mediaField.path, { assetId, url, fit: "cover", alt: file.name.replace(/\.[^.]+$/, "") });
        additions.push({ ...item, id: `${path.replace(/[^a-z0-9]+/gi, "-")}-${Date.now().toString(36)}-${index}` });
        assets.push({ id: assetId, kind: "image", url, name: file.name });
      });
      next.assets = assets;
      next.sections = sections.map((item) => item.id === selected.id ? { ...item, data: updateAtPath(item.data, path, [...current, ...additions]) } : item);
      onChange(next);
    }).catch(() => undefined);
  }

  function handlePreviewClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const field = target.closest<HTMLElement>("[data-editor-field]");
    let sectionId: string | undefined;
    let cursor: HTMLElement | null = target;
    while (cursor && cursor !== previewRootRef.current) {
      const ancestorId = cursor.dataset.editorSection;
      if (ancestorId && sections.some((item) => item.id === ancestorId)) sectionId = ancestorId;
      cursor = cursor.parentElement;
    }
    if (sectionId) {
      setSelectedId(sectionId);
      if (!field?.dataset.editorField) setSelectedField(null);
    }
    if (field?.dataset.editorField) setSelectedField(field.dataset.editorField);
    if (target.closest("a")) event.preventDefault();
  }

  function handlePreviewDoubleClick(event: MouseEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-editor-field]");
    const path = target?.dataset.editorField;
    let sectionId: string | undefined;
    let cursor: HTMLElement | null = event.target as HTMLElement;
    while (cursor && cursor !== previewRootRef.current) {
      const ancestorId = cursor.dataset.editorSection;
      if (ancestorId && sections.some((item) => item.id === ancestorId)) sectionId = ancestorId;
      cursor = cursor.parentElement;
    }
    const section = sections.find((item) => item.id === sectionId);
    const current = section && path ? readAtPath(section.data, path) : undefined;
    if (!target || !section || section.locked === true || !path || typeof current !== "string") return;
    event.preventDefault();
    setSelectedId(section.id);
    setSelectedField(path);
    target.contentEditable = "true";
    target.focus();
    const finish = () => { target.contentEditable = "false"; commitSectionUpdate(path, target.textContent ?? ""); };
    target.addEventListener("blur", finish, { once: true });
  }

  const previewStyle = { "--scene-editor-zoom": `${zoom / 100}` } as CSSProperties;
  return <div className="scene-editor-shell scene-figma-workspace">
    <aside className="scene-outline scene-figma-sidebar" aria-label={labels.outline}>
      <div className="scene-figma-sidebar-top"><div className="scene-figma-brand"><div className="scene-figma-logo">C</div><div><strong>{ui.page}</strong><span>{ui.sections}</span></div></div><GripVertical size={15} aria-hidden="true" /></div>
      <div className="scene-page-tree"><div className="scene-tree-heading"><ChevronDown size={14} /><span>{ui.page}</span><span className="scene-tree-count">{sections.length}</span></div><div className="scene-outline-list">{sections.map((section, index) => { const schemaIcon = editorSchema.sectionTypes?.[section.type]?.icon; const Icon = (schemaIcon && schemaIcons[schemaIcon]) || sectionIcons[section.type] || Type; return <div key={section.id} className={`scene-outline-item ${selected?.id === section.id ? "is-selected" : ""} ${section.visible === false ? "is-hidden" : ""}`}><button type="button" className="scene-outline-select" onClick={() => { setSelectedId(section.id); setSelectedField(null); }}><span className="scene-outline-index">{String(index + 1).padStart(2, "0")}</span><Icon size={14} aria-hidden="true" /><span><strong>{section.name}</strong><small>{section.type}</small></span></button><div className="scene-outline-actions"><button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} title={labels.moveUp} aria-label={labels.moveUp}><ArrowUp size={12} /></button><button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} title={labels.moveDown} aria-label={labels.moveDown}><ArrowDown size={12} /></button><button type="button" onClick={() => updateSectionMeta(section.id, "visible", section.visible === false)} title={section.visible === false ? labels.showSection : labels.hideSection} aria-label={section.visible === false ? labels.showSection : labels.hideSection}>{section.visible === false ? <EyeOff size={12} /> : <Eye size={12} />}</button><button type="button" onClick={() => deleteSection(section)} disabled={sections.length <= 1} title={labels.deleteSection} aria-label={labels.deleteSection}><Trash2 size={12} /></button></div></div>; })}</div></div>
      <div className="scene-add-section scene-figma-add"><Label htmlFor="scene-section-type">{labels.sectionType}</Label><div className="scene-add-row"><Select id="scene-section-type" value={newType} onChange={(event) => setNewType(event.target.value)} disabled={sectionPresets.length === 0}>{sectionPresets.map((preset) => <option key={preset.type} value={preset.type}>{schemaText(preset.label, locale, preset.type)}</option>)}</Select><Button type="button" size="icon" onClick={addSection} disabled={sectionPresets.length === 0} aria-label={labels.addSection} title={labels.addSection}><Plus size={15} aria-hidden="true" /></Button></div></div>
    </aside>
    <section className={`scene-preview-stage scene-preview-stage-${previewMode} scene-figma-canvas`} aria-label="Live invitation preview"><div className="scene-preview-toolbar scene-figma-toolbar"><div className="scene-canvas-context"><span className="scene-canvas-breadcrumb">{ui.page}</span><ChevronRight size={13} /><span>{selected?.name ?? labels.inspector}</span></div><div className="scene-canvas-tools"><button type="button" className="scene-icon-button" onClick={() => setZoom((value) => Math.max(50, value - 10))} aria-label={ui.zoomOut} title={ui.zoomOut}><Minus size={14} /></button><span className="scene-zoom-value">{zoom}%</span><button type="button" className="scene-icon-button" onClick={() => setZoom((value) => Math.min(150, value + 10))} aria-label={ui.zoomIn} title={ui.zoomIn}><Plus size={14} /></button><button type="button" className="scene-icon-button" onClick={() => setZoom(100)} aria-label={ui.reset} title={ui.reset}><RotateCcw size={14} /></button><PreviewModeToggle mode={previewMode} onChange={setPreviewMode} labels={{ group: labels.previewMode, desktop: labels.desktopPreview, mobile: labels.mobilePreview }} /></div></div><div ref={previewRootRef} className="scene-preview-viewport" onClick={handlePreviewClick} onDoubleClick={handlePreviewDoubleClick}><div className={`scene-preview-device scene-figma-device is-preview-${previewMode}`} style={previewStyle}><SceneGraphInvitation content={content} locale={locale} previewOnly previewMode={previewMode} /></div></div><div className="scene-preview-hint"><span><MousePointer2 size={13} />{ui.clickToSelect}</span><span><Type size={13} />{ui.doubleClick}</span></div></section>
    <Inspector section={selected} tab={inspectorTab} setTab={setInspectorTab} update={commitSectionUpdate} content={content} locale={locale} ui={ui} onUpload={(path, accept) => { uploadPathRef.current = path; if (imageInputRef.current) { imageInputRef.current.accept = accept || defaultImageAccept; imageInputRef.current.click(); } }} onImageListUpload={(path, accept) => { uploadPathRef.current = path; if (imageListInputRef.current) { imageListInputRef.current.accept = accept || defaultImageAccept; imageListInputRef.current.click(); } }} labels={labels} />
    <input ref={imageInputRef} type="file" accept={defaultImageAccept} className="hidden" onChange={(event) => void handleImageUpload(event)} />
    <input ref={imageListInputRef} type="file" accept={defaultImageAccept} multiple className="hidden" onChange={handleImageListUpload} />
  </div>;
}
