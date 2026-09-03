import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { invalidateInvitationCache } from "@/lib/public-invitation";
import {
  PublishInvitationError,
  publishInvitationWithLifetimeAccessInTransaction,
} from "@/lib/publishing";
import { isPaymentPurchaseType } from "@/lib/stripe";

export class PaymentWebhookError extends Error {}

function metadataValue(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function paymentIntentId(value: string | Stripe.PaymentIntent | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

async function processCheckoutCompleted(session: Stripe.Checkout.Session, now: Date) {
  const userId = metadataValue(session.metadata, "userId");
  const invitationId = metadataValue(session.metadata, "invitationId");
  const purchaseTypeValue = metadataValue(session.metadata, "purchaseType");
  if (!userId || !purchaseTypeValue || !isPaymentPurchaseType(purchaseTypeValue)) {
    throw new PaymentWebhookError("Checkout metadata is incomplete.");
  }
  if (purchaseTypeValue === "single_publish" && !invitationId) {
    throw new PaymentWebhookError("Single-publish checkout requires an invitation.");
  }

  const providerPaymentId = paymentIntentId(session.payment_intent);
  const amountCents = session.amount_total;
  const currency = session.currency?.toUpperCase();
  if (amountCents === null || !currency) {
    throw new PaymentWebhookError("Checkout payment details are incomplete.");
  }

  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.payment.findFirst({
      where: {
        OR: [
          { providerSessionId: session.id },
          ...(providerPaymentId ? [{ providerPaymentId }] : []),
        ],
      },
      include: { invitation: { select: { slug: true } } },
    });
    if (existing?.status === "succeeded") {
      return { invitationSlug: existing.invitation?.slug ?? null, processed: false };
    }

    const user = await transaction.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new PaymentWebhookError("User for checkout was not found.");
    }

    let invitation: { id: string; slug: string; status: string; publishedAt: Date | null } | null = null;
    if (invitationId) {
      invitation = await transaction.invitation.findFirst({
        where: { id: invitationId, userId },
        select: { id: true, slug: true, status: true, publishedAt: true },
      });
      if (!invitation) {
        throw new PaymentWebhookError("Invitation for checkout was not found.");
      }
    }

    const paymentData = {
      userId,
      invitationId,
      purchaseType: purchaseTypeValue,
      amountCents,
      currency,
      paymentProvider: "stripe",
      providerPaymentId,
      providerSessionId: session.id,
      status: "succeeded",
    };
    if (existing) {
      await transaction.payment.update({
        where: { id: existing.id },
        data: { ...paymentData, providerPaymentId: providerPaymentId ?? existing.providerPaymentId },
      });
    } else {
      await transaction.payment.create({ data: paymentData });
    }

    if (purchaseTypeValue === "single_publish") {
      if (invitation?.status !== "published") {
        await transaction.invitation.update({
          where: { id: invitation!.id },
          data: { status: "published", publishedAt: invitation?.publishedAt ?? now },
        });
      }
      return { invitationSlug: invitation!.slug, processed: true };
    }

    await transaction.user.updateMany({
      where: { id: userId, lifetimeAccessAt: null },
      data: { lifetimeAccessAt: { set: now } },
    });

    if (!invitation || invitation.status === "published") {
      return { invitationSlug: invitation?.slug ?? null, processed: true };
    }

    try {
      const published = await publishInvitationWithLifetimeAccessInTransaction(transaction, {
        userId,
        invitationId: invitation.id,
        now,
      });
      return { invitationSlug: published.slug, processed: true };
    } catch (error) {
      if (error instanceof PublishInvitationError && error.code === "DAILY_LIMIT_REACHED") {
        return { invitationSlug: null, processed: true };
      }
      throw error;
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") {
    return { invitationSlug: null, processed: false };
  }

  const now = new Date();
  let result: Awaited<ReturnType<typeof processCheckoutCompleted>> | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      result = await processCheckoutCompleted(session, now);
      break;
    } catch (error) {
      const shouldRetry = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!shouldRetry || attempt === 2) {
        throw error;
      }
    }
  }

  if (result?.invitationSlug) {
    await invalidateInvitationCache(result.invitationSlug);
  }
  return result;
}

export async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  await prisma.payment.updateMany({
    where: { providerPaymentId: paymentIntent.id },
    data: { status: "failed" },
  });
}
