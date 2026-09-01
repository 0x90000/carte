import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { getPublishedInvitation } from "@/lib/public-invitation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PublicInvitationPageProps = { params: Promise<{ slug: string }> };

async function findInvitation(slug: string) {
  return getPublishedInvitation(slug);
}

export async function generateMetadata({ params }: PublicInvitationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await findInvitation(slug);
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
      url: `/i/${invitation.slug}`,
    },
  };
}

export default async function PublicInvitationPage({ params }: PublicInvitationPageProps) {
  const { slug } = await params;
  const invitation = await findInvitation(slug);
  if (!invitation) {
    notFound();
  }

  void prisma.invitation.update({ where: { id: invitation.id }, data: { viewCount: { increment: 1 } } }).catch((error) => {
    console.warn("Could not increment invitation view count", error);
  });

  return <InvitationRenderer invitation={invitation} />;
}
