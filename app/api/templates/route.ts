import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const scenes = ["wedding", "birthday", "business", "baby", "other"] as const;
const querySchema = z.object({
  scene: z.enum(scenes).optional(),
  style: z.string().trim().max(50).optional(),
  tags: z.string().trim().max(300).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const listSelect = {
  id: true,
  name: true,
  scene: true,
  style: true,
  description: true,
  tags: true,
  thumbnailUrl: true,
  previewUrl: true,
  isPremium: true,
  sortOrder: true,
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawQuery = Object.fromEntries(url.searchParams.entries());
  const parsed = querySchema.safeParse(rawQuery);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_QUERY", message: "Template filters are invalid." } },
      { status: 400 },
    );
  }

  const { scene, style, tags: rawTags, page, limit } = parsed.data;
  const tags = rawTags
    ? rawTags.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean)
    : [];
  const where = {
    isActive: true,
    ...(scene ? { scene } : {}),
    ...(style ? { style: { contains: style, mode: "insensitive" as const } } : {}),
    ...(tags.length > 0 ? { tags: { hasSome: tags } } : {}),
  };

  try {
    const [total, templates] = await prisma.$transaction([
      prisma.template.count({ where }),
      prisma.template.findMany({
        where,
        select: listSelect,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: templates,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Failed to list templates", error);
    return NextResponse.json(
      { success: false, error: { code: "TEMPLATE_LIST_FAILED", message: "We could not load templates." } },
      { status: 500 },
    );
  }
}
