import RSVPPage from "@/app/dashboard/invitations/[id]/rsvps/page";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rsvpDashboard");
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function LocalizedRSVPPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  return RSVPPage({ params: Promise.resolve({ id }) });
}
