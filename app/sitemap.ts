import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const [templates, invitations] = await Promise.all([
    prisma.template.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
    }),
    prisma.invitation.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = ["", "/create", "/templates"].flatMap((path) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
  );

  const templatePages: MetadataRoute.Sitemap = templates.flatMap((template) => locales.map((locale) => ({
    url: `${baseUrl}/${locale}/templates/${encodeURIComponent(template.id)}`,
    lastModified: template.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  })));

  const invitationPages: MetadataRoute.Sitemap = invitations.flatMap((invitation) => locales.map((locale) => ({
    url: `${baseUrl}/${locale}/i/${encodeURIComponent(invitation.slug)}`,
    lastModified: invitation.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  })));

  return [...staticPages, ...templatePages, ...invitationPages];
}
