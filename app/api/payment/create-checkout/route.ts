import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession, getStripePriceId } from "@/lib/stripe";

const checkoutSchema = z.discriminatedUnion("purchaseType", [
  z.object({
    purchaseType: z.literal("single_publish"),
    invitationId: z.string().trim().min(1),
  }).strict(),
  z.object({
    purchaseType: z.literal("lifetime"),
    invitationId: z.string().trim().min(1).optional(),
  }).strict(),
]);

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Sign in before starting checkout.", 401);
  }

  try {
    const payload = checkoutSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lifetimeAccessAt: true },
    });
    if (!user) {
      return errorResponse("USER_NOT_FOUND", "Your account could not be found.", 404);
    }
    if (user.lifetimeAccessAt) {
      return errorResponse("LIFETIME_ALREADY_ACTIVE", "Lifetime access is already active; paid checkout is unavailable.", 409);
    }

    const invitationId = payload.invitationId;
    if (invitationId) {
      const invitation = await prisma.invitation.findFirst({
        where: { id: invitationId, userId: session.user.id },
        select: { id: true, status: true },
      });
      if (!invitation) {
        return errorResponse("INVITATION_NOT_FOUND", "Invitation not found.", 404);
      }
      if (invitation.status === "published") {
        return errorResponse("INVITATION_ALREADY_PUBLISHED", "Invitation is already published.", 409);
      }
    }

    const priceId = getStripePriceId(payload.purchaseType);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    if (!process.env.STRIPE_SECRET_KEY || !priceId || !appUrl) {
      return errorResponse("CHECKOUT_NOT_CONFIGURED", "Payments are not configured.", 503);
    }

    const checkout = await createCheckoutSession({
      userId: session.user.id,
      purchaseType: payload.purchaseType,
      invitationId,
      priceId,
      customerEmail: session.user.email,
      successUrl: `${appUrl}/dashboard?payment=success&purchase=${payload.purchaseType}${invitationId ? `&invitation=${encodeURIComponent(invitationId)}` : ""}`,
      cancelUrl: invitationId
        ? `${appUrl}/editor/${encodeURIComponent(invitationId)}?payment=cancelled`
        : `${appUrl}/dashboard?payment=cancelled`,
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkout.url,
        checkoutSessionId: checkout.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("INVALID_CHECKOUT", "Checkout details are invalid.", 400);
    }
    console.error("Failed to create checkout session", error);
    return errorResponse("CHECKOUT_FAILED", "We could not start payment. Please try again.", 502);
  }
}
