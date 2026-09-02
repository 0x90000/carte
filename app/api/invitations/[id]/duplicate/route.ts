import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateInvitationSlug } from "@/lib/invitation";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Please sign in first." } }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const source = await prisma.invitation.findFirst({
      where: { id, userId: session.user.id },
      select: { title: true, scene: true, locale: true, content: true, templateId: true, eventDate: true, eventLocation: true, settings: true },
    });
    if (!source) {
      return NextResponse.json({ success: false, error: { code: "INVITATION_NOT_FOUND", message: "Invitation not found." } }, { status: 404 });
    }

    const duplicate = await prisma.invitation.create({
      data: {
        userId: session.user.id,
        slug: generateInvitationSlug(),
        scene: source.scene,
        title: `${source.title} (copy)`.slice(0, 200),
        locale: source.locale,
        content: source.content ?? {},
        templateId: source.templateId,
        eventDate: source.eventDate,
        eventLocation: source.eventLocation,
        settings: source.settings ?? {},
        status: "draft",
      },
    });
    return NextResponse.json({ success: true, data: duplicate }, { status: 201 });
  } catch (error) {
    console.error("Failed to duplicate invitation", error);
    return NextResponse.json({ success: false, error: { code: "INVITATION_DUPLICATE_FAILED", message: "We could not duplicate the invitation." } }, { status: 500 });
  }
}
