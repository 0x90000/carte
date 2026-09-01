import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getFallbackCopy } from "@/lib/ai-fallback";
import { generateInvitationCopy } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

const namesSchema = z.union([
  z.string().trim().max(500),
  z.array(z.string().trim().max(100)).max(10),
]).transform((value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value.split(/\s*(?:&|和|,|，)\s*/).map((name) => name.trim()).filter(Boolean).slice(0, 10);
});

const bodySchema = z.object({
  scene: z.string().trim().min(1).max(50).default("other"),
  style: z.string().trim().max(50).default("modern"),
  locale: z.string().trim().min(2).max(10).default("en"),
  eventInfo: z.object({
    names: namesSchema.optional(),
    date: z.string().trim().max(100).optional(),
    location: z.string().trim().max(300).optional(),
    description: z.string().trim().max(1000).optional(),
  }).default({}),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "AI copy request is invalid." }, { status: 400 });
  }

  const { scene, style, locale, eventInfo } = parsed.data;
  const fallback = getFallbackCopy(scene, locale, eventInfo.date);
  let variations = fallback;
  let source: "openai" | "fallback" = "fallback";
  let tokensUsed: number | null = null;
  let model: string | null = null;

  try {
    const generated = await generateInvitationCopy({ scene, style, locale, eventInfo });
    if (generated.variations && generated.variations.length >= 3) {
      variations = generated.variations;
      source = "openai";
      tokensUsed = generated.tokensUsed;
      model = generated.model;
    }
  } catch (error) {
    console.warn("AI copy generation failed; using fallback", error);
  }

  const session = await auth();
  if (session?.user?.id) {
    try {
      await prisma.aIGeneration.create({
        data: {
          userId: session.user.id,
          prompt: JSON.stringify({ scene, style, locale, eventInfo }),
          response: { variations, source },
          model: model ?? "fallback",
          tokensUsed,
        },
      });
    } catch (error) {
      console.warn("Could not record AI generation", error);
    }
  }

  return NextResponse.json({ success: true, data: { variations, source, model, tokensUsed } });
}
