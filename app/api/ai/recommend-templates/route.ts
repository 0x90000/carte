import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const sceneSchema = z.enum(["wedding", "birthday", "business", "baby", "other"]);
const bodySchema = z.object({
  description: z.string().trim().max(1000).optional().default(""),
  scene: sceneSchema.optional(),
  style: z.string().trim().max(50).optional(),
});

const keywordAliases: Record<string, string[]> = {
  minimal: ["minimal", "simple", "简约", "极简"],
  elegant: ["elegant", "formal", "优雅", "正式"],
  playful: ["playful", "fun", "colorful", "活泼", "有趣"],
  video: ["video", "cinematic", "视频", "电影"],
  professional: ["professional", "business", "conference", "商务", "会议"],
};

function extractKeywords(description: string) {
  const normalized = description.toLowerCase();
  return Object.entries(keywordAliases).filter(([, aliases]) => aliases.some((alias) => normalized.includes(alias.toLowerCase()))).map(([key]) => key);
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Template recommendation request is invalid." }, { status: 400 });
  }

  const { description, scene, style } = parsed.data;
  const keywords = extractKeywords(description);
  const templates = await prisma.template.findMany({
    where: { isActive: true, ...(scene ? { scene } : {}), ...(style ? { style: { contains: style, mode: "insensitive" } } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const ranked = templates.map((template) => {
    const matches = template.tags.filter((tag) => keywords.includes(tag.toLowerCase()));
    return { template, score: matches.length, matches };
  }).sort((a, b) => b.score - a.score || a.template.sortOrder - b.template.sortOrder).slice(0, 3);

  return NextResponse.json({
    success: true,
    data: {
      templateIds: ranked.map(({ template }) => template.id),
      reasons: ranked.map(({ template, matches }) => matches.length > 0 ? `${template.name} matches ${matches.join(", ")}.` : `${template.name} fits your selected scene.`),
    },
  });
}
