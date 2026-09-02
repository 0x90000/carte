import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
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

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/create`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/templates`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const templatePages: MetadataRoute.Sitemap = templates.map((template) => ({
    url: `${baseUrl}/templates/${encodeURIComponent(template.id)}`,
    lastModified: template.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const invitationPages: MetadataRoute.Sitemap = invitations.map((invitation) => ({
    url: `${baseUrl}/i/${encodeURIComponent(invitation.slug)}`,
    lastModified: invitation.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...templatePages, ...invitationPages];
}
