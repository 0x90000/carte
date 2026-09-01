import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { getPublishedInvitation } from "@/lib/public-invitation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type LocalizedInvitationPageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: LocalizedInvitationPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const invitation = await getPublishedInvitation(slug);
  if (!invitation) {
    return { title: "Invitation not found | Carte" };
  }
  return {
    title: invitation.title,
    description: `You're invited to ${invitation.title}`,
    openGraph: {
      title: invitation.title,
      description: `You're invited to ${invitation.title}`,
      images: invitation.template?.previewUrl ? [invitation.template.previewUrl] : undefined,
      url: `/${locale}/i/${invitation.slug}`,
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
