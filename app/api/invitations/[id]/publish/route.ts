import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
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

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!secretKey || !priceId || !appUrl) {
    return NextResponse.json(
      { error: "Publishing payments are not configured. Set STRIPE_SECRET_KEY, STRIPE_PRICE_ID, and NEXT_PUBLIC_APP_URL." },
      { status: 503 },
    );
  }

  try {
    const stripe = new Stripe(secretKey);
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: session.user.email ?? undefined,
      success_url: `${appUrl}/dashboard?payment=success&invitation=${encodeURIComponent(invitation.id)}`,
      cancel_url: `${appUrl}/editor/${encodeURIComponent(invitation.id)}?payment=cancelled`,
      metadata: { invitationId: invitation.id, userId: session.user.id },
    });

    return NextResponse.json({ success: true, checkoutUrl: checkout.url });
  } catch (error) {
    console.error("Failed to create publish checkout", error);
    return NextResponse.json({ error: "We could not start payment. Please try again." }, { status: 502 });
  }
}
