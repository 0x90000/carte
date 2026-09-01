import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { invalidateInvitationCache } from "@/lib/public-invitation";

export class PaymentWebhookError extends Error {}

function metadataValue(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function paymentIntentId(value: string | Stripe.PaymentIntent | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = metadataValue(session.metadata, "userId");
  const invitationId = metadataValue(session.metadata, "invitationId");
  if (!userId || !invitationId) {
    throw new PaymentWebhookError("Checkout metadata is incomplete.");
  }

  const providerPaymentId = paymentIntentId(session.payment_intent);
  const amountCents = session.amount_total;
  const currency = session.currency?.toUpperCase();
  if (amountCents === null || !currency) {
    throw new PaymentWebhookError("Checkout payment details are incomplete.");
  }

  const result = await prisma.$transaction(async (transaction) => {
    const invitation = await transaction.invitation.findFirst({
      where: { id: invitationId, userId },
      select: { id: true, slug: true, status: true, publishedAt: true },
    });
    if (!invitation) {
      throw new PaymentWebhookError("Invitation for checkout was not found.");
    }

    const existing = await transaction.payment.findFirst({
      where: {
        OR: [
          { providerSessionId: session.id },
          ...(providerPaymentId ? [{ providerPaymentId }] : []),
        ],
      },
    });

    if (existing) {
      await transaction.payment.update({
        where: { id: existing.id },
        data: {
          userId,
          invitationId,
          amountCents,
          currency,
          paymentProvider: "stripe",
          providerPaymentId: providerPaymentId ?? existing.providerPaymentId,
          providerSessionId: session.id,
          status: "succeeded",
        },
      });
    } else {
      await transaction.payment.create({
        data: {
          userId,
          invitationId,
          amountCents,
          currency,
          paymentProvider: "stripe",
          providerPaymentId,
          providerSessionId: session.id,
          status: "succeeded",
        },
      });
    }

    if (invitation.status !== "published") {
      await transaction.invitation.update({
        where: { id: invitation.id },
        data: { status: "published", publishedAt: invitation.publishedAt ?? new Date() },
      });
    }
    return invitation;
  });

  await invalidateInvitationCache(result.slug);
  return result;
}

export async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const providerPaymentId = paymentIntent.id;
  await prisma.payment.updateMany({
    where: { providerPaymentId },
    data: { status: "failed" },
  });
}
