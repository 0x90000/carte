import Stripe from "stripe";

const STRIPE_API_VERSION = "2024-12-18.acacia" as Stripe.LatestApiVersion;

export const PAYMENT_PURCHASE_TYPES = ["single_publish", "lifetime"] as const;
export type PaymentPurchaseType = (typeof PAYMENT_PURCHASE_TYPES)[number];

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

export function isPaymentPurchaseType(value: string): value is PaymentPurchaseType {
  return PAYMENT_PURCHASE_TYPES.includes(value as PaymentPurchaseType);
}

export function getStripePriceId(purchaseType: PaymentPurchaseType) {
  return purchaseType === "single_publish"
    ? process.env.STRIPE_PRICE_ID_SINGLE ?? null
    : process.env.STRIPE_PRICE_ID_LIFETIME ?? null;
}

export async function createCheckoutSession(params: {
  userId: string;
  purchaseType: PaymentPurchaseType;
  invitationId?: string | null;
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
      purchaseType: params.purchaseType,
      ...(params.invitationId ? { invitationId: params.invitationId } : {}),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    automatic_tax: { enabled: true },
  });
}
