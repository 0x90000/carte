import type { CSSProperties } from "react";
import type { Invitation, Template } from "@prisma/client";
import { getLocale, getTranslations } from "next-intl/server";
import { normalizeEditorContent, type EditorBackground, type EditorContent, type EditorLayer } from "@/components/editor/types";
import { RSVPSection } from "@/components/invitation/rsvp-section";

type PublicInvitationData = Pick<Invitation, "id" | "title" | "content" | "eventDate" | "eventLocation" | "slug" | "locale" | "settings"> & {
  template: Pick<Template, "previewUrl" | "name"> | null;
};

function backgroundStyle(background: EditorBackground): CSSProperties {
  if (background.type === "image" && background.url) {
    return {
      backgroundImage: `url(${background.url})`,
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: background.fit === "contain" ? "contain" : background.fit === "fill" ? "100% 100%" : "cover",
    };
  }
  return { background: background.value ?? "#ffffff" };
}

function layerStyle(layer: EditorLayer, canvas: EditorContent["canvas"]): CSSProperties {
  return {
    position: "absolute",
    left: `${(layer.position.x / canvas.width) * 100}%`,
    top: `${(layer.position.y / canvas.height) * 100}%`,
    width: `${(layer.size.width / canvas.width) * 100}%`,
    height: `${(layer.size.height / canvas.height) * 100}%`,
    transform: `rotate(${layer.rotation ?? 0}deg)`,
    transformOrigin: "center",
    opacity: layer.opacity ?? 1,
    zIndex: layer.zIndex ?? 0,
    display: layer.visible === false ? "none" : "block",
  };
}

function TextLayer({ layer, canvas }: { layer: EditorLayer; canvas: EditorContent["canvas"] }) {
  const font = layer.content.font && typeof layer.content.font === "object" ? (layer.content.font as Record<string, unknown>) : {};
  return (
    <div
      style={{
        ...layerStyle(layer, canvas),
        color: String(layer.content.color ?? "#111827"),
        fontFamily: String(font.family ?? "Inter, sans-serif"),
        fontSize: `calc(${(Number(font.size ?? 24) / canvas.width) * 100}cqw)`,
        fontWeight: Number(font.weight ?? 400),
        lineHeight: Number(font.lineHeight ?? 1.2),
        letterSpacing: typeof font.letterSpacing === "number" ? font.letterSpacing : undefined,
        textAlign: String(layer.content.align ?? "left") as CSSProperties["textAlign"],
        whiteSpace: "pre-wrap",
        overflow: "hidden",
      }}
    >
      {String(layer.content.text ?? "")}
    </div>
  );
}

function ShapeLayer({ layer, canvas }: { layer: EditorLayer; canvas: EditorContent["canvas"] }) {
  const shape = String(layer.content.shape ?? "rectangle");
  const stroke = layer.content.stroke && typeof layer.content.stroke === "object" ? layer.content.stroke as Record<string, unknown> : null;
  return (
    <div
      style={{
        ...layerStyle(layer, canvas),
        background: String(layer.content.fill ?? "transparent"),
        borderRadius: shape === "circle" ? "50%" : Number(layer.content.borderRadius ?? 0),
        border: stroke ? `${Number(stroke.width ?? 0)}px solid ${String(stroke.color ?? "transparent")}` : undefined,
      }}
    />
  );
}

function InvitationLayer({ layer, canvas }: { layer: EditorLayer; canvas: EditorContent["canvas"] }) {
  if (layer.type === "text") {
    return <TextLayer layer={layer} canvas={canvas} />;
  }
  if (layer.type === "image" && layer.content.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={String(layer.content.url)}
        alt={layer.name}
        style={{ ...layerStyle(layer, canvas), objectFit: String(layer.content.fit ?? "cover") as CSSProperties["objectFit"] }}
      />
    );
  }
  if (layer.type === "shape") {
    return <ShapeLayer layer={layer} canvas={canvas} />;
  }
  return null;
}

export async function InvitationRenderer({ invitation }: { invitation: PublicInvitationData }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("invitation")]);
  const content = normalizeEditorContent(invitation.content) as EditorContent;
  const { canvas, layers, gallery } = content;
  const background = canvas.background;
  const eventDate = invitation.eventDate ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(invitation.eventDate) : undefined;
  const invitationSettings = invitation.settings && typeof invitation.settings === "object" ? invitation.settings as Record<string, unknown> : {};
  const contentSettings = content.settings && typeof content.settings === "object" ? content.settings as Record<string, unknown> : {};
  const rsvpEnabled = invitationSettings.rsvpEnabled === true || contentSettings.rsvpEnabled === true;

  return (
    <main className="min-h-screen bg-neutral-950 px-3 py-6 sm:px-6 sm:py-10">
      <article className="mx-auto w-full max-w-[750px] overflow-hidden bg-white shadow-2xl" style={{ aspectRatio: `${canvas.width} / ${canvas.height}`, containerType: "inline-size" }}>
        <div className="relative h-full w-full overflow-hidden" style={backgroundStyle(background)}>
          {background.type === "video" && background.url ? (
            <video className="absolute inset-0 h-full w-full object-cover" src={background.url} poster={background.poster} autoPlay loop={background.loop !== false} muted={background.muted !== false} playsInline aria-label={t("videoBackground")} />
          ) : null}
          {background.type === "html" && background.html ? <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: background.html }} /> : null}
          {background.type === "html" && background.css ? <style>{background.css}</style> : null}
          <div className="absolute inset-0">
            {layers.map((layer) => <InvitationLayer key={layer.id} layer={layer} canvas={canvas} />)}
          </div>
        </div>
      </article>
      <section className="mx-auto max-w-[750px] space-y-2 px-2 py-7 text-center text-white">
        <p className="text-xs uppercase tracking-[0.18em] text-white/55">{t("youAreInvited")}</p>
        <h1 className="text-2xl font-semibold">{invitation.title}</h1>
        {eventDate || invitation.eventLocation ? <p className="text-sm text-white/70">{[eventDate, invitation.eventLocation].filter(Boolean).join(" · ")}</p> : null}
        <p className="pt-3 text-xs text-white/40">{t("invitationBy")}</p>
      </section>
      {gallery && gallery.length > 0 ? (
        <section className="mx-auto max-w-[750px] px-2 pb-8" aria-labelledby="invitation-gallery-title">
          <h2 id="invitation-gallery-title" className="mb-4 text-center text-lg font-semibold text-white">{t("galleryTitle")}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {gallery.map((photo, index) => (
              <figure key={photo.id} className="aspect-square overflow-hidden rounded-md bg-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.alt || t("galleryPhotoAlt", { index: index + 1 })} className="h-full w-full object-cover" loading={index < 3 ? "eager" : "lazy"} />
              </figure>
            ))}
          </div>
        </section>
      ) : null}
      {rsvpEnabled ? <RSVPSection invitationSlug={invitation.slug} /> : null}
    </main>
  );
}
