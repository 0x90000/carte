import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createCheckoutSession, getDefaultStripePriceId, isAllowedStripePriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const checkoutSchema = z.object({
  invitationId: z.string().trim().min(1),
  priceId: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = checkoutSchema.parse(await request.json());
    const invitation = await prisma.invitation.findFirst({
      where: { id: payload.invitationId, userId: session.user.id },
      select: { id: true, status: true },
    });
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    }
    if (invitation.status === "published") {
      return NextResponse.json({ error: "Invitation is already published." }, { status: 409 });
    }

    const priceId = payload.priceId ?? getDefaultStripePriceId();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    if (!process.env.STRIPE_SECRET_KEY || !priceId || !appUrl) {
      return NextResponse.json(
        { error: "Publishing payments are not configured." },
        { status: 503 },
      );
    }
    if (!isAllowedStripePriceId(priceId)) {
      return NextResponse.json({ error: "That payment price is not available." }, { status: 400 });
    }

    const checkout = await createCheckoutSession({
      userId: session.user.id,
      invitationId: invitation.id,
      priceId,
      customerEmail: session.user.email,
      successUrl: `${appUrl}/dashboard?payment=success&invitation=${encodeURIComponent(invitation.id)}`,
      cancelUrl: `${appUrl}/editor/${encodeURIComponent(invitation.id)}?payment=cancelled`,
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkout.url,
        checkoutSessionId: checkout.id,
        paymentIntentId: typeof checkout.payment_intent === "string" ? checkout.payment_intent : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Checkout details are invalid." }, { status: 400 });
    }
    console.error("Failed to create checkout session", error);
    return NextResponse.json({ error: "We could not start payment. Please try again." }, { status: 502 });
  }
}
