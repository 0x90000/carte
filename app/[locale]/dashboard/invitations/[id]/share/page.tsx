import SharePage from "@/app/dashboard/invitations/[id]/share/page";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("share");
  return { title: { absolute: t("metadataTitle") }, description: t("metadataDescription") };
}

export default async function LocalizedSharePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  return SharePage({ params: Promise.resolve({ id }) });
}
