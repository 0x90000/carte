import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!z.string().trim().min(1).max(200).safeParse(id).success) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_TEMPLATE_ID", message: "Template id is invalid." } },
      { status: 400 },
    );
  }

  try {
    const template = await prisma.template.findFirst({
      where: { id, isActive: true },
    });
    if (!template) {
      return NextResponse.json(
        { success: false, error: { code: "TEMPLATE_NOT_FOUND", message: "Template not found." } },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, data: template },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Failed to load template", error);
    return NextResponse.json(
      { success: false, error: { code: "TEMPLATE_LOAD_FAILED", message: "We could not load this template." } },
      { status: 500 },
    );
  }
}
