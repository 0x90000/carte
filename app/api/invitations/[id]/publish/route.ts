import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCheckoutSession, getDefaultStripePriceId, isAllowedStripePriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in before publishing." }, { status: 401 });
  }

  const { id } = await context.params;
  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true, status: true },
  });
  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }
  if (invitation.status === "published") {
    return NextResponse.json({ error: "Invitation is already published." }, { status: 409 });
  }

  const priceId = getDefaultStripePriceId();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!priceId || !appUrl || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Publishing payments are not configured. Set STRIPE_SECRET_KEY, STRIPE_PRICE_ID, and NEXT_PUBLIC_APP_URL." },
      { status: 503 },
    );
  }
  if (!isAllowedStripePriceId(priceId)) {
    return NextResponse.json({ error: "That payment price is not available." }, { status: 400 });
  }

  try {
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
      checkoutUrl: checkout.url,
      checkoutSessionId: checkout.id,
    });
  } catch (error) {
    console.error("Failed to create publish checkout", error);
    return NextResponse.json({ error: "We could not start payment. Please try again." }, { status: 502 });
  }
}
