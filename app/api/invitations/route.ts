import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { generateInvitationSlug } from "@/lib/invitation";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionId, getSessionId } from "@/lib/session";

const sceneSchema = z.enum(["wedding", "birthday", "business", "baby", "other"]);
const invitationSchema = z.object({
  scene: sceneSchema,
  title: z.string().trim().max(200).optional().nullable(),
  content: z.any().optional(),
  templateId: z.string().trim().min(1).optional().nullable(),
  locale: z.string().trim().min(2).max(10).default("en"),
  eventDate: z.string().trim().max(100).optional().nullable(),
  eventLocation: z.string().trim().max(500).optional().nullable(),
  settings: z.record(z.string(), z.any()).optional(),
});

function parseEventDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

function guestDraftTtlDays() {
  const configured = Number(process.env.GUEST_DRAFT_TTL_DAYS ?? 7);
  return Number.isFinite(configured) && configured > 0 ? configured : 7;
}

export async function POST(request: Request) {
  try {
    const payload = invitationSchema.parse(await request.json());
    const eventDate = parseEventDate(payload.eventDate);
    if (payload.eventDate && !eventDate) {
      return NextResponse.json({ error: "Enter a valid event date." }, { status: 400 });
    }

    const session = await auth();
    const title = payload.title || "Untitled invitation";
    const content = payload.content ?? {};
    const settings = payload.settings ?? {};

    if (session?.user?.id) {
      const invitation = await prisma.invitation.create({
        data: {
          userId: session.user.id,
          scene: payload.scene,
          title,
          content,
          templateId: payload.templateId ?? undefined,
          locale: payload.locale,
          eventDate,
          eventLocation: payload.eventLocation ?? null,
          settings,
          slug: generateInvitationSlug(),
          status: "draft",
        },
      });

      return NextResponse.json({ success: true, data: invitation, isGuest: false }, { status: 201 });
    }

    const sessionId = await getOrCreateSessionId();
    const expiresAt = new Date(Date.now() + guestDraftTtlDays() * 24 * 60 * 60 * 1000);
    const draft = await prisma.guestDraft.create({
      data: {
        sessionId,
        scene: payload.scene,
        title: payload.title ?? null,
        content,
        templateId: payload.templateId ?? undefined,
        eventDate,
        eventLocation: payload.eventLocation ?? null,
        settings,
        expiresAt,
      },
    });

    return NextResponse.json(
      { success: true, data: draft, isGuest: true, expiresIn: `${guestDraftTtlDays()} days` },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invitation details are invalid." }, { status: 400 });
    }

    console.error("Failed to create invitation", error);
    return NextResponse.json({ error: "We could not save your invitation." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const scene = url.searchParams.get("scene");
    const session = await auth();

    if (session?.user?.id) {
      const invitations = await prisma.invitation.findMany({
        where: {
          userId: session.user.id,
          ...(status ? { status } : {}),
          ...(scene ? { scene } : {}),
        },
        orderBy: { updatedAt: "desc" },
      });
      return NextResponse.json({ success: true, data: invitations, isGuest: false });
    }

    const sessionId = await getSessionId();
    if (!sessionId) {
      return NextResponse.json({ success: true, data: [], isGuest: true });
    }

    const drafts = await prisma.guestDraft.findMany({
      where: {
        sessionId,
        expiresAt: { gt: new Date() },
        ...(scene ? { scene } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, data: drafts, isGuest: true });
  } catch (error) {
    console.error("Failed to list invitations", error);
    return NextResponse.json({ error: "We could not load your invitations." }, { status: 500 });
  }
}
