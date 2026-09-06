export type EditorBackground = {
  type?: string;
  value?: string;
  gradient?: string;
  url?: string;
  poster?: string;
  fit?: string;
  html?: string;
  css?: string;
  loop?: boolean;
  muted?: boolean;
};

export type EditorLayer = {
  id: string;
  type: "text" | "image" | "shape" | "svg" | "decoration" | string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  locked?: boolean;
  visible?: boolean;
  variable?: string;
  animation?: {
    type: string;
    duration: number;
    delay?: number;
    iterationCount?: string | number;
  };
  content: Record<string, unknown>;
};

export type EditorColorScheme = {
  id: string;
  name: string;
  colors: Record<string, string>;
};

export type EditorGalleryItem = {
  id: string;
  url: string;
  alt?: string;
};

export type EditorPageModel = "canvas" | "h5-long-scroll";

export type SceneSectionType =
  | "hero"
  | "story"
  | "gallery"
  | "celebration"
  | "venue"
  | "findUs"
  | "rsvp"
  | "footer"
  | "custom";

export type EditorSceneSection = {
  id: string;
  type: SceneSectionType | string;
  name: string;
  visible?: boolean;
  locked?: boolean;
  data: Record<string, unknown>;
};

export type EditorAsset = {
  id: string;
  kind: "image" | "audio" | "video" | string;
  url: string;
  name?: string;
  alt?: string;
  placeholder?: boolean;
};

export type EditorContent = {
  canvas: {
    width: number;
    height: number;
    background: EditorBackground;
  };
  layers: EditorLayer[];
  gallery?: EditorGalleryItem[];
  pageModel?: EditorPageModel;
  sections?: EditorSceneSection[];
  assets?: EditorAsset[];
  variables?: Array<Record<string, unknown>>;
  colorSchemes?: EditorColorScheme[];
  settings?: Record<string, unknown>;
  [key: string]: unknown;
};

export function cloneEditorContent(content: EditorContent): EditorContent {
  return JSON.parse(JSON.stringify(content)) as EditorContent;
}

export function normalizeEditorContent(value: unknown): EditorContent {
  const content = (value && typeof value === "object" ? value : {}) as Partial<EditorContent>;
  const canvas = content.canvas && typeof content.canvas === "object"
    ? content.canvas as Partial<EditorContent["canvas"]>
    : {};
  const layers = Array.isArray(content.layers) ? content.layers : [];
  const gallery = Array.isArray(content.gallery)
    ? content.gallery.filter((item): item is EditorGalleryItem => Boolean(
      item
      && typeof item === "object"
      && "id" in item
      && "url" in item
      && typeof item.id !== "object"
      && typeof item.url === "string"
      && item.url.length > 0,
    )).slice(0, 9).map((item) => ({
      id: String(item.id),
      url: item.url,
      ...(typeof item.alt === "string" && item.alt.trim() ? { alt: item.alt.trim().slice(0, 120) } : {}),
    }))
    : [];
  const sections = Array.isArray(content.sections)
    ? content.sections.filter((section): section is EditorSceneSection => Boolean(
      section
      && typeof section === "object"
      && "id" in section
      && "type" in section
      && typeof section.id !== "object"
      && typeof section.type === "string",
    )).map((section) => ({
      ...section,
      id: String(section.id),
      type: String(section.type),
      name: typeof section.name === "string" && section.name.trim() ? section.name.trim() : String(section.type),
      data: section.data && typeof section.data === "object" ? section.data : {},
    }))
    : undefined;
  const assets = Array.isArray(content.assets)
    ? content.assets.filter((asset): asset is EditorAsset => Boolean(
      asset
      && typeof asset === "object"
      && "id" in asset
      && "url" in asset
      && typeof asset.id !== "object"
      && typeof asset.url === "string"
      && (asset.url.length > 0 || asset.kind === "audio"),
    )).map((asset) => ({
      ...asset,
      id: String(asset.id),
      kind: typeof asset.kind === "string" ? asset.kind : "image",
      url: asset.url,
    }))
    : undefined;

  return {
    ...content,
    ...(sections ? { pageModel: content.pageModel === "canvas" ? "canvas" : "h5-long-scroll", sections } : {}),
    ...(assets ? { assets } : {}),
    canvas: {
      width: typeof canvas.width === "number" ? canvas.width : 750,
      height: typeof canvas.height === "number" ? canvas.height : 1334,
      background: canvas.background && typeof canvas.background === "object" ? canvas.background : { type: "color", value: "#ffffff" },
    },
    gallery,
    layers: layers.filter((layer): layer is EditorLayer => Boolean(layer && typeof layer === "object" && "id" in layer)).map((layer) => ({
      ...layer,
      id: String(layer.id),
      type: layer.type ?? "shape",
      name: layer.name ?? "Layer",
      position: layer.position ?? { x: 0, y: 0 },
      size: layer.size ?? { width: 100, height: 100 },
      content: layer.content ?? {},
    })),
  };
}

export function isSceneGraphContent(content: EditorContent) {
  return content.pageModel === "h5-long-scroll" && Array.isArray(content.sections);
}
