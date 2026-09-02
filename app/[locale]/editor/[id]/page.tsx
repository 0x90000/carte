import EditorPage from "@/app/editor/[id]/page";

export const dynamic = "force-dynamic";

export default async function LocalizedEditorPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  return EditorPage({ params: Promise.resolve({ id }), searchParams });
}
