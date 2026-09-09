import type { Prisma, Template } from "@prisma/client";
import type { EditorSchema } from "@/components/editor/types";
import { prisma } from "@/lib/prisma";

export const templateScenes = ["wedding", "birthday", "business", "baby", "other"] as const;
export type TemplateScene = (typeof templateScenes)[number];

export type TemplateStructure = {
  pageModel?: "canvas" | "h5-long-scroll";
  canvas?: {
    width?: number;
    height?: number;
    background?: { type?: string; url?: string; poster?: string; fit?: string };
  };
  layers?: Array<{ type?: string; name?: string; content?: Record<string, unknown> }>;
  sections?: Array<{ id?: string; type?: string; name?: string; visible?: boolean; locked?: boolean; data?: Record<string, unknown> }>;
  assets?: Array<{ id?: string; kind?: string; url?: string; name?: string; alt?: string }>;
  variables?: Array<{ key?: string; type?: string; label?: string; defaultValue?: unknown }>;
  colorSchemes?: Array<{ id?: string; name?: string; colors?: Record<string, string> }>;
  editorSchema?: EditorSchema;
  settings?: Record<string, unknown>;
  music?: Record<string, unknown>;
};

export type TemplateListItem = Pick<
  Template,
  "id" | "name" | "scene" | "style" | "description" | "tags" | "thumbnailUrl" | "previewUrl" | "isPremium" | "sortOrder"
>;

export function getTemplateStructure(template: { structure: unknown }) {
  return template.structure as TemplateStructure;
}

export function templateBackgroundType(template: { structure: unknown }) {
  return getTemplateStructure(template).canvas?.background?.type ?? "color";
}

export async function getTemplateList(filters: {
  scene?: TemplateScene;
  style?: string;
  tags?: string[];
}) {
  const where: Prisma.TemplateWhereInput = {
    isActive: true,
    ...(filters.scene ? { scene: filters.scene } : {}),
    ...(filters.style ? { style: { contains: filters.style, mode: "insensitive" } } : {}),
    ...(filters.tags && filters.tags.length > 0 ? { tags: { hasSome: filters.tags } } : {}),
  };

  return prisma.template.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}
