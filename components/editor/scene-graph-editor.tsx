"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, ImagePlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SceneGraphInvitation } from "@/components/invitation/scene-graph-invitation";
import { PreviewModeToggle } from "@/components/templates/preview-mode-toggle";
import type { PreviewMode } from "@/components/templates/live-template-preview";
import type { EditorContent, EditorSceneSection } from "@/components/editor/types";

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

const SECTION_PRESETS: Array<{ type: string; name: string; data: Record<string, unknown> }> = [
  { type: "hero", name: "Hero", data: { eyebrow: "Your story begins", names: { partnerA: "Name", separator: "&", partnerB: "Name" }, date: { display: "Your date" }, location: { city: "City", venue: "Venue" }, media: { assetId: null, url: "", fit: "cover" }, scrollCue: { label: "SCROLL TO EXPLORE", targetSectionId: "story" } } },
  { type: "story", name: "Story", data: { kicker: { number: "01", label: "OUR STORY" }, label: "TO OUR DEAREST FRIENDS & FAMILY", heading: { lines: ["Tell your story"] }, paragraphs: ["Write a note for your guests."], stats: [] } },
  { type: "gallery", name: "Gallery", data: { label: "A LITTLE PREVIEW", heading: { lines: ["Your memories"] }, album: { items: [], autoplay: true, intervalMs: 6200, controls: { arrows: true, dots: true, keyboard: true, touch: true } }, secondaryImage: { assetId: null, url: "", fit: "cover" } } },
  { type: "celebration", name: "Celebration", data: { kicker: { number: "02", label: "THE CELEBRATION" }, dateLabel: "YOUR DATE", heading: { lines: ["The day"] }, intro: "Every moment prepared for meeting you.", events: [] } },
  { type: "venue", name: "Venue", data: { kicker: { number: "03", label: "THE VENUE" }, title: { lines: ["Your venue"] }, address: ["Address"], image: { assetId: null, url: "", fit: "cover" }, actions: [], meta: [] } },
  { type: "findUs", name: "Find Us", data: { kicker: { number: "04", label: "FIND US" }, heading: { lines: ["Find us"] }, description: "Add directions for your guests.", map: { provider: "google", latitude: 0, longitude: 0, embedUrl: "https://www.google.com/maps", externalUrl: "https://www.google.com/maps" } } },
  { type: "rsvp", name: "RSVP", data: { enabled: true, deadline: "KINDLY REPLY BY", heading: { lines: ["Will you join us?"] }, description: "Tell us if you can make it.", fields: { name: { label: "Name", placeholder: "Your name", required: true }, guests: { label: "Guests", min: 1, max: 4, default: 1 }, attending: { label: "Attendance", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] }, message: { label: "Message", placeholder: "A note for us" }, submitLabel: "Send RSVP" }, successMessage: "Thank you for your reply." } },
  { type: "footer", name: "Footer", data: { items: ["YOUR NAMES", "WITH LOVE, ALWAYS", "2026 / 10 / 18"] } },
  { type: "title", name: "Title", data: { title: "Your event", subtitle: "A short introduction", media: { assetId: null, url: "", fit: "cover" } } },
  { type: "details", name: "Details", data: { heading: { lines: ["Event details"] }, body: "Add the details your guests need." } },
  { type: "schedule", name: "Schedule", data: { heading: { lines: ["Schedule"] }, events: [] } },
  { type: "location", name: "Location", data: { heading: { lines: ["Location"] }, address: ["Address"], map: { provider: "google", latitude: 0, longitude: 0, embedUrl: "https://www.google.com/maps" } } },
  { type: "form", name: "Form", data: { heading: { lines: ["Reply"] }, description: "Tell us what you think.", fields: [], successMessage: "Thank you." } },
];

function clone(value: EditorContent) {
  return JSON.parse(JSON.stringify(value)) as EditorContent;
}

function cloneRecord(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function updateAtPath(value: Record<string, unknown>, path: string[], nextValue: unknown) {
  const next = cloneRecord(value);
  let cursor = next;
  path.forEach((part, index) => {
    if (index === path.length - 1) cursor[part] = nextValue;
    else {
      const child = cursor[part];
      cursor[part] = child && typeof child === "object" ? Array.isArray(child) ? [...child] : { ...(child as Record<string, unknown>) } : {};
      cursor = cursor[part] as Record<string, unknown>;
    }
  });
  return next;
}

function scalarEntries(value: unknown, prefix: string[] = []): Array<{ path: string[]; value: string; multiline: boolean }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const path = [...prefix, key];
    if (typeof child === "string" || typeof child === "number" || typeof child === "boolean") return [{ path, value: String(child), multiline: typeof child === "string" && child.length > 100 }];
    return scalarEntries(child, path);
  });
}

