import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { getPublishedInvitation } from "@/lib/public-invitation";
import { prisma } from "@/lib/prisma";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type LocalizedInvitationPageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: LocalizedInvitationPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations("invitation");
  const invitation = await getPublishedInvitation(slug);
  if (!invitation) {
    return { title: t("notFoundTitle") };
  }
  const description = t("invitedDescription", { title: invitation.title });
  return {
    title: invitation.title,
    description,
    openGraph: {
      title: invitation.title,
      description,
      images: invitation.template?.previewUrl ? [invitation.template.previewUrl] : undefined,
      url: `/${locale}/i/${invitation.slug}`,
    },
    alternates: {
      canonical: absoluteSiteUrl(`/${locale}/i/${encodeURIComponent(invitation.slug)}`),
      languages: {
        en: absoluteSiteUrl(`/en/i/${encodeURIComponent(invitation.slug)}`),
        "zh-CN": absoluteSiteUrl(`/zh-CN/i/${encodeURIComponent(invitation.slug)}`),
      },
    },
  };
}

export default async function LocalizedInvitationPage({ params }: LocalizedInvitationPageProps) {
  const { slug } = await params;
  const invitation = await getPublishedInvitation(slug);
  if (!invitation) {
    notFound();
  }
  void prisma.invitation.update({ where: { id: invitation.id }, data: { viewCount: { increment: 1 } } }).catch((error) => {
    console.warn("Could not increment invitation view count", error);
  });
  return <InvitationRenderer invitation={invitation} />;
}
