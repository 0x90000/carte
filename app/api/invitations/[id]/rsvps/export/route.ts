import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Please sign in first." } }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const invitation = await prisma.invitation.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, slug: true },
    });
    if (!invitation) {
      return NextResponse.json({ success: false, error: { code: "INVITATION_NOT_FOUND", message: "Invitation not found." } }, { status: 404 });
    }

    const rsvps = await prisma.rSVP.findMany({
      where: { invitationId: invitation.id },
      orderBy: { createdAt: "desc" },
    });
    const rows = [
      ["Name", "Email", "Phone", "Status", "Party size", "Dietary preferences", "Message", "Submitted at"],
      ...rsvps.map((rsvp) => [
        rsvp.guestName,
        rsvp.guestEmail,
        rsvp.guestPhone,
        rsvp.status,
        rsvp.partySize,
        rsvp.dietaryPreferences,
        rsvp.message,
        rsvp.createdAt.toISOString(),
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    return new Response(`\uFEFF${csv}\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rsvps-${invitation.slug}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to export RSVPs", error);
    return NextResponse.json({ success: false, error: { code: "RSVP_EXPORT_FAILED", message: "We could not export RSVPs." } }, { status: 500 });
  }
}