function SectionFieldEditor({ section, onChange }: { section: EditorSceneSection; onChange: (next: EditorSceneSection) => void }) {
  const scalarFields = useMemo(() => scalarEntries(section.data), [section.data]);
  const arrayFields = useMemo(() => Object.entries(section.data).filter(([, value]) => Array.isArray(value)), [section.data]);
  const [arrayDrafts, setArrayDrafts] = useState<Record<string, string>>({});
  useEffect(() => {
    setArrayDrafts(Object.fromEntries(arrayFields.map(([key, value]) => [key, JSON.stringify(value, null, 2)])));
  }, [arrayFields, section.id]);
  return <div className="space-y-4">
    <div className="space-y-2"><Label htmlFor="scene-section-name">Section name</Label><Input id="scene-section-name" value={section.name} onChange={(event) => onChange({ ...section, name: event.target.value })} /></div>
    {scalarFields.map(({ path, value, multiline }) => { const id = `scene-${section.id}-${path.join("-")}`; return <div className="space-y-2" key={id}><Label htmlFor={id}>{path.join(" / ")}</Label>{multiline ? <Textarea id={id} value={value} rows={3} onChange={(event) => onChange({ ...section, data: updateAtPath(section.data, path, event.target.value) })} /> : <Input id={id} value={value} onChange={(event) => { const original = path.reduce<unknown>((cursor, part) => (cursor && typeof cursor === "object" ? (cursor as Record<string, unknown>)[part] : undefined), section.data); const parsed = typeof original === "number" ? Number(event.target.value) : typeof original === "boolean" ? event.target.value === "true" : event.target.value; onChange({ ...section, data: updateAtPath(section.data, path, parsed) }); }} />}</div>; })}
    {arrayFields.map(([key, value]) => { const id = `scene-array-${section.id}-${key}`; const draft = arrayDrafts[key] ?? JSON.stringify(value, null, 2); return <div className="space-y-2" key={id}><Label htmlFor={id}>{key}</Label><Textarea id={id} rows={Math.min(8, Math.max(3, draft.split("\n").length))} value={draft} onChange={(event) => setArrayDrafts((current) => ({ ...current, [key]: event.target.value }))} onBlur={() => { try { const parsed = JSON.parse(arrayDrafts[key] ?? draft); onChange({ ...section, data: { ...section.data, [key]: parsed } }); } catch { /* keep the draft visible until it becomes valid JSON */ } }} /></div>; })}
  </div>;
}

