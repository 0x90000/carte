"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileImage,
  Grid3x3,
  Heart,
  Infinity as InfinityIcon,
  Images,
  Layers,
  Loader2,
  Lock,
  LockOpen,
  MoreHorizontal,
  Palette,
  Redo2,
  Save,
  Send,
  Settings,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { FabricCanvas } from "@/components/editor/fabric-canvas";
import {
  cloneEditorContent,
  normalizeEditorContent,
  type EditorColorScheme,
  type EditorContent,
  type EditorGalleryItem,
  type EditorLayer,
} from "@/components/editor/types";
import { localePath } from "@/lib/i18n";

type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";
type EditorTab = "design" | "text" | "images" | "colors" | "ai";

type EditorShellProps = {
  invitationId: string;
  initialContent: EditorContent;
  initialTitle: string;
  initialUpdatedAt: string;
  isGuest: boolean;
  templateName?: string | null;
  scene: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  action?: string;
};

const LOCAL_STORAGE_PREFIX = "carte:editor:";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_GALLERY_PHOTOS = 9;
const MAX_GALLERY_IMAGE_BYTES = 1 * 1024 * 1024;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 160;
const FONT_FAMILY_OPTIONS = [
  { name: "Inter", value: "Inter" },
  { name: "Georgia", value: "Georgia" },
  { name: "Playfair Display", value: "Georgia" },
  { name: "Montserrat", value: "Arial" },
  { name: "Crimson Text", value: "Times New Roman" },
  { name: "Lora", value: "Georgia" },
];

function getTextFont(layer: EditorLayer) {
  return layer.content.font && typeof layer.content.font === "object"
    ? layer.content.font as Record<string, unknown>
    : {};
}

function clampFontSize(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return MIN_FONT_SIZE;
  }
  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, parsed));
}

function isRgba(value: unknown) {
  return typeof value === "string" && value.trim().startsWith("rgba");
}

function SaveIndicator({ state, labels }: { state: SaveState; labels: Record<SaveState, string> }) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        {labels.saving}
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-emerald-600">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        {labels.saved}
      </span>
    );
  }
  if (state === "unsaved") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-amber-600">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        {labels.unsaved}
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-destructive">
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        {labels.error}
      </span>
    );
  }
  return null;
}

