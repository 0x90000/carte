import RSVPPage from "@/app/dashboard/invitations/[id]/rsvps/page";

export const dynamic = "force-dynamic";

export default async function LocalizedRSVPPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  return RSVPPage({ params: Promise.resolve({ id }) });
}
