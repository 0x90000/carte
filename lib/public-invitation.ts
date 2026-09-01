import type { Invitation, Template } from "@prisma/client";
import { getRedis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

const INVITATION_CACHE_TTL_SECONDS = 60 * 60;

export type PublicInvitation = Invitation & { template: Template | null };

function cacheKey(slug: string) {
  return `invitation:${slug}`;
}

function reviveInvitation(value: string): PublicInvitation {
  const parsed = JSON.parse(value) as PublicInvitation;
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
    eventDate: parsed.eventDate ? new Date(parsed.eventDate) : null,
    publishedAt: parsed.publishedAt ? new Date(parsed.publishedAt) : null,
    template: parsed.template
      ? {
          ...parsed.template,
          createdAt: new Date(parsed.template.createdAt),
          updatedAt: new Date(parsed.template.updatedAt),
        }
      : null,
  };
}

async function getInvitationRedis() {
  try {
    return await getRedis();
  } catch (error) {
    console.warn("Could not connect to invitation cache", error);
    return null;
  }
}

export async function getPublishedInvitation(slug: string): Promise<PublicInvitation | null> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug || normalizedSlug.length > 100) {
    return null;
  }

  const redis = await getInvitationRedis();
  if (redis) {
    try {
      const cached = await redis.get(cacheKey(normalizedSlug));
      if (cached) {
        return reviveInvitation(cached);
      }
    } catch (error) {
      console.warn("Could not read invitation cache", error);
    }
  }

  const invitation = await prisma.invitation.findFirst({
    where: { slug: normalizedSlug, status: "published" },
    include: { template: true },
  });
  if (!invitation) {
    return null;
  }

  if (redis) {
    try {
      await redis.set(cacheKey(normalizedSlug), JSON.stringify(invitation), { EX: INVITATION_CACHE_TTL_SECONDS });
    } catch (error) {
      console.warn("Could not write invitation cache", error);
    }
  }
  return invitation;
}

export async function invalidateInvitationCache(slug: string | null | undefined) {
  if (!slug) {
    return;
  }
  const redis = await getInvitationRedis();
  if (!redis) {
    return;
  }
  try {
    await redis.del(cacheKey(slug));
  } catch (error) {
    console.warn("Could not invalidate invitation cache", error);
  }
}
