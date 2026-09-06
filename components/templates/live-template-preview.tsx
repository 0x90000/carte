"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { SceneGraphInvitation } from "@/components/invitation/scene-graph-invitation";
import { normalizeEditorContent, type EditorContent } from "@/components/editor/types";

type PreviewMode = "scroll" | "fit";

function LegacyTemplatePreview({ content, alt }: { content: EditorContent; alt: string }) {
  const { canvas, layers } = content;
  const background = canvas.background;
  const backgroundStyle: CSSProperties = background.type === "image" && background.url
    ? { backgroundImage: `url(${background.url})`, backgroundPosition: "center", backgroundSize: background.fit === "contain" ? "contain" : background.fit === "fill" ? "100% 100%" : "cover" }
    : background.gradient ? { background: background.gradient } : { background: background.value ?? "#ffffff" };
  return <div className="relative h-full w-full overflow-hidden" style={{ ...backgroundStyle, aspectRatio: `${canvas.width} / ${canvas.height}`, containerType: "inline-size" }} aria-label={alt}>
    {layers.filter((layer) => layer.visible !== false).map((layer) => {
      const style: CSSProperties = { position: "absolute", left: `${(layer.position.x / canvas.width) * 100}%`, top: `${(layer.position.y / canvas.height) * 100}%`, width: `${(layer.size.width / canvas.width) * 100}%`, height: `${(layer.size.height / canvas.height) * 100}%`, transform: `rotate(${layer.rotation ?? 0}deg)`, opacity: layer.opacity ?? 1, zIndex: layer.zIndex ?? 0 };
      if (layer.type === "text") { const font = layer.content.font && typeof layer.content.font === "object" ? layer.content.font as Record<string, unknown> : {}; return <div key={layer.id} style={{ ...style, color: String(layer.content.color ?? "#111827"), fontFamily: String(font.family ?? "Inter"), fontSize: `calc(${(Number(font.size ?? 24) / canvas.width) * 100}cqw)`, fontWeight: Number(font.weight ?? 400), lineHeight: Number(font.lineHeight ?? 1.2), textAlign: String(layer.content.align ?? "left") as CSSProperties["textAlign"], whiteSpace: "pre-wrap", overflow: "hidden" }}>{String(layer.content.text ?? "")}</div>; }
      if (layer.type === "image" && layer.content.url) return <img key={layer.id} src={String(layer.content.url)} alt={layer.name} style={{ ...style, objectFit: String(layer.content.fit ?? "cover") as CSSProperties["objectFit"] }} />; // eslint-disable-line @next/next/no-img-element
      if (layer.type === "shape") return <div key={layer.id} style={{ ...style, background: String(layer.content.fill ?? "transparent"), borderRadius: String(layer.content.shape) === "circle" ? "50%" : `${Number(layer.content.borderRadius ?? 0)}px` }} />;
      return null;
    })}
  </div>;
}

function FitScenePreview({ content, locale, alt }: { content: EditorContent; locale: string; alt: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const viewport = viewportRef.current;
    const preview = contentRef.current;
    if (!viewport || !preview) return;

    const updateScale = () => {
      const availableWidth = viewport.clientWidth;
      const availableHeight = viewport.clientHeight;
      const contentWidth = preview.scrollWidth;
      const contentHeight = preview.scrollHeight;
      if (!availableWidth || !availableHeight || !contentWidth || !contentHeight) return;
      setScale(Math.max(0.01, Math.min(1, availableWidth / contentWidth, availableHeight / contentHeight)));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    observer.observe(preview);
    const frame = window.requestAnimationFrame(updateScale);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [content]);

  return (
    <div ref={viewportRef} className="live-template-preview live-template-preview-fit" aria-label={alt}>
      <div ref={contentRef} className="live-template-preview-content" style={{ transform: `translateX(-50%) scale(${scale})` }}>
        <SceneGraphInvitation content={content} locale={locale} previewOnly />
      </div>
    </div>
  );
}

export function LiveTemplatePreview({ structure, alt, locale = "en", mode = "scroll" }: { structure: unknown; alt: string; locale?: string; mode?: PreviewMode }) {
  const content = normalizeEditorContent(structure);
  if (content.pageModel === "h5-long-scroll" && content.sections?.length) {
    if (mode === "fit") {
      return <FitScenePreview content={content} locale={locale} alt={alt} />;
    }
    return <div className="h-full w-full overflow-auto"><SceneGraphInvitation content={content} locale={locale} previewOnly /></div>;
  }
  return <LegacyTemplatePreview content={content} alt={alt} />;
}
