import Stripe from "stripe";

const STRIPE_API_VERSION = "2024-12-18.acacia" as Stripe.LatestApiVersion;

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  stripeClient ??= new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  });
  return stripeClient;
}

export function getDefaultStripePriceId() {
  return process.env.STRIPE_PRICE_ID_SINGLE ?? process.env.STRIPE_PRICE_ID ?? null;
}

export function isAllowedStripePriceId(priceId: string) {
  return [
    process.env.STRIPE_PRICE_ID_SINGLE,
    process.env.STRIPE_PRICE_ID_3PACK,
    process.env.STRIPE_PRICE_ID_10PACK,
    process.env.STRIPE_PRICE_ID,
  ].filter((value): value is string => Boolean(value)).includes(priceId);
}

export async function createCheckoutSession(params: {
  userId: string;
  invitationId: string;
  priceId: string;
  customerEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: params.priceId, quantity: 1 }],
    customer_email: params.customerEmail ?? undefined,
    metadata: {
      userId: params.userId,
      invitationId: params.invitationId,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    automatic_tax: { enabled: true },
  });
}
