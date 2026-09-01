import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Please sign in first." } }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const invitation = await prisma.invitation.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!invitation) {
      return NextResponse.json({ success: false, error: { code: "INVITATION_NOT_FOUND", message: "Invitation not found." } }, { status: 404 });
    }

    const rsvps = await prisma.rSVP.findMany({
      where: { invitationId: invitation.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: rsvps });
  } catch (error) {
    console.error("Failed to list RSVPs", error);
    return NextResponse.json({ success: false, error: { code: "RSVP_LIST_FAILED", message: "We could not load RSVPs." } }, { status: 500 });
  }
}
