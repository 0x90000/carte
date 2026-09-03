import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const LIFETIME_DAILY_PUBLISH_LIMIT = 10;

export type PublishInvitationErrorCode =
  | "INVITATION_NOT_FOUND"
  | "INVITATION_ALREADY_PUBLISHED"
  | "PAYMENT_REQUIRED"
  | "DAILY_LIMIT_REACHED";

export class PublishInvitationError extends Error {
  constructor(public readonly code: PublishInvitationErrorCode) {
    super(code);
  }
}

export function getUtcUsageDate(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function getLifetimeBillingStatus(userId: string, now = new Date()) {
  const usageDate = getUtcUsageDate(now);
  const [user, usage] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { lifetimeAccessAt: true } }),
    prisma.dailyPublishUsage.findUnique({
      where: { userId_usageDate: { userId, usageDate } },
      select: { count: true },
    }),
  ]);
  const usedToday = usage?.count ?? 0;

  return {
    hasLifetimeAccess: Boolean(user?.lifetimeAccessAt),
    lifetimeAccessAt: user?.lifetimeAccessAt ?? null,
    dailyLimit: LIFETIME_DAILY_PUBLISH_LIMIT,
    usedToday,
    remainingToday: Math.max(0, LIFETIME_DAILY_PUBLISH_LIMIT - usedToday),
  };
}

export async function publishInvitationWithLifetimeAccessInTransaction(
  transaction: Prisma.TransactionClient,
  params: { userId: string; invitationId: string; now: Date },
) {
  const invitation = await transaction.invitation.findFirst({
    where: { id: params.invitationId, userId: params.userId },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });
  if (!invitation) {
    throw new PublishInvitationError("INVITATION_NOT_FOUND");
  }
  if (invitation.status === "published") {
    throw new PublishInvitationError("INVITATION_ALREADY_PUBLISHED");
  }

  const user = await transaction.user.findUnique({
    where: { id: params.userId },
    select: { lifetimeAccessAt: true },
  });
  if (!user?.lifetimeAccessAt) {
    throw new PublishInvitationError("PAYMENT_REQUIRED");
  }

  const usageDate = getUtcUsageDate(params.now);
  const currentUsage = await transaction.dailyPublishUsage.findUnique({
    where: { userId_usageDate: { userId: params.userId, usageDate } },
    select: { count: true },
  });
  if ((currentUsage?.count ?? 0) >= LIFETIME_DAILY_PUBLISH_LIMIT) {
    throw new PublishInvitationError("DAILY_LIMIT_REACHED");
  }

  const updated = await transaction.invitation.updateMany({
    where: { id: invitation.id, userId: params.userId, status: { not: "published" } },
    data: { status: "published", publishedAt: invitation.publishedAt ?? params.now },
  });
  if (updated.count === 0) {
    throw new PublishInvitationError("INVITATION_ALREADY_PUBLISHED");
  }

  const usage = await transaction.dailyPublishUsage.upsert({
    where: { userId_usageDate: { userId: params.userId, usageDate } },
    create: { userId: params.userId, usageDate, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  if (usage.count > LIFETIME_DAILY_PUBLISH_LIMIT) {
    throw new PublishInvitationError("DAILY_LIMIT_REACHED");
  }

  return {
    invitationId: invitation.id,
    slug: invitation.slug,
    usedToday: usage.count,
    remainingToday: LIFETIME_DAILY_PUBLISH_LIMIT - usage.count,
  };
}

export async function publishInvitationWithLifetimeAccess(
  userId: string,
  invitationId: string,
  now = new Date(),
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        (transaction) => publishInvitationWithLifetimeAccessInTransaction(transaction, { userId, invitationId, now }),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      const shouldRetry = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!shouldRetry || attempt === 2) {
        throw error;
      }
    }
  }

  throw new Error("Lifetime publishing transaction exhausted retries.");
}
