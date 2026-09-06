import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, ExternalLink, Heart, Link2, MessageSquare, QrCode, Share2 } from "lucide-react";
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
    select: { id: true, title: true, slug: true, status: true, _count: { select: { rsvps: true } }, viewCount: true },
  });
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const t = await getTranslations("share");
  const session = await auth();
  if (!session?.user?.id) {
    return { title: { absolute: t("metadataTitle") }, description: t("metadataDescription") };
  }
  const { id } = await params;
  const invitation = await findInvitation(id, session.user.id);
  return {
    title: { absolute: invitation ? t("metadataInvitationTitle", { title: invitation.title }) : t("metadataTitle") },
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
    width: 400,
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6 lg:px-8">
          <Link href={localePath(locale, "/dashboard")} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t("backDashboard")}
          </Link>
          <Link
            href={localePath(locale, `/i/${encodeURIComponent(invitation.slug)}`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" })}
          >
            <ExternalLink className="h-4 w-4" />
            {t("openInvitation")}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
        {/* Hero Section */}
        <div className="mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700">
            <Check className="h-4 w-4" />
            {t("published")}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {invitation.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <ExternalLink className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-semibold">{invitation.viewCount}</div>
            <div className="text-sm text-muted-foreground mt-1">{t("viewCount")}</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-semibold">{invitation._count.rsvps}</div>
            <div className="text-sm text-muted-foreground mt-1">{t("guestCount")}</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                <Share2 className="h-5 w-5 text-violet-600" />
              </div>
            </div>
            <div className="text-3xl font-semibold">
              {invitation.viewCount > 0 ? Math.round((invitation._count.rsvps / invitation.viewCount) * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">{t("responseRate")}</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Share Link Section */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card/50 backdrop-blur p-8" aria-labelledby="share-link-heading">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent-foreground/10 border border-primary/20">
                  <Link2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 id="share-link-heading" className="text-xl font-semibold">{t("publicLink")}</h2>
                  <p className="text-sm text-muted-foreground">{t("sharePrompt")}</p>
                </div>
              </div>

              <div className="rounded-xl border-2 border-border bg-secondary/50 px-4 py-4 mb-4">
                <p className="break-all font-mono text-sm text-foreground">{publicUrl}</p>
              </div>

              <ShareLinkActions publicUrl={publicUrl} title={invitation.title} />
            </section>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href={localePath(locale, `/dashboard/invitations/${id}/rsvps`)}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                  </div>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="font-semibold mb-1">{t("rsvpsLink")}</h3>
                <p className="text-sm text-muted-foreground">{t("rsvpsDescription")}</p>
              </Link>

              <Link
                href={localePath(locale, `/editor/${id}`)}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <Heart className="h-5 w-5 text-blue-600" />
                  </div>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="font-semibold mb-1">{t("editLink")}</h3>
                <p className="text-sm text-muted-foreground">{t("editDescription")}</p>
              </Link>
            </div>
          </div>

          {/* QR Code Section */}
          <section className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-8 text-center" aria-labelledby="qr-heading">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                <QrCode className="h-6 w-6 text-violet-600" />
              </div>
              <div className="text-left">
                <h2 id="qr-heading" className="text-xl font-semibold">{t("qrCode")}</h2>
                <p className="text-sm text-muted-foreground">{t("qrCodeDescription")}</p>
              </div>
            </div>

            <div className="mx-auto mb-6 aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border-2 border-border bg-white p-4 shadow-lg">
              <Image
                src={qrDataUrl}
                alt={t("qrAlt", { title: invitation.title })}
                width={400}
                height={400}
                unoptimized
                className="h-full w-full"
              />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("scanPrompt")}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
