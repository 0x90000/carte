import SharePage from "@/app/dashboard/invitations/[id]/share/page";

export const dynamic = "force-dynamic";

export default async function LocalizedSharePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  return SharePage({ params: Promise.resolve({ id }) });
}
