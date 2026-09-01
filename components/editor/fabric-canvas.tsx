"use client";

import { useEffect, useRef } from "react";
import { Canvas, Circle, FabricImage, Line, Rect, Textbox, type FabricObject } from "fabric";
import type { EditorColorScheme, EditorContent, EditorLayer } from "@/components/editor/types";

type CanvasObject = FabricObject & { layerId?: string };
type FabricEvent = { target?: FabricObject; selected?: FabricObject[] };

type FabricCanvasProps = {
  content: EditorContent;
  activeScheme?: EditorColorScheme;
  selectedLayerId?: string | null;
  onChange: (content: EditorContent) => void;
  onSelect: (layerId: string | null) => void;
};

function layerId(object: FabricObject | undefined) {
  return (object as CanvasObject | undefined)?.layerId ?? null;
}

function setLayerId(object: FabricObject, id: string) {
  (object as CanvasObject).layerId = id;
}

function setObjectState(object: FabricObject, layer: EditorLayer) {
  object.set({
    left: layer.position.x,
    top: layer.position.y,
    angle: layer.rotation ?? 0,
    opacity: layer.opacity ?? 1,
    visible: layer.visible !== false,
    selectable: layer.locked !== true,
    evented: layer.locked !== true,
  });
  setLayerId(object, layer.id);
}

async function addLayer(canvas: Canvas, layer: EditorLayer) {
  const content = layer.content;
  let object: FabricObject | null = null;

  if (layer.type === "text") {
    object = new Textbox(String(content.text ?? ""), {
      left: layer.position.x,
      top: layer.position.y,
      width: layer.size.width,
      fontSize: Number(content.font && typeof content.font === "object" ? (content.font as Record<string, unknown>).size ?? 24 : 24),
      fontFamily: String(content.font && typeof content.font === "object" ? (content.font as Record<string, unknown>).family ?? "Inter" : "Inter"),
      fontWeight: String(content.font && typeof content.font === "object" ? (content.font as Record<string, unknown>).weight ?? 400 : 400),
      lineHeight: Number(content.font && typeof content.font === "object" ? (content.font as Record<string, unknown>).lineHeight ?? 1.2 : 1.2),
      fill: String(content.color ?? "#111827"),
      textAlign: String(content.align ?? "left") as "left" | "center" | "right" | "justify",
      angle: layer.rotation ?? 0,
      opacity: layer.opacity ?? 1,
      editable: layer.locked !== true,
      selectable: layer.locked !== true,
      evented: layer.locked !== true,
    });
  } else if (layer.type === "shape") {
    const shape = String(content.shape ?? "rectangle");
    const fill = String(content.fill ?? "transparent");
    if (shape === "circle") {
      object = new Circle({
        left: layer.position.x,
        top: layer.position.y,
        radius: Math.min(layer.size.width, layer.size.height) / 2,
        fill,
        stroke: typeof content.stroke === "object" && content.stroke ? String((content.stroke as Record<string, unknown>).color ?? "") : undefined,
        strokeWidth: typeof content.stroke === "object" && content.stroke ? Number((content.stroke as Record<string, unknown>).width ?? 0) : 0,
      });
    } else if (shape === "line") {
      object = new Line([0, 0, layer.size.width, 0], {
        left: layer.position.x,
        top: layer.position.y,
        stroke: fill,
        strokeWidth: layer.size.height || 2,
      });
    } else {
      object = new Rect({
        left: layer.position.x,
        top: layer.position.y,
        width: layer.size.width,
        height: layer.size.height,
        fill,
        rx: Number(content.borderRadius ?? 0),
        ry: Number(content.borderRadius ?? 0),
        stroke: typeof content.stroke === "object" && content.stroke ? String((content.stroke as Record<string, unknown>).color ?? "") : undefined,
        strokeWidth: typeof content.stroke === "object" && content.stroke ? Number((content.stroke as Record<string, unknown>).width ?? 0) : 0,
      });
    }
  } else if (layer.type === "image") {
    const url = String(content.url ?? "");
    if (url) {
      try {
        object = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
        const image = object as FabricImage;
        const naturalWidth = image.width || layer.size.width;
        const naturalHeight = image.height || layer.size.height;
        image.set({
          left: layer.position.x,
          top: layer.position.y,
          scaleX: layer.size.width / naturalWidth,
          scaleY: layer.size.height / naturalHeight,
          angle: layer.rotation ?? 0,
          opacity: layer.opacity ?? 1,
          selectable: layer.locked !== true,
          evented: layer.locked !== true,
        });
      } catch (error) {
        console.warn(`Could not load image layer ${layer.id}`, error);
      }
    }
  }

  if (object) {
    setObjectState(object, layer);
    canvas.add(object);
  }
}

