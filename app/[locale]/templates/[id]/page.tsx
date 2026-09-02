import TemplateDetailPage from "@/app/templates/[id]/page";

export const dynamic = "force-dynamic";

export default async function LocalizedTemplateDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  return TemplateDetailPage({ params: Promise.resolve({ id }) });
}
