import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { EditorShell } from "@/components/editor/editor-shell";
import { normalizeEditorContent } from "@/components/editor/types";
import { prisma } from "@/lib/prisma";
import { getSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";

type EditorPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: EditorPageProps): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations("editor");
  const invitation = await prisma.invitation.findUnique({ where: { id }, select: { title: true } });
  return { title: invitation?.title ? `${invitation.title} | Carte` : t("metadataTitle") };
}

export default async function EditorPage({ params, searchParams }: EditorPageProps) {
  const { id } = await params;
  const t = await getTranslations("editor");
  const session = await auth();
  const action = firstParam(searchParams ? (await searchParams).action : undefined);

  let record: {
    id: string;
    title: string | null;
    scene: string;
    content: unknown;
    eventDate: Date | null;
    eventLocation: string | null;
    updatedAt: Date;
    template?: { name: string } | null;
  } | null = null;
  let isGuest = false;

  if (session?.user?.id) {
    record = await prisma.invitation.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, title: true, scene: true, content: true, eventDate: true, eventLocation: true, updatedAt: true, template: { select: { name: true } } },
    });
  } else {
    const sessionId = await getSessionId();
    if (sessionId) {
      record = await prisma.guestDraft.findFirst({
        where: { id, sessionId, expiresAt: { gt: new Date() } },
        select: { id: true, title: true, scene: true, content: true, eventDate: true, eventLocation: true, updatedAt: true, template: { select: { name: true } } },
      });
      isGuest = Boolean(record);
    }
  }

  if (!record) {
    notFound();
  }

  return (
    <EditorShell
      invitationId={record.id}
      initialTitle={record.title ?? record.template?.name ?? t("untitled")}
      initialContent={normalizeEditorContent(record.content)}
      initialUpdatedAt={record.updatedAt.toISOString()}
      isGuest={isGuest}
      templateName={record.template?.name}
      scene={record.scene}
      eventDate={record.eventDate?.toISOString()}
      eventLocation={record.eventLocation}
      action={action}
    />
  );
}
