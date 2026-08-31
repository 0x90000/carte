import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSessionId } from "@/lib/session";

const updateSchema = z.object({
  title: z.string().trim().max(200).optional().nullable(),
  content: z.any().optional(),
  templateId: z.string().trim().min(1).optional().nullable(),
  locale: z.string().trim().min(2).max(10).optional(),
  eventDate: z.string().trim().max(100).optional().nullable(),
  eventLocation: z.string().trim().max(500).optional().nullable(),
  settings: z.record(z.string(), z.any()).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

function parseEventDate(value: string | null | undefined) {
  if (value === null || value === "") {
    return null;
  }
  if (value === undefined) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

async function findInvitation(id: string, userId: string) {
  return prisma.invitation.findFirst({ where: { id, userId } });
}

async function findGuestDraft(id: string) {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return null;
  }

  return prisma.guestDraft.findFirst({
    where: { id, sessionId, expiresAt: { gt: new Date() } },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await auth();
    if (session?.user?.id) {
      const invitation = await findInvitation(id, session.user.id);
      if (!invitation) {
        return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: invitation, isGuest: false });
    }

    const draft = await findGuestDraft(id);
    if (!draft) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: draft, isGuest: true });
  } catch (error) {
    console.error("Failed to load invitation", error);
    return NextResponse.json({ error: "We could not load your invitation." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = updateSchema.parse(await request.json());
    const eventDate = parseEventDate(payload.eventDate);
    if (payload.eventDate !== undefined && eventDate === undefined) {
      return NextResponse.json({ error: "Enter a valid event date." }, { status: 400 });
    }

    const session = await auth();
    if (session?.user?.id) {
      const invitation = await findInvitation(id, session.user.id);
      if (!invitation) {
        return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
      }

      const updated = await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          ...(payload.title !== undefined ? { title: payload.title || "Untitled invitation" } : {}),
          ...(payload.content !== undefined ? { content: payload.content } : {}),
          ...(payload.templateId !== undefined ? { templateId: payload.templateId } : {}),
          ...(payload.locale !== undefined ? { locale: payload.locale } : {}),
          ...(payload.locale !== undefined ? { locale: payload.locale } : {}),
          ...(payload.eventDate !== undefined ? { eventDate } : {}),
          ...(payload.eventLocation !== undefined ? { eventLocation: payload.eventLocation } : {}),
          ...(payload.settings !== undefined ? { settings: payload.settings } : {}),
        },
      });
      return NextResponse.json({ success: true, data: updated, isGuest: false });
    }

    const draft = await findGuestDraft(id);
    if (!draft) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    }

    const updated = await prisma.guestDraft.update({
      where: { id: draft.id },
      data: {
          ...(payload.title !== undefined ? { title: payload.title } : {}),
          ...(payload.content !== undefined ? { content: payload.content } : {}),
          ...(payload.templateId !== undefined ? { templateId: payload.templateId } : {}),
          ...(payload.eventDate !== undefined ? { eventDate } : {}),
        ...(payload.eventLocation !== undefined ? { eventLocation: payload.eventLocation } : {}),
        ...(payload.settings !== undefined ? { settings: payload.settings } : {}),
      },
    });
    return NextResponse.json({ success: true, data: updated, isGuest: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invitation details are invalid." }, { status: 400 });
    }
    console.error("Failed to update invitation", error);
    return NextResponse.json({ error: "We could not save your invitation." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    const invitation = await findInvitation(id, session.user.id);
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    }
    await prisma.invitation.delete({ where: { id: invitation.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete invitation", error);
    return NextResponse.json({ error: "We could not delete your invitation." }, { status: 500 });
  }
}
