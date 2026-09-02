import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, QrCode } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { ShareLinkActions } from "@/components/share/share-link-actions";
import { buttonVariants } from "@/components/ui/button";
import { localePath } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SharePageProps = { params: Promise<{ id: string }> };

async function findInvitation(id: string, userId: string) {
  return prisma.invitation.findFirst({
    where: { id, userId },
    select: { id: true, title: true, slug: true, status: true },
  });
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const t = await getTranslations("share");
  const session = await auth();
  if (!session?.user?.id) {
    return { title: t("metadataTitle"), description: t("metadataDescription") };
  }
  const { id } = await params;
  const invitation = await findInvitation(id, session.user.id);
  return {
    title: invitation ? t("metadataInvitationTitle", { title: invitation.title }) : t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("share")]);
  const session = await auth();
  if (!session?.user?.id) {
    redirect(localePath(locale, "/login"));
  }

  const { id } = await params;
  const invitation = await findInvitation(id, session.user.id);
  if (!invitation) {
    notFound();
  }
  if (invitation.status !== "published") {
    redirect(localePath(locale, `/editor/${encodeURIComponent(invitation.id)}`));
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const publicUrl = `${appUrl}${localePath(locale, `/i/${encodeURIComponent(invitation.slug)}`)}`;
  const qrDataUrl = await QRCode.toDataURL(publicUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
  });

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href={localePath(locale, "/dashboard")} className="inline-flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("backDashboard")}
          </Link>
          <Link href={localePath(locale, `/i/${encodeURIComponent(invitation.slug)}`)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> {t("openInvitation")}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">{t("eyebrow")}</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{invitation.title}</h1>
          <p className="text-base text-muted-foreground">{t("description")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className="space-y-5 rounded-lg border border-border bg-card p-6 shadow-sm" aria-labelledby="share-link-heading">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" aria-hidden="true" />
              <h2 id="share-link-heading" className="text-lg font-semibold">{t("publicLink")}</h2>
            </div>
            <p className="break-all rounded-md bg-secondary px-4 py-3 font-mono text-sm text-foreground">{publicUrl}</p>
            <ShareLinkActions publicUrl={publicUrl} title={invitation.title} />
          </section>

          <section className="rounded-lg border border-border bg-card p-6 text-center shadow-sm" aria-labelledby="qr-heading">
            <div className="flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5" aria-hidden="true" />
              <h2 id="qr-heading" className="text-lg font-semibold">{t("qrCode")}</h2>
            </div>
            <Image src={qrDataUrl} alt={t("qrAlt", { title: invitation.title })} width={280} height={280} unoptimized className="mx-auto mt-5 aspect-square w-full max-w-[280px] rounded-md bg-white p-3" />
            <p className="mt-4 text-sm text-muted-foreground">{t("scanPrompt")}</p>
          </section>
        </div>
      </div>
    </main>
  );
}