function snapshotCanvas(canvas: Canvas, source: EditorContent): EditorContent {
  const objects = new Map<string, FabricObject>();
  for (const object of canvas.getObjects()) {
    const id = layerId(object);
    if (id) {
      objects.set(id, object);
    }
  }

  return {
    ...source,
    layers: source.layers.map((layer) => {
      const object = objects.get(layer.id);
      if (!object) {
        return layer;
      }
      const scaleX = object.scaleX ?? 1;
      const scaleY = object.scaleY ?? 1;
      const nextContent = { ...layer.content };
      if (layer.type === "text" && "text" in object) {
        nextContent.text = String((object as FabricObject & { text?: string }).text ?? "");
      }
      if (layer.type === "shape" && "fill" in object) {
        nextContent.fill = String((object as FabricObject & { fill?: unknown }).fill ?? "transparent");
      }
      return {
        ...layer,
        position: { x: object.left ?? layer.position.x, y: object.top ?? layer.position.y },
        size: { width: (object.width ?? layer.size.width) * scaleX, height: (object.height ?? layer.size.height) * scaleY },
        rotation: object.angle ?? layer.rotation ?? 0,
        opacity: object.opacity ?? layer.opacity ?? 1,
        visible: object.visible !== false,
        content: nextContent,
      };
    }),
  };
}

export function FabricCanvas({ content, activeScheme, selectedLayerId, onChange, onSelect }: FabricCanvasProps) {
  const elementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const contentRef = useRef(content);
  const changeRef = useRef(onChange);
  const selectRef = useRef(onSelect);
  const loadingRef = useRef(true);
  contentRef.current = content;
  changeRef.current = onChange;
  selectRef.current = onSelect;

  const background = content.canvas.background;
  const backgroundStyle = background.type === "image" && background.url
    ? { backgroundImage: `url(${background.url})`, backgroundSize: background.fit === "contain" ? "contain" : "cover", backgroundPosition: "center" }
    : background.type === "gradient" || background.type === "color"
      ? { background: background.value ?? "#ffffff" }
      : { background: "#ffffff" };

  useEffect(() => {
    if (!elementRef.current) {
      return;
    }

    const canvas = new Canvas(elementRef.current, {
      width: contentRef.current.canvas.width,
      height: contentRef.current.canvas.height,
      selection: true,
      preserveObjectStacking: true,
      backgroundColor: "transparent",
    });
    canvasRef.current = canvas;
    let disposed = false;

    const emitChange = () => {
      if (!loadingRef.current && !disposed) {
        changeRef.current(snapshotCanvas(canvas, contentRef.current));
      }
    };
    const select = (event: FabricEvent) => selectRef.current(layerId(event.target ?? event.selected?.[0]));
    canvas.on("object:modified", emitChange);
    canvas.on("text:editing:exited", emitChange);
    canvas.on("selection:created", select);
    canvas.on("selection:updated", select);
    canvas.on("selection:cleared", () => selectRef.current(null));

    const load = async () => {
      for (const layer of contentRef.current.layers) {
        await addLayer(canvas, layer);
      }
      if (!disposed) {
        loadingRef.current = false;
        canvas.renderAll();
      }
    };
    void load();

    return () => {
      disposed = true;
      canvas.dispose();
      canvasRef.current = null;
    };
  }, []);

  const layerFlags = content.layers.map((layer) => `${layer.id}:${layer.visible !== false}:${layer.locked === true}`).join("|");
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    for (const object of canvas.getObjects()) {
      const id = layerId(object);
      const layer = id ? contentRef.current.layers.find((candidate) => candidate.id === id) : undefined;
      if (layer) {
        object.set({ visible: layer.visible !== false, selectable: layer.locked !== true, evented: layer.locked !== true });
      }
    }
    canvas.renderAll();
  }, [layerFlags]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeScheme) {
      return;
    }
    const textColor = activeScheme.colors.text;
    const accent = activeScheme.colors.primary;
    for (const object of canvas.getObjects()) {
      const id = layerId(object);
      const layer = id ? contentRef.current.layers.find((candidate) => candidate.id === id) : undefined;
      if (!layer) {
        continue;
      }
      if (layer.type === "text") {
        object.set({ fill: textColor });
      } else if (layer.type === "shape" && !String(layer.content.fill ?? "").startsWith("rgba")) {
        object.set({ fill: accent });
      }
    }
    canvas.renderAll();
  }, [activeScheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (!selectedLayerId) {
      canvas.discardActiveObject();
    } else {
      const object = canvas.getObjects().find((candidate) => layerId(candidate) === selectedLayerId);
      if (object && object.selectable) {
        canvas.setActiveObject(object);
      }
    }
    canvas.renderAll();
  }, [selectedLayerId]);

  return (
    <div className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-lg border border-border bg-secondary shadow-xl" style={{ aspectRatio: `${content.canvas.width} / ${content.canvas.height}` }}>
      <div className="absolute inset-0 overflow-hidden" style={backgroundStyle}>
        {background.type === "video" && background.url ? (
          <video className="absolute inset-0 h-full w-full object-cover" src={background.url} poster={background.poster} autoPlay={false} loop={background.loop} muted={background.muted !== false} playsInline aria-label="Invitation video background" />
        ) : null}
        {background.type === "html" && background.html ? <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: background.html }} /> : null}
        {background.type === "html" && background.css ? <style>{background.css}</style> : null}
        <canvas ref={elementRef} className="relative block h-full w-full" aria-label="Invitation editor canvas" />
      </div>
    </div>
  );
}
