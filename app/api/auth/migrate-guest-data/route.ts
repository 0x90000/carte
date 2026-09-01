import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { generateInvitationSlug } from "@/lib/invitation";
import { prisma } from "@/lib/prisma";
import { getSessionId } from "@/lib/session";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const sessionId = await getSessionId();
  if (!sessionId) {
    return NextResponse.json({ success: true, migrated: 0 });
  }

  try {
    const migrated = await prisma.$transaction(async (tx) => {
      const drafts = await tx.guestDraft.findMany({
        where: { sessionId, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "asc" },
      });

      if (drafts.length === 0) {
        return 0;
      }

      for (const draft of drafts) {
        await tx.invitation.create({
          data: {
            id: draft.id,
            userId: session.user.id,
            scene: draft.scene,
            title: draft.title || "Untitled invitation",
            content: draft.content as Prisma.InputJsonValue,
            templateId: draft.templateId ?? undefined,
            eventDate: draft.eventDate,
            eventLocation: draft.eventLocation,
            settings: draft.settings as Prisma.InputJsonValue,
            slug: generateInvitationSlug(),
            status: "draft",
          },
        });
      }

      await tx.guestDraft.deleteMany({
        where: { id: { in: drafts.map((draft) => draft.id) }, sessionId },
      });
      return drafts.length;
    });

    return NextResponse.json({ success: true, migrated });
  } catch (error) {
    console.error("Failed to migrate guest drafts", error);
    return NextResponse.json({ error: "We could not restore your saved drafts." }, { status: 500 });
  }
}
