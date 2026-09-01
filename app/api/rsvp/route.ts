import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rsvpRequestSchema } from "@/lib/rsvp";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_JSON", message: "RSVP details are invalid." } },
      { status: 400 },
    );
  }

  const parsed = rsvpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_RSVP", message: parsed.error.issues[0]?.message ?? "RSVP details are invalid." } },
      { status: 400 },
    );
  }

  try {
    const invitation = await prisma.invitation.findFirst({
      where: {
        status: "published",
        ...(parsed.data.invitationId ? { id: parsed.data.invitationId } : { slug: parsed.data.invitationSlug }),
      },
      select: { id: true },
    });
    if (!invitation) {
      return NextResponse.json(
        { success: false, error: { code: "INVITATION_NOT_FOUND", message: "This invitation is not available." } },
        { status: 404 },
      );
    }

    const rsvp = await prisma.rSVP.create({
      data: {
        invitationId: invitation.id,
        guestName: parsed.data.guestName,
        guestEmail: parsed.data.guestEmail || null,
        guestPhone: parsed.data.guestPhone || null,
        status: parsed.data.status,
        partySize: parsed.data.partySize,
        dietaryPreferences: parsed.data.dietaryPreferences || null,
        message: parsed.data.message || null,
      },
      select: { id: true },
    });

    return NextResponse.json(
      { success: true, data: { id: rsvp.id, message: "Your RSVP has been submitted." } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create RSVP", error);
    return NextResponse.json(
      { success: false, error: { code: "RSVP_CREATE_FAILED", message: "We could not submit your RSVP." } },
      { status: 500 },
    );
  }
}
