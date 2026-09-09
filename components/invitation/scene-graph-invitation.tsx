"use client";

/* Media can be user-uploaded data URLs or provider URLs, so this renderer intentionally uses native img elements. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Clock3, Map, Navigation, Volume2, VolumeX } from "lucide-react";
import { RSVPForm } from "@/components/invitation/rsvp-form";
import { WeddingVariantInvitation } from "@/components/invitation/wedding-variant-invitation";
import { useInitialScrollReset } from "@/components/invitation/use-initial-scroll-reset";
import type { EditorContent, EditorSceneSection } from "@/components/editor/types";

type SceneGraphInvitationProps = {
  content: EditorContent;
  locale?: string;
  previewOnly?: boolean;
  previewMode?: "desktop" | "mobile";
  invitationSlug?: string;
  className?: string;
};

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? value as UnknownRecord : {};
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function lines(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => stringValue(item)).filter(Boolean);
  const source = record(value).lines;
  if (!Array.isArray(source)) return value ? [stringValue(value)] : [];
  return source.map((line) => {
    const lineRecord = record(line);
    const segments = Array.isArray(lineRecord.segments) ? lineRecord.segments : [];
    return segments.length > 0 ? segments.map((segment) => stringValue(record(segment).text)).join("") : stringValue(line);
  }).filter(Boolean);
}

function resolveMedia(content: EditorContent, value: unknown) {
  const media = record(value);
  if (stringValue(media.url)) return stringValue(media.url);
  const assetId = stringValue(media.assetId);
  const asset = (content.assets ?? []).find((candidate) => candidate.id === assetId);
  return asset?.url ?? "";
}

function sectionData(section: EditorSceneSection) {
  return section.data ?? {};
}

function Kicker({ value }: { value: unknown }) {
  const item = record(value);
  return (
    <div className="scene-kicker">
      <span>{stringValue(item.number)}</span><span className="scene-kicker-line" /><span>{stringValue(item.label)}</span>
    </div>
  );
}

function Heading({ value, className = "", editorField }: { value: unknown; className?: string; editorField?: string }) {
  const content = lines(value);
  return <h2 className={`scene-heading ${className}`}>{content.map((line, index) => <span key={`${line}-${index}`} className={index === content.length - 1 ? "scene-heading-accent" : ""} data-editor-field={editorField ? `${editorField}.lines.${index}` : undefined}>{line}</span>)}</h2>;
}

function HeroSection({ content, data, id, onMusicToggle, musicPlaying }: { content: EditorContent; data: UnknownRecord; id: string; onMusicToggle: () => void; musicPlaying: boolean }) {
  const names = record(data.names);
  const location = record(data.location);
  const media = resolveMedia(content, data.media);
  const scrollCue = record(data.scrollCue);
  return (
    <section id={id} className="scene-section scene-hero" data-editor-section={id}>
      {media ? <img className="scene-hero-media" src={media} alt={stringValue(record(data.media).alt)} /> : null}
      <div className="scene-hero-vignette" aria-hidden="true" />
      <div className="scene-hero-glow" aria-hidden="true" />
      <div className="scene-hero-topline">
        <div className="scene-brand"><strong>{stringValue(record(data.brand).monogram, `${stringValue(names.partnerA, "A")} & ${stringValue(names.partnerB, "B")}`)}</strong><span>{stringValue(record(data.brand).caption)}</span></div>
        <button type="button" className="scene-sound-button" onClick={onMusicToggle} aria-pressed={musicPlaying} title={musicPlaying ? "关闭背景音乐" : "播放背景音乐"}>
          {musicPlaying ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}<span>{musicPlaying ? "静音" : stringValue(record(data.soundControl).label, "声音")}</span>
        </button>
      </div>
      <div className="scene-hero-copy">
        <p className="scene-eyebrow" data-editor-field="eyebrow">{stringValue(data.eyebrow)}</p>
        <h1><span data-editor-field="names.partnerA">{stringValue(names.partnerA)}</span><em data-editor-field="names.separator">{stringValue(names.separator, "&")}</em><span data-editor-field="names.partnerB">{stringValue(names.partnerB)}</span></h1>
        <p className="scene-hero-date" data-editor-field="date.display">{stringValue(record(data.date).display, stringValue(data.date))}</p>
        <div className="scene-hero-rule"><span /><span>✦</span><span /></div>
        <p className="scene-hero-location"><span data-editor-field="location.city">{stringValue(location.city)}</span>{location.city && location.venue ? " · " : null}<span data-editor-field="location.venue">{stringValue(location.venue)}</span></p>
      </div>
      <a className="scene-scroll-cue" href={`#${stringValue(scrollCue.targetSectionId, "story")}`}><span data-editor-field="scrollCue.label">{stringValue(scrollCue.label, "SCROLL TO EXPLORE")}</span><ArrowDown size={15} aria-hidden="true" /></a>
    </section>
  );
}

function StorySection({ data, id }: { data: UnknownRecord; id: string }) {
  const stats = Array.isArray(data.stats) ? data.stats : [];
  const paragraphs = Array.isArray(data.paragraphs) ? data.paragraphs : [];
  return (
    <section id={id} className="scene-section scene-story" data-editor-section={id}>
      <Kicker value={data.kicker} />
      <div className="scene-story-grid">
        <div><p className="scene-micro-label" data-editor-field="label">{stringValue(data.label)}</p><Heading value={data.heading} editorField="heading" /></div>
        <div className="scene-story-copy">{paragraphs.map((paragraph, index) => <p key={`${String(paragraph)}-${index}`} data-editor-field={`paragraphs.${index}`}>{stringValue(paragraph)}</p>)}<div className="scene-signature"><span data-editor-field="signature.caption">{stringValue(record(data.signature).caption)}</span><strong data-editor-field="signature.names">{stringValue(record(data.signature).names)}</strong></div></div>
      </div>
      <div className="scene-story-stats">{stats.map((stat, index) => <div key={index}><strong>{stringValue(record(stat).value)}</strong><span>{stringValue(record(stat).label)}</span></div>)}</div>
    </section>
  );
}

function GallerySection({ content, data, id }: { content: EditorContent; data: UnknownRecord; id: string }) {
  const album = record(data.album);
  const items = Array.isArray(album.items) ? album.items : [];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);
  const reduceMotion = usePrefersReducedMotion();
  const safeIndex = items.length > 0 ? Math.min(active, items.length - 1) : 0;
  useEffect(() => {
    if (paused || reduceMotion || !Boolean(album.autoplay) || items.length < 2) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % items.length), Number(album.intervalMs ?? 6200));
    return () => window.clearInterval(timer);
  }, [album.autoplay, album.intervalMs, items.length, paused, reduceMotion]);
  function move(delta: number) { if (items.length > 0) setActive((index) => (index + delta + items.length) % items.length); }
  const current = record(items[safeIndex]);
  const currentMedia = resolveMedia(content, current.media);
  return (
    <section id={id} className="scene-section scene-gallery" data-editor-section={id}>
      <div className="scene-album" tabIndex={0} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onKeyDown={(event) => { if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1); }} onPointerDown={(event) => setStartX(event.clientX)} onPointerUp={(event) => { if (startX === null) return; const delta = event.clientX - startX; setStartX(null); if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1); }}>
        {currentMedia ? <img src={currentMedia} alt={stringValue(record(current.media).alt, stringValue(current.caption))} data-editor-field={`album.items.${safeIndex}.media`} /> : <div className="scene-album-empty">添加相册图片</div>}
        <div className="scene-album-caption" data-editor-field={`album.items.${safeIndex}.caption`}>{stringValue(current.caption)}</div>
        {items.length > 1 ? <><button type="button" className="scene-album-control scene-album-prev" onClick={() => move(-1)} aria-label="上一张"><ArrowLeft size={16} aria-hidden="true" /></button><button type="button" className="scene-album-control scene-album-next" onClick={() => move(1)} aria-label="下一张"><ArrowRight size={16} aria-hidden="true" /></button></> : null}
        {items.length > 1 ? <div className="scene-album-dots" role="tablist" aria-label="选择相册图片">{items.map((item, index) => <button type="button" key={stringValue(record(item).id, String(index))} className={index === safeIndex ? "is-active" : ""} onClick={() => setActive(index)} role="tab" aria-selected={index === safeIndex} aria-label={`查看第 ${index + 1} 张`} />)}</div> : null}
      </div>
      <div className="scene-gallery-copy"><p className="scene-micro-label" data-editor-field="label">{stringValue(data.label)}</p><Heading value={data.heading} editorField="heading" /><span className="scene-gallery-index" data-editor-field="indexLabel">{stringValue(data.indexLabel)}</span></div>
      {resolveMedia(content, data.secondaryImage) ? <img className="scene-gallery-secondary" src={resolveMedia(content, data.secondaryImage)} alt={stringValue(record(data.secondaryImage).alt)} data-editor-field="secondaryImage" /> : null}
    </section>
  );
}

function CelebrationSection({ data, id }: { data: UnknownRecord; id: string }) {
  const events = Array.isArray(data.events) ? data.events : [];
  return <section id={id} className="scene-section scene-celebration" data-editor-section={id}><Kicker value={data.kicker} /><div className="scene-celebration-head"><div><p className="scene-micro-label" data-editor-field="dateLabel">{stringValue(data.dateLabel)}</p><Heading value={data.heading} editorField="heading" /></div><p data-editor-field="intro">{stringValue(data.intro)}</p></div><div className="scene-timeline">{events.map((event, index) => { const item = record(event); return <article key={stringValue(item.id, String(index))}><div className="scene-timeline-time"><strong data-editor-field={`events.${index}.time`}>{stringValue(item.time)}</strong><span data-editor-field={`events.${index}.label`}>{stringValue(item.label)}</span></div><div className="scene-timeline-dot" /><div><h3 data-editor-field={`events.${index}.title`}>{stringValue(item.title)}</h3><p data-editor-field={`events.${index}.description`}>{stringValue(item.description)}</p></div></article>; })}</div></section>;
}

function VenueSection({ content, data, id }: { content: EditorContent; data: UnknownRecord; id: string }) {
  const actions = Array.isArray(data.actions) ? data.actions : [];
  const meta = Array.isArray(data.meta) ? data.meta : [];
  return <section id={id} className="scene-section scene-venue" data-editor-section={id}><div className="scene-venue-image">{resolveMedia(content, data.image) ? <img src={resolveMedia(content, data.image)} alt={stringValue(record(data.image).alt)} data-editor-field="image" /> : null}<span data-editor-field="photoLabel">{stringValue(data.photoLabel)}</span></div><div className="scene-venue-copy"><Kicker value={data.kicker} /><Heading value={data.title} editorField="title" /> <p className="scene-venue-address">{(Array.isArray(data.address) ? data.address : []).map((line, index) => <span key={`${String(line)}-${index}`} data-editor-field={`address.${index}`}>{stringValue(line)}</span>)}</p><div className="scene-actions">{actions.map((action, index) => { const item = record(action); return <a key={stringValue(item.id, String(index))} href={stringValue(item.href, "#map")} target={item.target === "new" ? "_blank" : undefined} rel={item.target === "new" ? "noreferrer" : undefined} className={index === 0 ? "scene-button scene-button-primary" : "scene-button scene-button-quiet"}>{item.icon === "navigation" ? <Navigation size={14} aria-hidden="true" /> : <Map size={14} aria-hidden="true" />}{stringValue(item.label)}</a>; })}</div><div className="scene-venue-meta">{meta.map((item, index) => <span key={index}>{record(item).icon === "clock-3" ? <Clock3 size={13} aria-hidden="true" /> : <Navigation size={13} aria-hidden="true" />}{stringValue(record(item).text)}</span>)}</div></div></section>;
}

function FindUsSection({ data, id, locale }: { data: UnknownRecord; id: string; locale: string }) {
  const map = record(data.map);
  const providers = record(map.providers);
  const localeProvider = record(providers[locale] ?? providers.default);
  const provider = stringValue(localeProvider.provider, stringValue(map.provider, locale === "zh-CN" ? "amap" : "google"));
  const embedUrl = stringValue(localeProvider.embedUrl, stringValue(map.embedUrl, provider === "amap" ? "https://ditu.amap.com" : "https://www.google.com/maps"));
  const externalUrl = stringValue(localeProvider.externalUrl, stringValue(map.externalUrl, embedUrl));
  return <section id={id} className="scene-section scene-find-us" data-editor-section={id}><div><Kicker value={data.kicker} /><Heading value={data.heading} editorField="heading" /><p data-editor-field="description">{stringValue(data.description)}</p></div><div className="scene-map-frame"><iframe title={stringValue(map.markerLabel, "活动地图")} src={embedUrl} loading="lazy" tabIndex={-1} /><a href={externalUrl} target="_blank" rel="noreferrer" className="scene-map-expand" aria-label={`在新窗口打开${provider}地图`}><Map size={15} aria-hidden="true" /></a></div></section>;
}

function RsvpSection({ data, id, previewOnly, invitationSlug }: { data: UnknownRecord; id: string; previewOnly: boolean; invitationSlug?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const fields = record(data.fields);
  const nameField = record(fields.name);
  const guestsField = record(fields.guests);
  const attendingField = record(fields.attending);
  const messageField = record(fields.message);
  const attendanceOptions: unknown[] = Array.isArray(attendingField.options) ? attendingField.options : [{ value: "yes", label: "如约而至" }, { value: "no", label: "遗憾缺席" }];
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSubmitted(true); }
  return <section id={id} className="scene-section scene-rsvp" data-editor-section={id}><div className="scene-rsvp-copy"><p className="scene-micro-label" data-editor-field="deadline">{stringValue(data.deadline)}</p><Heading value={data.heading} editorField="heading" /><p data-editor-field="description">{stringValue(data.description)}</p></div>{previewOnly || !invitationSlug ? (submitted ? <div className="scene-rsvp-success" role="status">{stringValue(data.successMessage, "谢谢你，我们已经收到你的回执。")}</div> : <form className="scene-rsvp-form" onSubmit={submit}><label><span>{stringValue(nameField.label, "姓名")}</span><input name="name" placeholder={stringValue(nameField.placeholder)} required={nameField.required !== false} /></label><label><span>{stringValue(guestsField.label, "出席人数")}</span><select name="guests" defaultValue={String(guestsField.default ?? 1)}>{Array.from({ length: Math.max(1, Number(guestsField.max ?? 4)) }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} 位</option>)}</select></label><fieldset><legend>{stringValue(attendingField.label, "出席意愿")}</legend><div className="scene-choice-row">{attendanceOptions.map((option: unknown, index: number) => <label key={index}><input type="radio" name="attending" value={stringValue(record(option).value)} defaultChecked={index === 0} /><span>{stringValue(record(option).label)}</span></label>)}</div></fieldset><label><span>{stringValue(messageField.label, "想对我们说")}</span><textarea name="message" rows={2} placeholder={stringValue(messageField.placeholder)} /></label><button type="submit" className="scene-button scene-button-primary">{stringValue(fields.submitLabel, "发送回执")}</button></form>) : <RSVPForm invitationSlug={invitationSlug} />}</section>;
}

function FooterSection({ data, id }: { data: UnknownRecord; id: string }) {
  const items = Array.isArray(data.items) ? data.items : [];
  return <footer id={id} className="scene-footer" data-editor-section={id}>{items.map((item, index) => <span key={index} data-editor-field={`items.${index}`}>{stringValue(item)}</span>)}</footer>;
}

function GenericSection({ section }: { section: EditorSceneSection }) {
  const data = sectionData(section);
  const body = Array.isArray(data.paragraphs) ? data.paragraphs : [data.body ?? data.description ?? data.text];
  return <section id={section.id} className="scene-section scene-generic"><p className="scene-micro-label">{section.type}</p><Heading value={data.heading ?? data.title ?? { lines: [section.name] }} editorField={data.heading ? "heading" : data.title ? "title" : undefined} />{body.filter(Boolean).map((item, index) => <p key={index} data-editor-field={Array.isArray(data.paragraphs) ? `paragraphs.${index}` : data.body ? "body" : data.description ? "description" : "text"}>{stringValue(item)}</p>)}</section>;
}

function AmbientEffects({ content }: { content: EditorContent }) {
  const effects = record(content.effects);
  const particles = record(effects.particles);
  const petals = record(effects.petals);
  const particleCount = Math.min(24, Math.max(0, Number(particles.countPreview ?? 12)));
  const petalCount = Math.min(8, Math.max(0, Number(petals.count ?? 6)));
  return <>
    {particles.enabled !== false && particleCount > 0 ? <div className="scene-particles" aria-hidden="true">{Array.from({ length: particleCount }, (_, index) => <i key={index} style={{ "--scene-particle-x": `${(index * 37) % 100}%`, "--scene-particle-y": `${(index * 61) % 100}%`, "--scene-particle-delay": `${(index % 8) * -1.3}s` } as CSSProperties} />)}</div> : null}
    {petals.enabled !== false && petalCount > 0 ? <div className="scene-petals" aria-hidden="true">{Array.from({ length: petalCount }, (_, index) => <i key={index} style={{ left: `${(index * 17) % 100}%`, animationDelay: `${(index % 6) * -2.2}s`, animationDuration: `${15 + (index % 8)}s` }} />)}</div> : null}
    {record(effects.noise).enabled !== false ? <div className="scene-noise" aria-hidden="true" /> : null}
  </>;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

export function SceneGraphInvitation({ content, locale = "en", previewOnly = true, previewMode, invitationSlug, className = "" }: SceneGraphInvitationProps) {
  const sections = useMemo(() => (content.sections ?? []).filter((section) => section.visible !== false), [content.sections]);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const resetKey = `${previewMode ?? "published"}:${sections.map((section) => section.id).join(",")}`;
  useInitialScrollReset(rootRef, { resetKey });
  const variantLayout = Number(record(record(content.settings).designVariant).layout);
  if (Number.isInteger(variantLayout) && variantLayout >= 1 && variantLayout <= 10) {
    return <WeddingVariantInvitation content={content} layout={variantLayout} locale={locale} previewOnly={previewOnly} previewMode={previewMode} invitationSlug={invitationSlug} className={className} />;
  }
  return <div ref={rootRef} className={`scene-invitation ${previewMode ? `scene-preview-${previewMode}` : ""} ${className}`} data-preview-only={previewOnly ? "true" : "false"} data-preview-mode={previewMode}>
    <AmbientEffects content={content} />
    {sections.map((section) => {
      const data = sectionData(section);
      let rendered: ReactNode;
      if (section.type === "hero") rendered = <HeroSection content={content} data={data} id={section.id} onMusicToggle={() => setMusicPlaying((value) => !value)} musicPlaying={musicPlaying} />;
      else if (section.type === "story") rendered = <StorySection data={data} id={section.id} />;
      else if (section.type === "gallery") rendered = <GallerySection content={content} data={data} id={section.id} />;
      else if (section.type === "celebration") rendered = <CelebrationSection data={data} id={section.id} />;
      else if (section.type === "venue") rendered = <VenueSection content={content} data={data} id={section.id} />;
      else if (section.type === "findUs") rendered = <FindUsSection data={data} id={section.id} locale={locale} />;
      else if (section.type === "rsvp" && Boolean(data.enabled ?? true)) rendered = <RsvpSection data={data} id={section.id} previewOnly={previewOnly} invitationSlug={invitationSlug} />;
      else if (section.type === "footer") rendered = <FooterSection data={data} id={section.id} />;
      else rendered = <GenericSection section={section} />;
      return <div key={section.id} data-editor-section={section.id} className="scene-editor-section-target">{rendered}</div>;
    })}
  </div>;
}