export function SceneGraphEditor({ content, locale, onChange, labels }: SceneGraphEditorProps) {
  const sections = content.sections ?? [];
  const [selectedId, setSelectedId] = useState(sections[0]?.id ?? null);
  const [newType, setNewType] = useState(SECTION_PRESETS[0].type);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const selected = sections.find((section) => section.id === selectedId) ?? sections[0];

  useEffect(() => {
    if (window.matchMedia("(max-width: 760px)").matches) {
      setPreviewMode("mobile");
    }
  }, []);

  function commitSections(nextSections: EditorSceneSection[]) {
    onChange({ ...clone(content), pageModel: "h5-long-scroll", sections: nextSections });
  }

  function updateSection(nextSection: EditorSceneSection) {
    commitSections(sections.map((section) => section.id === nextSection.id ? nextSection : section));
  }

  function addSection() {
    const preset = SECTION_PRESETS.find((item) => item.type === newType) ?? SECTION_PRESETS[0];
    const id = `${preset.type}-${Date.now().toString(36)}`;
    const next = { id, type: preset.type, name: preset.name, data: cloneRecord(preset.data) };
    commitSections([...sections, next]);
    setSelectedId(id);
  }

  function moveSection(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    commitSections(next);
  }

  function deleteSection(section: EditorSceneSection) {
    if (sections.length <= 1) return;
    const next = sections.filter((candidate) => candidate.id !== section.id);
    commitSections(next);
    if (selectedId === section.id) setSelectedId(next[0]?.id ?? null);
  }

  async function uploadForSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selected || !file.type.startsWith("image/")) return;
    const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("read")); reader.onerror = () => reject(new Error("read")); reader.readAsDataURL(file); });
    const assetId = `upload-${Date.now().toString(36)}`;
    const nextContent = clone(content);
    nextContent.assets = [...(nextContent.assets ?? []), { id: assetId, kind: "image", url, name: file.name }];
    const mediaKey = selected.type === "venue" ? "image" : "media";
    const nextSection = { ...selected, data: { ...selected.data, [mediaKey]: { assetId, url, fit: "cover", alt: file.name.replace(/\.[^.]+$/, "") } } };
    nextContent.sections = sections.map((section) => section.id === selected.id ? nextSection : section);
    onChange(nextContent);
  }

  function addAlbumImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selected || selected.type !== "gallery" || files.length === 0) return;
    const album = selected.data.album && typeof selected.data.album === "object" ? selected.data.album as Record<string, unknown> : {};
    const current = Array.isArray(album.items) ? album.items : [];
    const available = Math.max(0, 9 - current.length);
    if (available === 0) return;
    Promise.all(files.slice(0, available).map((file) => new Promise<{ item: { id: string; media: Record<string, unknown>; caption: string }; asset: { id: string; kind: "image"; url: string; name: string } }>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { if (typeof reader.result !== "string") { reject(new Error("read")); return; } const assetId = `upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; resolve({ asset: { id: assetId, kind: "image", url: reader.result, name: file.name }, item: { id: `album-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, media: { assetId, url: reader.result, fit: "cover", alt: file.name }, caption: file.name.replace(/\.[^.]+$/, "") } }); }; reader.onerror = () => reject(new Error("read")); reader.readAsDataURL(file); }))).then((items) => {
      const nextAlbum = { ...album, items: [...current, ...items.map(({ item }) => item)] };
      const nextContent = clone(content);
      nextContent.assets = [...(nextContent.assets ?? []), ...items.map(({ asset }) => asset)];
      nextContent.sections = sections.map((section) => section.id === selected.id ? { ...selected, data: { ...selected.data, album: nextAlbum } } : section);
      onChange(nextContent);
    }).catch(() => undefined);
  }

  return <div className="scene-editor-shell">
    <aside className="scene-outline" aria-label={labels.outline}>
      <div className="scene-panel-heading"><div><p className="scene-panel-eyebrow">Structure</p><h2>{labels.outline}</h2></div><GripVertical size={16} aria-hidden="true" /></div>
      <div className="scene-outline-list">{sections.map((section, index) => <div key={section.id} className={`scene-outline-item ${selected?.id === section.id ? "is-selected" : ""}`}><button type="button" className="scene-outline-select" onClick={() => setSelectedId(section.id)}><span className="scene-outline-index">{String(index + 1).padStart(2, "0")}</span><span><strong>{section.name}</strong><small>{section.type}</small></span></button><div className="scene-outline-actions"><button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} title={labels.moveUp} aria-label={labels.moveUp}><ArrowUp size={13} /></button><button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} title={labels.moveDown} aria-label={labels.moveDown}><ArrowDown size={13} /></button><button type="button" onClick={() => updateSection({ ...section, visible: section.visible === false })} title={section.visible === false ? labels.showSection : labels.hideSection} aria-label={section.visible === false ? labels.showSection : labels.hideSection}>{section.visible === false ? <EyeOff size={13} /> : <Eye size={13} />}</button><button type="button" onClick={() => deleteSection(section)} disabled={sections.length <= 1} title={labels.deleteSection} aria-label={labels.deleteSection}><Trash2 size={13} /></button></div></div>)}</div>
      <div className="scene-add-section"><Label htmlFor="scene-section-type">{labels.sectionType}</Label><div className="scene-add-row"><Select id="scene-section-type" value={newType} onChange={(event) => setNewType(event.target.value)}>{SECTION_PRESETS.map((preset) => <option key={preset.type} value={preset.type}>{preset.name}</option>)}</Select><Button type="button" size="icon" onClick={addSection} aria-label={labels.addSection} title={labels.addSection}><Plus size={16} aria-hidden="true" /></Button></div></div>
    </aside>
    <section className={`scene-preview-stage scene-preview-stage-${previewMode}`} aria-label="Live invitation preview">
      <div className="scene-preview-toolbar">
        <PreviewModeToggle mode={previewMode} onChange={setPreviewMode} labels={{ group: labels.previewMode, desktop: labels.desktopPreview, mobile: labels.mobilePreview }} />
      </div>
      <div className={`scene-preview-device is-preview-${previewMode}`}><SceneGraphInvitation content={content} locale={locale} previewOnly previewMode={previewMode} /></div>
    </section>
    <aside className="scene-inspector" aria-label={labels.inspector}><div className="scene-panel-heading"><div><p className="scene-panel-eyebrow">Properties</p><h2>{labels.inspector}</h2></div></div>{selected ? <><p className="scene-inspector-type">{selected.type}</p><SectionFieldEditor section={selected} onChange={updateSection} /><input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void uploadForSelected(event)} /><Button type="button" variant="outline" className="w-full" onClick={() => selected.type === "gallery" ? document.getElementById("scene-album-upload")?.click() : imageInputRef.current?.click()}><ImagePlus size={15} aria-hidden="true" /> {labels.uploadImage}</Button>{selected.type === "gallery" ? <div className="scene-gallery-manager"><div className="flex items-center justify-between gap-2"><Label>{labels.album}</Label><span className="text-xs text-muted-foreground">{Array.isArray((selected.data.album as Record<string, unknown> | undefined)?.items) ? ((selected.data.album as Record<string, unknown>).items as unknown[]).length : 0}/9</span></div><input id="scene-album-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addAlbumImages} /><p className="text-xs text-muted-foreground">{labels.albumLimit}</p></div> : null}</> : <p className="text-sm text-muted-foreground">{labels.selectSection}</p>}<div className="scene-music-note"><strong>{labels.music}</strong><span>{labels.musicPlaceholder}</span></div></aside>
  </div>;
}