export function EditorShell({
  invitationId,
  initialContent,
  initialTitle,
  initialUpdatedAt,
  isGuest,
  templateName,
  scene,
  eventDate,
  eventLocation,
  action,
}: EditorShellProps) {
  const locale = useLocale();
  const t = useTranslations("editor");
  const normalizedInitial = useMemo(() => normalizeEditorContent(initialContent), [initialContent]);
  const [content, setContent] = useState<EditorContent>(normalizedInitial);
  const [title, setTitle] = useState(initialTitle || templateName || t("untitled"));
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeSchemeId, setActiveSchemeId] = useState<string | undefined>(normalizedInitial.colorSchemes?.[0]?.id);
  const [activeTab, setActiveTab] = useState<EditorTab>("design");
  const [past, setPast] = useState<EditorContent[]>([]);
  const [future, setFuture] = useState<EditorContent[]>([]);
  const [canvasRevision, setCanvasRevision] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [checkoutType, setCheckoutType] = useState<"single_publish" | "lifetime" | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiVariations, setAiVariations] = useState<string[]>([]);
  const [aiSource, setAiSource] = useState<"openai" | "fallback" | "">("");
  const contentRef = useRef(content);
  const titleRef = useRef(title);
  const saveTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
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
  const selectedTextFont = selectedLayer?.type === "text" ? getTextFont(selectedLayer) : undefined;
  const selectedTextColor = selectedLayer?.type === "text" ? String(selectedLayer.content.color ?? "#111827") : "#111827";

  async function generateCopy() {
    setAiLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene,
          style: typeof content.style === "string" ? content.style : "modern",
          locale,
          eventInfo: {
            date: eventDate ?? undefined,
            location: eventLocation ?? undefined,
            description: selectedLayer?.type === "text" ? String(selectedLayer.content.text ?? "") : undefined,
          },
        }),
      });
      const payload = (await response.json()) as { data?: { variations?: string[]; source?: "openai" | "fallback" }; error?: string };
      if (!response.ok || !payload.data?.variations?.length) {
        throw new Error(t("errors.generate"));
      }
      setAiVariations(payload.data.variations);
      setAiSource(payload.data.source ?? "fallback");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : t("errors.generate"));
    } finally {
      setAiLoading(false);
    }
  }

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
      setError(t("errors.invalidImage"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t("errors.imageTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setError("");
        updateLayer(selectedLayerId, (layer) => ({ ...layer, content: { ...layer.content, url: reader.result } }));
      }
    };
    reader.onerror = () => setError(t("errors.readImage"));
    reader.readAsDataURL(file);
  }

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("read_image"));
      reader.onerror = () => reject(new Error("read_image"));
      reader.readAsDataURL(file);
    });
  }

  async function onGallerySelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) {
      return;
    }
    const currentGallery = contentRef.current.gallery ?? [];
    if (currentGallery.length + files.length > MAX_GALLERY_PHOTOS) {
      setError(t("errors.galleryLimit", { count: MAX_GALLERY_PHOTOS }));
      return;
    }
    const invalidType = files.find((file) => file.type !== "image/jpeg" && file.type !== "image/png");
    if (invalidType) {
      setError(t("errors.galleryInvalidImage"));
      return;
    }
    const oversized = files.find((file) => file.size > MAX_GALLERY_IMAGE_BYTES);
    if (oversized) {
      setError(t("errors.galleryImageTooLarge"));
      return;
    }

    try {
      const items: EditorGalleryItem[] = [];
      for (const file of files) {
        items.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          url: await readFileAsDataUrl(file),
          alt: file.name.replace(/\.[^.]+$/, "").slice(0, 120),
        });
      }
      const next = cloneEditorContent(contentRef.current);
      next.gallery = [...currentGallery, ...items];
      setError("");
      commitContent(next);
    } catch (galleryError) {
      console.error("Failed to read gallery images", galleryError);
      setError(t("errors.readImage"));
    }
  }

  function removeGalleryPhoto(photoId: string) {
    const next = cloneEditorContent(contentRef.current);
    next.gallery = (next.gallery ?? []).filter((photo) => photo.id !== photoId);
    commitContent(next);
  }

  const publishInvitation = useCallback(async () => {
    if (isGuest) {
      window.location.assign(`${localePath(locale, "/login")}?continue=${encodeURIComponent(localePath(locale, `/editor/${invitationId}?action=publish`))}`);
      return;
    }
    setIsPublishing(true);
    setError("");
    const saved = await saveNow();
    if (!saved) {
      setError(t("errors.saveLatest"));
      setIsPublishing(false);
      return;
    }
    try {
      const response = await fetch(`/api/invitations/${invitationId}/publish`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        data?: { published?: boolean; slug?: string };
        error?: { code?: string; message?: string };
      };
      if (response.status === 402 && payload.error?.code === "PAYMENT_REQUIRED") {
        setShowPaymentOptions(true);
        return;
      }
      if (response.status === 429 && payload.error?.code === "DAILY_LIMIT_REACHED") {
        throw new Error(t("errors.dailyLimit"));
      }
      if (!response.ok) {
        throw new Error(t("errors.startPublish"));
      }
      if (payload.data?.published) {
        window.location.assign(localePath(locale, `/dashboard/invitations/${invitationId}/share`));
      } else {
        setError(t("errors.publishIncomplete"));
      }
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : t("errors.startPublish"));
    } finally {
      setIsPublishing(false);
    }
  }, [invitationId, isGuest, locale, saveNow, t]);

  const startCheckout = useCallback(async (purchaseType: "single_publish" | "lifetime") => {
    setCheckoutType(purchaseType);
    setError("");
    try {
      const response = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseType, invitationId }),
      });
      const payload = (await response.json()) as {
        data?: { checkoutUrl?: string };
        error?: { code?: string; message?: string };
      };
      if (!response.ok || !payload.data?.checkoutUrl) {
        throw new Error(payload.error?.code === "CHECKOUT_NOT_CONFIGURED"
          ? t("errors.paymentIncomplete")
          : t("errors.startCheckout"));
      }
      window.location.assign(payload.data.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : t("errors.startCheckout"));
      setCheckoutType(null);
    }
  }, [invitationId, t]);

  useEffect(() => {
    if (!hydrated || action !== "publish" || autoPublishRef.current) {
      return;
    }
    autoPublishRef.current = true;
    void publishInvitation();
  }, [action, hydrated, publishInvitation]);

  const tabs: Array<{ id: EditorTab; icon: typeof Type; label: string }> = [
    { id: "design", icon: Grid3x3, label: t("layers") },
    { id: "text", icon: Type, label: t("inspector") },
    { id: "images", icon: Images, label: t("galleryTitle") },
    { id: "colors", icon: Palette, label: t("colorScheme") },
    { id: "ai", icon: Zap, label: t("aiTitle") },
  ];

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Compact modern header */}
      <header className="relative z-50 flex h-16 items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-lg px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Link
            href={localePath(locale, "/dashboard")}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            aria-label={t("backToTemplates")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="h-8 w-px bg-border" />

          <Input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              titleRef.current = event.target.value;
              setSaveState("unsaved");
            }}
            className="h-9 w-[200px] border-0 bg-transparent px-2 text-sm font-medium shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
            placeholder={t("untitled")}
          />

          <SaveIndicator
            state={saveState}
            labels={{
              idle: t("saveState.ready"),
              saving: t("saveState.saving"),
              saved: t("saveState.saved"),
              unsaved: t("saveState.unsaved"),
              error: t("saveState.error")
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={past.length === 0}
              className="h-7 w-7 rounded-md"
              aria-label={t("undo")}
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={future.length === 0}
              className="h-7 w-7 rounded-md"
              aria-label={t("redo")}
            >
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="h-9 gap-2"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? t("preview") : t("preview")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void saveNow()}
            disabled={saveState === "saving"}
            className="h-9 gap-2"
          >
            <Save className="h-4 w-4" />
            {t("save")}
          </Button>

          <Button
            size="sm"
            onClick={() => void publishInvitation()}
            disabled={isPublishing}
            className="h-9 gap-2 shadow-lg shadow-primary/20"
          >
            <Send className="h-4 w-4" />
            {isPublishing ? t("preparing") : t("publish")}
          </Button>
        </div>
      </header>

      {isGuest ? (
        <div className="border-b border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-2.5 text-center text-sm text-amber-900">
          {t("guestBanner")}
        </div>
      ) : null}

      {/* Modern 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tabs + Tools */}
        <aside className="flex w-80 flex-col border-r border-border bg-background">
          {/* Tab Navigation */}
          <div className="flex border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 flex-col items-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "design" && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    {t("layers")}
                  </h3>
                  <div className="space-y-1">
                    {[...content.layers].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0)).map((layer) => (
                      <button
                        key={layer.id}
                        onClick={() => setSelectedLayerId(layer.id)}
                        className={`group flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                          selectedLayerId === layer.id
                            ? "border-primary/40 bg-primary/5 shadow-sm"
                            : "border-transparent hover:border-border hover:bg-secondary/50"
                        }`}
                      >
                        <div className="flex-1 truncate font-medium">
                          {layer.name}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateLayer(layer.id, (current) => ({ ...current, visible: current.visible === false }));
                          }}
                        >
                          {layer.visible === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "text" && selectedLayer?.type === "text" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="layer-text" className="mb-2 text-sm font-semibold">
                    {selectedLayer.name}
                  </Label>
                  <Textarea
                    id="layer-text"
                    value={String(selectedLayer.content.text ?? "")}
                    onChange={(event) => updateLayer(selectedLayer.id, (layer) => ({ ...layer, content: { ...layer.content, text: event.target.value } }))}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("fontFamily")}
                  </Label>
                  <Select
                    value={String(selectedTextFont?.family ?? "Inter")}
                    onChange={(event) => updateLayer(selectedLayer.id, (layer) => ({
                      ...layer,
                      content: { ...layer.content, font: { ...getTextFont(layer), family: event.target.value } },
                    }))}
                    className="font-medium"
                  >
                    {FONT_FAMILY_OPTIONS.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="font-size" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("fontSize")}
                    </Label>
                    <Input
                      id="font-size"
                      type="number"
                      min={MIN_FONT_SIZE}
                      max={MAX_FONT_SIZE}
                      value={String(Number(selectedTextFont?.size ?? 24))}
                      onChange={(event) => updateLayer(selectedLayer.id, (layer) => ({
                        ...layer,
                        content: { ...layer.content, font: { ...getTextFont(layer), size: clampFontSize(event.target.value) } },
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-color" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("textColor")}
                    </Label>
                    <Input
                      id="text-color"
                      type="color"
                      value={/^#[0-9a-f]{6}$/i.test(selectedTextColor) ? selectedTextColor : "#111827"}
                      onChange={(event) => updateLayer(selectedLayer.id, (layer) => ({
                        ...layer,
                        content: { ...layer.content, color: event.target.value },
                      }))}
                      className="h-10 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "text" && !selectedLayer && (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                {t("selectLayerPrompt")}
              </div>
            )}

            {activeTab === "images" && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
                    <Images className="h-4 w-4" />
                    {t("galleryTitle")}
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {t("galleryDescription")}
                  </p>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    className="hidden"
                    onChange={(event) => void onGallerySelected(event)}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={(content.gallery ?? []).length >= MAX_GALLERY_PHOTOS}
                  >
                    <Upload className="h-4 w-4" />
                    {t("addGalleryPhotos")}
                  </Button>

                  {(content.gallery ?? []).length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {(content.gallery ?? []).map((photo, index) => (
                        <div
                          key={photo.id}
                          className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary"
                        >
                          <img
                            src={photo.url}
                            alt={photo.alt || `Photo ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute right-1 top-1 h-6 w-6 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                            onClick={() => removeGalleryPhoto(photo.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "colors" && (
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 text-sm font-semibold">{t("colorScheme")}</Label>
                  <Select
                    value={activeScheme?.id ?? ""}
                    onChange={(event) => applyScheme(event.target.value)}
                    disabled={!content.colorSchemes?.length}
                  >
                    {!content.colorSchemes?.length ? (
                      <option value="">{t("noColorSchemes")}</option>
                    ) : null}
                    {content.colorSchemes?.map((scheme) => (
                      <option key={scheme.id} value={scheme.id}>
                        {scheme.name}
                      </option>
                    ))}
                  </Select>

                  {activeScheme && (
                    <div className="mt-4 flex gap-2">
                      {[activeScheme.colors.primary, activeScheme.colors.secondary, activeScheme.colors.accent].map((color, i) => (
                        <div
                          key={i}
                          className="h-12 flex-1 rounded-lg border-2 border-border shadow-sm transition-transform hover:scale-105"
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-gradient-to-br from-accent/5 to-primary/5 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">{t("aiTitle")}</h3>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t("aiDescription")}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => void generateCopy()}
                    disabled={aiLoading || selectedLayer?.type !== "text"}
                  >
                    {aiLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {aiLoading ? t("generating") : t("generateCopy")}
                  </Button>
                </div>

                {aiVariations.length > 0 && (
                  <div className="space-y-2">
                    {aiVariations.map((variation, index) => (
                      <div
                        key={`${variation}-${index}`}
                        className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-all"
                      >
                        <p className="mb-2 text-sm leading-relaxed">{variation}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            if (selectedLayer?.type === "text")
                              updateLayer(selectedLayer.id, (layer) => ({
                                ...layer,
                                content: { ...layer.content, text: variation },
                              }));
                          }}
                        >
                          {t("useOption")}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Canvas Area */}
        <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-secondary/20 to-background p-8">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <FabricCanvas
              key={canvasRevision}
              content={content}
              activeScheme={activeScheme}
              selectedLayerId={selectedLayerId}
              onChange={commitContent}
              onSelect={setSelectedLayerId}
              labels={{
                videoBackground: t("videoBackground"),
                editorCanvas: t("editorCanvas"),
              }}
            />
          </div>
        </div>

        {/* Right Sidebar - Preview */}
        {showPreview && (
          <aside className="w-80 border-l border-border bg-background p-6 overflow-y-auto">
            <h3 className="mb-4 text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t("livePreview")}
            </h3>
            <div className="rounded-xl border border-border bg-gradient-to-br from-secondary/50 to-card p-3 shadow-lg">
              {/* Preview component would go here */}
              <div className="aspect-[9/16] rounded-lg bg-secondary" />
            </div>
          </aside>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentOptions} onClose={(open) => { if (!checkoutType) { setShowPaymentOptions(open); setError(""); } }}>
        <DialogContent className="max-w-3xl rounded-2xl p-8">
          <DialogHeader className="pr-12 mb-6">
            <DialogTitle className="text-2xl">{t("payment.title")}</DialogTitle>
            <DialogDescription className="text-base">{t("payment.description")}</DialogDescription>
          </DialogHeader>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-6 top-6 rounded-full"
            onClick={() => { setShowPaymentOptions(false); setError(""); }}
            disabled={Boolean(checkoutType)}
          >
            <X className="h-4 w-4" />
          </Button>
          {error ? (
            <p className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="flex min-h-64 flex-col rounded-2xl border-2 border-border bg-card p-6 hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent-foreground/10 border border-primary/20">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{t("payment.single.title")}</h3>
              <p className="mt-2 text-3xl font-semibold text-primary">{t("payment.single.price")}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("payment.single.description")}</p>
              <Button
                className="mt-auto w-full rounded-full shadow-lg"
                onClick={() => void startCheckout("single_publish")}
                disabled={Boolean(checkoutType)}
              >
                {checkoutType === "single_publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {checkoutType === "single_publish" ? t("payment.redirecting") : t("payment.single.action")}
              </Button>
            </section>
            <section className="flex min-h-64 flex-col rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-accent-foreground/5 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-foreground text-white">
                <InfinityIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{t("payment.lifetime.title")}</h3>
              <p className="mt-2 text-3xl font-semibold text-primary">{t("payment.lifetime.price")}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("payment.lifetime.description")}</p>
              <Button
                className="mt-auto w-full rounded-full shadow-lg"
                onClick={() => void startCheckout("lifetime")}
                disabled={Boolean(checkoutType)}
              >
                {checkoutType === "lifetime" ? <Loader2 className="h-4 w-4 animate-spin" /> : <InfinityIcon className="h-4 w-4" />}
                {checkoutType === "lifetime" ? t("payment.redirecting") : t("payment.lifetime.action")}
              </Button>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Toast */}
      {error && !showPaymentOptions ? (
        <div className="fixed bottom-6 left-1/2 z-30 flex w-[min(92vw,560px)] -translate-x-1/2 items-center justify-between gap-4 rounded-2xl border border-destructive/30 bg-card/95 backdrop-blur-lg px-5 py-4 text-sm text-destructive shadow-2xl" role="alert">
          <span className="flex-1">{error}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full" onClick={() => setError("")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </main>
  );
}
