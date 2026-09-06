"use client";

import type { CSSProperties } from "react";
import { SceneGraphInvitation } from "@/components/invitation/scene-graph-invitation";
import { normalizeEditorContent, type EditorContent } from "@/components/editor/types";

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

export function LiveTemplatePreview({ structure, alt }: { structure: unknown; alt: string }) {
  const content = normalizeEditorContent(structure);
  if (content.pageModel === "h5-long-scroll" && content.sections?.length) {
    return <div className="h-full w-full overflow-auto"><SceneGraphInvitation content={content} previewOnly /></div>;
  }
  return <LegacyTemplatePreview content={content} alt={alt} />;
}
