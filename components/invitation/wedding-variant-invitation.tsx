"use client";

/* Template media may be user-uploaded data URLs, so native img elements are required here. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Maximize2, Navigation, Volume2, VolumeX } from "lucide-react";
import { RSVPForm } from "@/components/invitation/rsvp-form";
import type { EditorContent, EditorSceneSection } from "@/components/editor/types";

type WeddingVariantInvitationProps = {
  content: EditorContent;
  layout: number;
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

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function textLines(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => textValue(item)).filter(Boolean);
  const source = record(value).lines;
  return Array.isArray(source) ? source.map((item) => textValue(item)).filter(Boolean) : value ? [textValue(value)] : [];
}

function resolveMedia(content: EditorContent, value: unknown) {
  const media = record(value);
  const directUrl = textValue(media.url);
  if (directUrl) return directUrl;
  const assetId = textValue(media.assetId);
  return content.assets?.find((asset) => asset.id === assetId)?.url ?? "";
}

function mediaStyle(value: unknown): CSSProperties {
  const media = record(value);
  const fit = textValue(media.fit, "cover");
  return {
    objectFit: (fit === "contain" || fit === "fill" ? fit : "cover") as CSSProperties["objectFit"],
    objectPosition: textValue(media.position, "center"),
  };
}

function SectionHeading({ value }: { value: unknown }) {
  const headingLines = textLines(value);
  return <h2>{headingLines.map((line, index) => <span key={`${line}-${index}`}>{index > 0 ? <br /> : null}{index === headingLines.length - 1 ? <em>{line}</em> : line}</span>)}</h2>;
}

function ThemeProps({ layout }: { layout: number }) {
  if (layout === 1) return <><div className="jade-moon-scene" aria-hidden="true"><span className="jade-moon-disc" /><span className="jade-moon-orbit" /><span className="jade-moon-phase">PHASE 01 · OCTOBER</span></div><div className="jade-bamboo" aria-hidden="true"><i /><i /><i /><i /></div></>;
  if (layout === 2) return <div className="theme-prop rococo-props" aria-hidden="true"><span className="rococo-scrollwork" /><span className="rococo-pearl pearl-a" /><span className="rococo-pearl pearl-b" /><span className="rococo-ribbon">INVITATION A L&apos;AMOUR</span></div>;
  if (layout === 3) return <div className="theme-prop cinema-props" aria-hidden="true"><span className="cinema-hud">ISO 800 · 50MM · F1.4</span><span className="cinema-sidecode">LX / TAKE 018</span><span className="cinema-scan" /></div>;
  if (layout === 4) return <div className="theme-prop coastal-props" aria-hidden="true"><span className="coastal-wave wave-one" /><span className="coastal-wave wave-two" /><span className="coastal-pearl pearl-one" /><span className="coastal-pearl pearl-two" /><span className="coastal-compass">N<br /><b>W</b><br />S</span></div>;
  if (layout === 5) return <div className="theme-prop terracotta-props" aria-hidden="true"><span className="terracotta-tile tile-one" /><span className="terracotta-tile tile-two" /><span className="terracotta-tile tile-three" /><span className="terracotta-sun" /><span className="terracotta-note">AIRE DE FETE<br /><small>HANGZHOU · 2026</small></span></div>;
  if (layout === 6) return <div className="theme-prop mono-props" aria-hidden="true"><span className="mono-rule rule-a" /><span className="mono-rule rule-b" /><span className="mono-stamp">LX-018</span><span className="mono-dot" /></div>;
  if (layout === 7) return <div className="theme-prop sakura-props" aria-hidden="true"><span className="sakura-lantern lantern-a" /><span className="sakura-lantern lantern-b" /><span className="sakura-petal petal-a">✿</span><span className="sakura-petal petal-b">✿</span><span className="sakura-petal petal-c">✿</span></div>;
  if (layout === 8) return <div className="theme-prop deco-props" aria-hidden="true"><span className="deco-ray ray-a" /><span className="deco-ray ray-b" /><span className="deco-ray ray-c" /><span className="deco-diamond" /><span className="deco-caption">THE GOLDEN HOUR</span></div>;
  if (layout === 9) return <div className="theme-prop lavender-props" aria-hidden="true"><span className="lavender-const const-a" /><span className="lavender-const const-b" /><span className="lavender-const const-c" /><span className="lavender-star star-a">✦</span><span className="lavender-star star-b">✦</span><span className="lavender-caption">VIOLET HOUR / 18.10.26</span></div>;
  if (layout === 10) return <div className="theme-prop meadow-props" aria-hidden="true"><span className="meadow-stem stem-one" /><span className="meadow-stem stem-two" /><span className="meadow-flower flower-one">✽</span><span className="meadow-flower flower-two">✿</span><span className="meadow-label">FIELD NOTE 018<br /><small>pressed in october</small></span></div>;
  return null;
}

function VariantParticles({ content }: { content: EditorContent }) {
  const particles = record(record(content.effects).particles);
  const count = Math.min(24, Math.max(0, Number(particles.countPreview ?? 12)));
  if (particles.enabled === false || count === 0) return null;
  return <div className="variant-particles" aria-hidden="true">{Array.from({ length: count }, (_, index) => <i key={index} style={{ "--variant-particle-x": `${(index * 37 + 11) % 100}%`, "--variant-particle-y": `${(index * 61 + 7) % 100}%`, "--variant-particle-delay": `${(index % 8) * -1.25}s` } as CSSProperties} />)}</div>;
}

function Hero({ content, data, layout, edition }: { content: EditorContent; data: UnknownRecord; layout: number; edition: string }) {
  const names = record(data.names);
  const location = record(data.location);
  const media = data.media;
  const heroUrl = resolveMedia(content, media);
  const scrollCue = record(data.scrollCue);
  const heroStyle = heroUrl ? { "--hero": `url(${JSON.stringify(heroUrl)})`, "--hero-position": textValue(record(media).position, "center 62%") } as CSSProperties : undefined;
  return (
    <section className="module hero" id="hero" style={heroStyle}>
      <div className="hero-content">
        <p className="hero-kicker reveal is-visible">{textValue(data.eyebrow)}</p>
        <h1 className="reveal delay-1 is-visible">{textValue(names.partnerA)} <span>{textValue(names.separator, "&")}</span> {textValue(names.partnerB)}</h1>
        <p className="hero-date reveal delay-2 is-visible">{textValue(record(data.date).display, textValue(data.date))}</p>
        <div className="hero-ornament reveal delay-2 is-visible"><b>✦</b></div>
        <p className="hero-location reveal delay-3 is-visible">{[textValue(location.city), textValue(location.venue)].filter(Boolean).join(" · ")}</p>
      </div>
      <ThemeProps layout={layout} />
      <a className="scroll-cue" href={`#${textValue(scrollCue.targetSectionId, "story")}`}><span>{textValue(scrollCue.label, "SCROLL")}</span><span>↓</span></a>
      <div className="hero-rail">01 / A LOVE LETTER</div>
      <span className="sr-only">{edition}</span>
    </section>
  );
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

function Album({ content, album }: { content: EditorContent; album: UnknownRecord }) {
  const items = useMemo(() => Array.isArray(album.items) ? album.items : [], [album.items]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);
  const reduceMotion = usePrefersReducedMotion();
  const safeActive = items.length ? Math.min(active, items.length - 1) : 0;
  useEffect(() => {
    if (paused || reduceMotion || album.autoplay === false || items.length < 2) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % items.length), Math.max(2000, Number(album.intervalMs ?? 6200)));
    return () => window.clearInterval(timer);
  }, [album.autoplay, album.intervalMs, items.length, paused, reduceMotion]);
  function move(delta: number) { if (items.length) setActive((index) => (index + delta + items.length) % items.length); }
  function finishSwipe(event: ReactPointerEvent<HTMLDivElement>) { if (startX.current == null) return; const delta = event.clientX - startX.current; startX.current = null; if (Math.abs(delta) > 44) move(delta < 0 ? 1 : -1); }
  return (
    <div className="album reveal delay-1 is-visible" tabIndex={0} role="region" aria-roledescription="carousel" aria-label={`故事相册，第 ${safeActive + 1} 张，共 ${items.length} 张`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }} onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); } if (event.key === "ArrowRight") { event.preventDefault(); move(1); } }} onPointerDown={(event) => { startX.current = event.clientX; }} onPointerUp={finishSwipe} onPointerCancel={() => { startX.current = null; }}>
      <div className="album-viewport"><div className="album-track" style={{ transform: `translate3d(${-safeActive * 100}%,0,0)` }}>{items.map((value, index) => { const item = record(value); const media = item.media; const url = resolveMedia(content, media); return <figure className="album-slide" key={textValue(item.id, String(index))} aria-hidden={index !== safeActive}>{url ? <img src={url} alt={textValue(record(media).alt, textValue(item.caption))} style={mediaStyle(media)} /> : <span className="album-empty">添加相册图片</span>}<figcaption>{textValue(item.caption)}</figcaption></figure>; })}</div></div>
      {items.length > 1 ? <><button className="album-control album-prev" type="button" onClick={() => move(-1)} aria-label="上一张"><ArrowLeft aria-hidden="true" /></button><button className="album-control album-next" type="button" onClick={() => move(1)} aria-label="下一张"><ArrowRight aria-hidden="true" /></button><div className="album-dots" role="tablist" aria-label="选择相册图片">{items.map((value, index) => <button className={`album-dot ${index === safeActive ? "is-active" : ""}`} type="button" key={textValue(record(value).id, String(index))} role="tab" aria-selected={index === safeActive} aria-label={`查看第 ${index + 1} 张`} onClick={() => setActive(index)} />)}</div></> : null}
    </div>
  );
}

function Story({ content, data, id }: { content: EditorContent; data: UnknownRecord; id: string }) {
  const paragraphs = Array.isArray(data.paragraphs) ? data.paragraphs : [];
  const signature = record(data.signature);
  return <section className="module story" id={id}><div className="wrap"><div className="module-code reveal is-visible">{textValue(data.moduleCode, "02 / STORY ALBUM")}</div><div className="story-layout"><Album content={content} album={record(data.album)} /><div className="story-copy reveal is-visible"><p className="eyebrow">{textValue(data.label)}</p><SectionHeading value={data.heading} />{paragraphs.map((paragraph, index) => <p key={index}>{textValue(paragraph)}</p>)}<div className="story-signature"><span>{textValue(signature.caption)}</span><strong>{textValue(signature.names)}</strong></div></div></div></div></section>;
}

function mapDetails(data: UnknownRecord, locale: string) {
  const map = record(data.map);
  const providers = record(map.providers);
  const isChinese = locale.toLowerCase().startsWith("zh");
  const localized = record(isChinese ? providers["zh-CN"] ?? providers.zh ?? providers.default : providers[locale] ?? providers.default);
  const provider = textValue(localized.provider, textValue(map.provider, isChinese ? "amap" : "google"));
  const embedUrl = textValue(localized.embedUrl, textValue(map.embedUrl, provider === "amap" ? "https://ditu.amap.com" : "https://www.google.com/maps"));
  const externalUrl = textValue(localized.externalUrl, textValue(map.externalUrl, embedUrl));
  return { map, provider, embedUrl, externalUrl };
}

function Details({ content, data, id, locale }: { content: EditorContent; data: UnknownRecord; id: string; locale: string }) {
  const events = Array.isArray(data.events) ? data.events : [];
  const address = Array.isArray(data.address) ? data.address : [];
  const actions = Array.isArray(data.actions) ? data.actions : [];
  const media = resolveMedia(content, data.media) ? data.media : data.image;
  const imageUrl = resolveMedia(content, media);
  const { map, provider, embedUrl, externalUrl } = mapDetails(data, locale);
  return (
    <section className="module details" id={id}><div className="details-inner">
      <div className="details-copy reveal is-visible"><div className="module-code">{textValue(data.moduleCode, "03 / THE CELEBRATION")}</div><SectionHeading value={data.heading} /><div className="day-list">{events.map((value, index) => { const item = record(value); return <div className="day-item" key={textValue(item.id, String(index))}><div><strong>{textValue(item.time)}</strong><span>{textValue(item.label)}</span></div><p>{[textValue(item.title), textValue(item.description)].filter(Boolean).join(" · ")}</p></div>; })}</div></div>
      {imageUrl ? <div className="detail-image reveal delay-1 is-visible"><img src={imageUrl} alt={textValue(record(media).alt)} style={mediaStyle(media)} /></div> : null}
      <div className="venue-row reveal delay-2 is-visible"><span>{address.map((line, index) => <span key={index}>{index > 0 ? <br /> : null}{textValue(line)}</span>)}</span>{actions.length ? actions.map((value, index) => { const action = record(value); const href = textValue(action.kind) === "navigation" ? externalUrl : textValue(action.href, externalUrl); return <a className={`button ${index > 0 ? "button-quiet" : ""}`} href={href} target="_blank" rel="noreferrer" key={textValue(action.id, String(index))}><Navigation aria-hidden="true" /><span>{textValue(action.label, "导航前往")}</span></a>; }) : <a className="button" href={externalUrl} target="_blank" rel="noreferrer"><Navigation aria-hidden="true" /><span>导航前往</span></a>}</div>
      <div className="map-frame reveal delay-3 is-visible"><iframe title={textValue(map.markerLabel, "活动地图")} src={embedUrl} loading="lazy" /><a className="map-expand" href={externalUrl} target="_blank" rel="noreferrer" title={`在新窗口打开${provider}地图`}><Maximize2 aria-hidden="true" /></a></div>
    </div></section>
  );
}

function PreviewReplyForm({ data }: { data: UnknownRecord }) {
  const formId = useId();
  const [status, setStatus] = useState("");
  const fields = record(data.fields);
  const name = record(fields.name);
  const guests = record(fields.guests);
  const attending = record(fields.attending);
  const message = record(fields.message);
  const options = Array.isArray(attending.options) ? attending.options : [];
  const maximumGuests = Math.max(1, Number(guests.max ?? 4));
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const guestName = textValue(new FormData(event.currentTarget).get("name")).trim(); if (guestName) setStatus(`谢谢你，${guestName}！${textValue(data.successMessage, "我们已经收到你的回执。")}`); }
  return <form className="reply-form reveal delay-1 is-visible" onSubmit={submit}><label><span>{textValue(name.label, "你的名字")}</span><input name="name" type="text" placeholder={textValue(name.placeholder)} autoComplete="name" required={name.required !== false} /></label><label><span>{textValue(guests.label, "出席人数")}</span><select name="guests" defaultValue={String(guests.default ?? 1)}>{Array.from({ length: maximumGuests }, (_, index) => <option value={index + 1} key={index + 1}>{index + 1} 位</option>)}</select></label><fieldset><legend>{textValue(attending.label, "出席意愿")}</legend><div className="choice-row">{options.map((value, index) => { const option = record(value); return <label className="choice" key={textValue(option.value, String(index))}><input name={`${formId}-attending`} type="radio" value={textValue(option.value)} defaultChecked={index === 0} /><span>{textValue(option.label)}</span></label>; })}</div></fieldset><label><span>{textValue(message.label, "想对我们说")}</span><textarea name="message" rows={2} placeholder={textValue(message.placeholder)} /></label><button className="button submit" type="submit"><span>{textValue(fields.submitLabel, "发送回执")}</span><ArrowUpRight aria-hidden="true" /></button><p className="form-status" role="status">{status}</p></form>;
}

function Reply({ data, id, previewOnly, invitationSlug }: { data: UnknownRecord; id: string; previewOnly: boolean; invitationSlug?: string }) {
  return <section className="module reply" id={id}><div className="reply-inner"><div className="reply-copy reveal is-visible"><div className="module-code">{textValue(data.deadline, "04 / RSVP")}</div><SectionHeading value={data.heading} /><p>{textValue(data.description)}</p></div>{previewOnly || !invitationSlug ? <PreviewReplyForm data={data} /> : <div className="variant-live-rsvp"><RSVPForm invitationSlug={invitationSlug} /></div>}</div></section>;
}

function GenericSection({ section }: { section: EditorSceneSection }) {
  const data = record(section.data);
  const paragraphs = Array.isArray(data.paragraphs) ? data.paragraphs : [data.body ?? data.description ?? data.text].filter(Boolean);
  return <section className="module story" id={section.id}><div className="wrap"><div className="module-code">{section.type.toUpperCase()}</div><div className="story-copy"><SectionHeading value={data.heading ?? data.title ?? { lines: [section.name] }} />{paragraphs.map((paragraph, index) => <p key={index}>{textValue(paragraph)}</p>)}</div></div></section>;
}

function Footer({ data }: { data: UnknownRecord }) {
  const items = Array.isArray(data.items) ? data.items : [];
  return <footer className="footer">{items.map((item, index) => <span key={index}>{textValue(item)}</span>)}</footer>;
}

export function WeddingVariantInvitation({ content, layout, locale = "en", previewOnly = true, previewMode, invitationSlug, className = "" }: WeddingVariantInvitationProps) {
  const sections = useMemo(() => (content.sections ?? []).filter((section) => section.visible !== false), [content.sections]);
  const hero = sections.find((section) => section.type === "hero");
  const designVariant = record(record(content.settings).designVariant);
  const edition = textValue(designVariant.label, textValue(record(record(hero?.data).brand).caption));
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const parent = rootRef.current?.parentElement;
    const target: HTMLElement | Window = parent && getComputedStyle(parent).overflowY !== "visible" ? parent : window;
    const update = () => setScrolled(target instanceof Window ? target.scrollY > 24 : target.scrollTop > 24);
    update();
    target.addEventListener("scroll", update, { passive: true });
    return () => target.removeEventListener("scroll", update);
  }, []);
  return (
    <div ref={rootRef} className={`wedding-variant layout-${layout} ${previewMode ? `variant-preview-${previewMode}` : ""} ${className}`} data-preview-only={previewOnly ? "true" : "false"} data-preview-mode={previewMode}>
      <div className="shell"><VariantParticles content={content} /><div className="grain" aria-hidden="true" /><header className={`topbar ${scrolled ? "is-scrolled" : ""}`}><a className="back" href="#story">THE INVITATION</a><span className="edition">{edition}</span><button className={`sound-toggle ${musicPlaying ? "is-playing" : ""}`} type="button" onClick={() => setMusicPlaying((playing) => !playing)} aria-pressed={musicPlaying} title={musicPlaying ? "关闭背景音乐" : "播放背景音乐"}>{musicPlaying ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}<span className="sound-label">{musicPlaying ? "静音" : textValue(record(record(hero?.data).soundControl).label, "声音")}</span></button></header>
        <main>{sections.map((section) => { const data = record(section.data); if (section.type === "hero") return <Hero key={section.id} content={content} data={data} layout={layout} edition={edition} />; if (section.type === "gallery") return <Story key={section.id} content={content} data={data} id={section.id} />; if (section.type === "celebration") return <Details key={section.id} content={content} data={data} id={section.id} locale={locale} />; if (section.type === "rsvp" && data.enabled !== false) return <Reply key={section.id} data={data} id={section.id} previewOnly={previewOnly} invitationSlug={invitationSlug} />; if (section.type === "footer") return <Footer key={section.id} data={data} />; return <GenericSection key={section.id} section={section} />; })}</main>
      </div>
    </div>
  );
}
