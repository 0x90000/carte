import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeRsvpEmail, normalizeRsvpPhone, rsvpSchema } from "@/lib/rsvp";
import { consumeRateLimit, getRequestIdentifier, setRateLimitHeaders } from "@/lib/rate-limit";

const RSVP_RATE_LIMIT = { limit: 3, windowSeconds: 60 } as const;

class DuplicateRsvpError extends Error {
  constructor() {
    super("DUPLICATE_RSVP");
  }
}

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit("rsvp", getRequestIdentifier(request), RSVP_RATE_LIMIT);
  if (!rateLimit.available) {
    const response = NextResponse.json(
      { success: false, error: { code: "RATE_LIMIT_UNAVAILABLE", message: "RSVP service is temporarily unavailable." } },
      { status: 503 },
    );
    return setRateLimitHeaders(response, rateLimit);
  }
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "Too many RSVP attempts. Please try again later." } },
      { status: 429 },
    );
    return setRateLimitHeaders(response, rateLimit);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const response = NextResponse.json(
      { success: false, error: { code: "INVALID_JSON", message: "RSVP details are invalid." } },
      { status: 400 },
    );
    return setRateLimitHeaders(response, rateLimit);
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    const response = NextResponse.json(
      { success: false, error: { code: "INVALID_RSVP", message: parsed.error.issues[0]?.message ?? "RSVP details are invalid." } },
      { status: 400 },
    );
    return setRateLimitHeaders(response, rateLimit);
  }

  try {
    const invitation = await prisma.invitation.findFirst({
      where: { slug: parsed.data.invitationSlug, status: "published" },
      select: { id: true },
    });
    if (!invitation) {
      return NextResponse.json(
        { success: false, error: { code: "INVITATION_NOT_FOUND", message: "This invitation is not available." } },
        { status: 404 },
      );
    }

    const guestEmail = normalizeRsvpEmail(parsed.data.guestEmail);
    const guestPhone = normalizeRsvpPhone(parsed.data.guestPhone);
    if (!guestEmail && !guestPhone) {
      const response = NextResponse.json(
        { success: false, error: { code: "INVALID_RSVP", message: "Enter an email address or phone number." } },
        { status: 400 },
      );
      return setRateLimitHeaders(response, rateLimit);
    }

    const rsvp = await prisma.$transaction(async (transaction) => {
      const duplicate = await transaction.rSVP.findFirst({
        where: guestEmail
          ? { invitationId: invitation.id, guestEmail }
          : { invitationId: invitation.id, guestEmail: null, guestPhone },
        select: { id: true },
      });
      if (duplicate) {
        throw new DuplicateRsvpError();
      }
      return transaction.rSVP.create({
        data: {
          invitationId: invitation.id,
          guestName: parsed.data.guestName,
          guestEmail,
          guestPhone,
          status: parsed.data.status,
          partySize: parsed.data.partySize,
          dietaryPreferences: parsed.data.dietaryPreferences || null,
          message: parsed.data.message || null,
        },
        select: { id: true },
      });
    });

    const response = NextResponse.json(
      { success: true, data: { id: rsvp.id, message: "Your RSVP has been submitted." } },
      { status: 201 },
    );
    return setRateLimitHeaders(response, rateLimit);
  } catch (error) {
    if (error instanceof DuplicateRsvpError || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      const response = NextResponse.json(
        { success: false, error: { code: "DUPLICATE_RSVP", message: "An RSVP has already been submitted for this contact." } },
        { status: 409 },
      );
      return setRateLimitHeaders(response, rateLimit);
    }
    console.error("Failed to create RSVP", error);
    const response = NextResponse.json(
      { success: false, error: { code: "RSVP_CREATE_FAILED", message: "We could not submit your RSVP." } },
      { status: 500 },
    );
    return setRateLimitHeaders(response, rateLimit);
  }
}
