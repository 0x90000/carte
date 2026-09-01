"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  FileImage,
  Layers3,
  Loader2,
  Lock,
  LockOpen,
  Redo2,
  Save,
  Send,
  Undo2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FabricCanvas } from "@/components/editor/fabric-canvas";
import {
  cloneEditorContent,
  normalizeEditorContent,
  type EditorColorScheme,
  type EditorContent,
  type EditorLayer,
} from "@/components/editor/types";

type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

type EditorShellProps = {
  invitationId: string;
  initialContent: EditorContent;
  initialTitle: string;
  initialUpdatedAt: string;
  isGuest: boolean;
  templateName?: string | null;
  action?: string;
};

const LOCAL_STORAGE_PREFIX = "carte:editor:";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function isRgba(value: unknown) {
  return typeof value === "string" && value.trim().startsWith("rgba");
}

function PreviewCanvas({ content }: { content: EditorContent }) {
  const { canvas, layers } = content;
  const background = canvas.background;
  const backgroundStyle: CSSProperties =
    background.type === "image" && background.url
      ? {
          backgroundImage: `url(${background.url})`,
          backgroundPosition: "center",
          backgroundSize: background.fit === "contain" ? "contain" : "cover",
        }
      : { background: background.value ?? "#ffffff" };

  return (
    <div className="w-full max-w-[300px] overflow-hidden rounded-lg border border-border bg-foreground p-2 shadow-lg">
      <div className="relative aspect-[750/1334] w-full overflow-hidden rounded-md" style={backgroundStyle}>
        {background.type === "video" && background.url ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={background.url}
            poster={background.poster}
            autoPlay={false}
            loop={background.loop}
            muted={background.muted !== false}
            playsInline
            aria-label="Invitation video preview"
          />
        ) : null}
        {background.type === "html" && background.html ? (
          <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: background.html }} />
        ) : null}
        {background.type === "html" && background.css ? <style>{background.css}</style> : null}
        <div className="absolute inset-0">
          {layers.map((layer) => {
            if (layer.visible === false) {
              return null;
            }
            const style: CSSProperties = {
              position: "absolute",
              left: `${(layer.position.x / canvas.width) * 100}%`,
              top: `${(layer.position.y / canvas.height) * 100}%`,
              width: `${(layer.size.width / canvas.width) * 100}%`,
              height: `${(layer.size.height / canvas.height) * 100}%`,
              transform: `rotate(${layer.rotation ?? 0}deg)`,
              transformOrigin: "center",
              opacity: layer.opacity ?? 1,
              zIndex: layer.zIndex ?? 0,
            };
            if (layer.type === "text") {
              const font = layer.content.font && typeof layer.content.font === "object" ? (layer.content.font as Record<string, unknown>) : {};
              return (
                <div
                  key={layer.id}
                  style={{
                    ...style,
                    color: String(layer.content.color ?? "#111827"),
                    fontFamily: String(font.family ?? "Inter"),
                    fontSize: `clamp(7px, ${(Number(font.size ?? 24) / canvas.width) * 100}cqw)`,
                    fontWeight: Number(font.weight ?? 400),
                    lineHeight: Number(font.lineHeight ?? 1.2),
                    textAlign: String(layer.content.align ?? "left") as CSSProperties["textAlign"],
                    whiteSpace: "pre-wrap",
                    overflow: "hidden",
                  }}
                >
                  {String(layer.content.text ?? "")}
                </div>
              );
            }
            if (layer.type === "image" && layer.content.url) {
              return <img key={layer.id} src={String(layer.content.url)} alt="" className="h-full w-full object-cover" style={style} />; // eslint-disable-line @next/next/no-img-element
            }
            if (layer.type === "shape") {
              const shape = String(layer.content.shape ?? "rectangle");
              return (
                <div
                  key={layer.id}
                  style={{
                    ...style,
                    background: String(layer.content.fill ?? "transparent"),
                    borderRadius: shape === "circle" ? "50%" : `${Number(layer.content.borderRadius ?? 0)}px`,
                    border: layer.content.stroke && typeof layer.content.stroke === "object"
                      ? `${Number((layer.content.stroke as Record<string, unknown>).width ?? 0)}px solid ${String((layer.content.stroke as Record<string, unknown>).color ?? "transparent")}`
                      : undefined,
                  }}
                />
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Saving</span>;
  }
  if (state === "saved") {
    return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Saved</span>;
  }
  if (state === "unsaved") {
    return <span className="text-xs text-muted-foreground">Unsaved changes</span>;
  }
  if (state === "error") {
    return <span className="text-xs text-destructive">Save failed</span>;
  }
  return <span className="text-xs text-muted-foreground">Ready</span>;
}

export function EditorShell({
  invitationId,
  initialContent,
  initialTitle,
  initialUpdatedAt,
  isGuest,
  templateName,
  action,
}: EditorShellProps) {
  const normalizedInitial = useMemo(() => normalizeEditorContent(initialContent), [initialContent]);
  const [content, setContent] = useState<EditorContent>(normalizedInitial);
  const [title, setTitle] = useState(initialTitle || templateName || "Untitled invitation");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeSchemeId, setActiveSchemeId] = useState<string | undefined>(normalizedInitial.colorSchemes?.[0]?.id);
  const [past, setPast] = useState<EditorContent[]>([]);
  const [future, setFuture] = useState<EditorContent[]>([]);
  const [canvasRevision, setCanvasRevision] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const contentRef = useRef(content);
  const titleRef = useRef(title);
  const saveTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const autoPublishRef = useRef(false);
  const storageKey = `${LOCAL_STORAGE_PREFIX}${invitationId}`;

  contentRef.current = content;
  titleRef.current = title;

  const commitContent = useCallback((nextValue: EditorContent, options: { history?: boolean; remount?: boolean } = {}) => {
    const next = normalizeEditorContent(nextValue);
    const previous = contentRef.current;
    if (JSON.stringify(previous) === JSON.stringify(next)) {
      return;
    }
    if (options.history !== false) {
      setPast((current) => [...current.slice(-49), cloneEditorContent(previous)]);
      setFuture([]);
    }
    contentRef.current = next;
    setContent(next);
    setSaveState("unsaved");
    if (options.remount) {
      setCanvasRevision((current) => current + 1);
    }
  }, []);

  const updateLayer = useCallback((layerId: string, update: (layer: EditorLayer) => EditorLayer) => {
    const next = cloneEditorContent(contentRef.current);
    const index = next.layers.findIndex((layer) => layer.id === layerId);
    if (index < 0) {
      return;
    }
    next.layers[index] = update(next.layers[index]);
    commitContent(next, { remount: true });
  }, [commitContent]);

  const saveNow = useCallback(async () => {
    if (saveInFlightRef.current) {
      return saveInFlightRef.current;
    }
    const request = (async () => {
      setSaveState("saving");
      try {
        const response = await fetch(`/api/invitations/${invitationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: titleRef.current, content: contentRef.current }),
        });
        if (!response.ok) {
          throw new Error("save_failed");
        }
        const updatedAt = new Date().toISOString();
        window.localStorage.setItem(storageKey, JSON.stringify({ content: contentRef.current, updatedAt }));
        setSaveState("saved");
        return true;
      } catch (saveError) {
        console.error("Failed to save invitation", saveError);
        setSaveState("error");
        return false;
      } finally {
        saveInFlightRef.current = null;
      }
    })();
    saveInFlightRef.current = request;
    return request;
  }, [invitationId, storageKey]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as { content?: unknown; updatedAt?: string };
        const localTimestamp = saved.updatedAt ? Date.parse(saved.updatedAt) : 0;
        const serverTimestamp = Date.parse(initialUpdatedAt) || 0;
        if (localTimestamp > serverTimestamp && saved.content) {
          const restored = normalizeEditorContent(saved.content);
          contentRef.current = restored;
          setContent(restored);
          setCanvasRevision((current) => current + 1);
          setSaveState("unsaved");
        }
      }
    } catch (loadError) {
      console.warn("Could not restore local editor draft", loadError);
    } finally {
      setHydrated(true);
    }
  }, [initialUpdatedAt, storageKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    window.localStorage.setItem(storageKey, JSON.stringify({ content, updatedAt: new Date().toISOString() }));
    saveTimerRef.current = window.setTimeout(() => {
      void saveNow();
    }, 800);
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [content, hydrated, saveNow, storageKey, title]);

  const activeScheme = useMemo<EditorColorScheme | undefined>(
    () => content.colorSchemes?.find((scheme) => scheme.id === activeSchemeId) ?? content.colorSchemes?.[0],
    [activeSchemeId, content.colorSchemes],
  );
  const selectedLayer = selectedLayerId ? content.layers.find((layer) => layer.id === selectedLayerId) : undefined;

  function undo() {
    const previous = past[past.length - 1];
    if (!previous) {
      return;
    }
    const current = cloneEditorContent(contentRef.current);
    setPast(past.slice(0, -1));
    setFuture([current, ...future]);
    contentRef.current = cloneEditorContent(previous);
    setContent(cloneEditorContent(previous));
    setSaveState("unsaved");
    setCanvasRevision((value) => value + 1);
  }

  function redo() {
    const next = future[0];
    if (!next) {
      return;
    }
    const current = cloneEditorContent(contentRef.current);
    setFuture(future.slice(1));
    setPast([...past, current]);
    contentRef.current = cloneEditorContent(next);
    setContent(cloneEditorContent(next));
    setSaveState("unsaved");
    setCanvasRevision((value) => value + 1);
  }

  function applyScheme(schemeId: string) {
    setActiveSchemeId(schemeId);
    const scheme = contentRef.current.colorSchemes?.find((candidate) => candidate.id === schemeId);
    if (!scheme) {
      return;
    }
    const next = cloneEditorContent(contentRef.current);
    next.layers = next.layers.map((layer) => {
      if (layer.type === "text" && scheme.colors.text) {
        return { ...layer, content: { ...layer.content, color: scheme.colors.text } };
      }
      if (layer.type === "shape" && !isRgba(layer.content.fill) && scheme.colors.primary) {
        return { ...layer, content: { ...layer.content, fill: scheme.colors.primary } };
      }
      return layer;
    });
    if ((next.canvas.background.type === "color" || next.canvas.background.type === "gradient") && scheme.colors.background) {
      next.canvas.background = { ...next.canvas.background, value: scheme.colors.background };
    }
    commitContent(next, { remount: true });
  }

  function onImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedLayerId) {
      return;
    }
    if (!(file.type === "image/jpeg" || file.type === "image/png")) {
      setError("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Images must be 5 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setError("");
        updateLayer(selectedLayerId, (layer) => ({ ...layer, content: { ...layer.content, url: reader.result } }));
      }
    };
    reader.onerror = () => setError("We could not read that image.");
    reader.readAsDataURL(file);
  }

  const publishInvitation = useCallback(async () => {
    if (isGuest) {
      window.location.assign(`/login?continue=${encodeURIComponent(`/editor/${invitationId}?action=publish`)}`);
      return;
    }
    setIsPublishing(true);
    setError("");
    const saved = await saveNow();
    if (!saved) {
      setError("Save your latest changes before publishing.");
      setIsPublishing(false);
      return;
    }
    try {
      const response = await fetch(`/api/invitations/${invitationId}/publish`, { method: "POST" });
      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "We could not start publishing.");
      }
      if (payload.checkoutUrl) {
        window.location.assign(payload.checkoutUrl);
      } else {
        setError("Payment setup is incomplete. Add Stripe settings before publishing.");
      }
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "We could not start publishing.");
    } finally {
      setIsPublishing(false);
    }
  }, [invitationId, isGuest, saveNow]);

  useEffect(() => {
    if (!hydrated || action !== "publish" || autoPublishRef.current) {
      return;
    }
    autoPublishRef.current = true;
    void publishInvitation();
  }, [action, hydrated, publishInvitation]);

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1600px] flex-wrap items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <Link href="/templates" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="Back to templates" title="Back to templates">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1 sm:max-w-[260px]">
            <Label htmlFor="invitation-title" className="sr-only">Invitation title</Label>
            <Input id="invitation-title" value={title} onChange={(event) => { setTitle(event.target.value); titleRef.current = event.target.value; setSaveState("unsaved"); }} className="h-10 bg-transparent font-medium shadow-none" />
          </div>
          <SaveIndicator state={saveState} />
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={undo} disabled={past.length === 0} aria-label="Undo" title="Undo"><Undo2 className="h-4 w-4" aria-hidden="true" /></Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0} aria-label="Redo" title="Redo"><Redo2 className="h-4 w-4" aria-hidden="true" /></Button>
            <Button variant="outline" size="sm" onClick={() => void saveNow()} disabled={saveState === "saving"}><Save className="h-4 w-4" aria-hidden="true" /> Save</Button>
            <Button variant={showPreview ? "secondary" : "outline"} size="sm" onClick={() => setShowPreview((value) => !value)}><Eye className="h-4 w-4" aria-hidden="true" /> Preview</Button>
            <Button size="sm" onClick={() => void publishInvitation()} disabled={isPublishing}><Send className="h-4 w-4" aria-hidden="true" /> {isPublishing ? "Preparing" : "Publish"}</Button>
          </div>
        </div>
      </header>

      {isGuest ? <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">Not logged in. Your draft will be saved for 7 days.</div> : null}

      <div className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[240px_minmax(0,1fr)_300px]">
        <aside className="rounded-lg border border-border bg-card p-4 shadow-sm" aria-label="Layers">
          <div className="mb-4 flex items-center gap-2"><Layers3 className="h-4 w-4" aria-hidden="true" /><h2 className="text-sm font-semibold">Layers</h2></div>
          <div className="space-y-1">
            {[...content.layers].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0)).map((layer) => (
              <div key={layer.id} className={`flex items-center gap-1 rounded-md border px-2 py-1.5 ${selectedLayerId === layer.id ? "border-ring bg-secondary" : "border-transparent"}`}>
                <button type="button" className="min-w-0 flex-1 truncate text-left text-sm" onClick={() => setSelectedLayerId(layer.id)} aria-label={`Select ${layer.name}`}>
                  <span className={layer.visible === false ? "text-muted-foreground line-through" : "text-foreground"}>{layer.name}</span>
                </button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => updateLayer(layer.id, (current) => ({ ...current, visible: current.visible === false }))} aria-label={layer.visible === false ? `Show ${layer.name}` : `Hide ${layer.name}`} title={layer.visible === false ? "Show layer" : "Hide layer"}>
                  {layer.visible === false ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => updateLayer(layer.id, (current) => ({ ...current, locked: current.locked !== true }))} aria-label={layer.locked ? `Unlock ${layer.name}` : `Lock ${layer.name}`} title={layer.locked ? "Unlock layer" : "Lock layer"}>
                  {layer.locked ? <Lock className="h-3.5 w-3.5" aria-hidden="true" /> : <LockOpen className="h-3.5 w-3.5" aria-hidden="true" />}
                </Button>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[620px] items-start justify-center rounded-lg border border-border bg-background p-4 shadow-sm sm:p-8" aria-label="Invitation canvas">
          <FabricCanvas key={canvasRevision} content={content} activeScheme={activeScheme} selectedLayerId={selectedLayerId} onChange={commitContent} onSelect={setSelectedLayerId} />
        </section>

        <aside className="space-y-5" aria-label="Editor inspector">
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold">Inspector</h2>
            {selectedLayer?.type === "text" ? (
              <div className="space-y-2">
                <Label htmlFor="layer-text">{selectedLayer.name}</Label>
                <Textarea id="layer-text" value={String(selectedLayer.content.text ?? "")} onChange={(event) => updateLayer(selectedLayer.id, (layer) => ({ ...layer, content: { ...layer.content, text: event.target.value } }))} rows={5} />
              </div>
            ) : null}
            {selectedLayer?.type === "image" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Replace {selectedLayer.name} with a JPG or PNG up to 5 MB.</p>
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={onImageSelected} />
                <Button variant="outline" className="w-full" onClick={() => imageInputRef.current?.click()}><Upload className="h-4 w-4" aria-hidden="true" /> Upload image</Button>
                {selectedLayer.content.url ? <div className="flex items-center gap-2 text-xs text-muted-foreground"><FileImage className="h-4 w-4" aria-hidden="true" /> Image loaded</div> : null}
              </div>
            ) : null}
            {!selectedLayer ? <p className="text-sm leading-6 text-muted-foreground">Select a layer to edit its content.</p> : null}
            {selectedLayer && selectedLayer.type !== "text" && selectedLayer.type !== "image" ? <p className="text-sm leading-6 text-muted-foreground">This layer can be moved, resized, and rotated directly on the canvas.</p> : null}
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <Label htmlFor="color-scheme">Color scheme</Label>
            <Select id="color-scheme" className="mt-2" value={activeScheme?.id ?? ""} onChange={(event) => applyScheme(event.target.value)} disabled={!content.colorSchemes?.length}>
              {!content.colorSchemes?.length ? <option value="">No color schemes</option> : null}
              {content.colorSchemes?.map((scheme) => <option key={scheme.id} value={scheme.id}>{scheme.name}</option>)}
            </Select>
            {activeScheme ? <div className="mt-3 flex gap-2" aria-label="Selected color scheme"><span className="h-6 w-6 rounded-full border border-border" style={{ background: activeScheme.colors.primary }} /><span className="h-6 w-6 rounded-full border border-border" style={{ background: activeScheme.colors.secondary }} /><span className="h-6 w-6 rounded-full border border-border" style={{ background: activeScheme.colors.accent }} /></div> : null}
          </section>

          {showPreview ? <section className="space-y-3"><div className="flex items-center gap-2"><Eye className="h-4 w-4" aria-hidden="true" /><h2 className="text-sm font-semibold">Live preview</h2></div><PreviewCanvas content={content} /></section> : null}
        </aside>
      </div>

      {error ? <div className="fixed bottom-4 left-1/2 z-30 flex w-[min(92vw,520px)] -translate-x-1/2 items-center justify-between gap-4 rounded-md border border-destructive/30 bg-background px-4 py-3 text-sm text-destructive shadow-lg" role="alert"><span>{error}</span><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setError("")} aria-label="Dismiss error" title="Dismiss"><span aria-hidden="true">×</span></Button></div> : null}
    </main>
  );
}
