export type EditorBackground = {
  type?: string;
  value?: string;
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
  type: "text" | "image" | "shape" | "decoration" | string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  locked?: boolean;
  visible?: boolean;
  variable?: string;
  content: Record<string, unknown>;
};

export type EditorColorScheme = {
  id: string;
  name: string;
  colors: Record<string, string>;
};

export type EditorContent = {
  canvas: {
    width: number;
    height: number;
    background: EditorBackground;
  };
  layers: EditorLayer[];
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

  return {
    ...content,
    canvas: {
      width: typeof canvas.width === "number" ? canvas.width : 750,
      height: typeof canvas.height === "number" ? canvas.height : 1334,
      background: canvas.background && typeof canvas.background === "object" ? canvas.background : { type: "color", value: "#ffffff" },
    },
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
