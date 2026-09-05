import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BarChart3, CalendarPlus, CheckCircle2, CircleDashed, Edit3, ExternalLink, Heart, LayoutGrid, LogOut, Plus, Search, Users } from "lucide-react";
import { auth, signOut } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { SendEmailsDialog } from "@/components/dashboard/send-emails-dialog";
import { InvitationActions } from "@/components/dashboard/invitation-actions";
import { LifetimeBilling } from "@/components/dashboard/lifetime-billing";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { localePath } from "@/lib/i18n";
import { getLifetimeBillingStatus } from "@/lib/publishing";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: { absolute: t("metadataTitle") }, description: t("metadataDescription") };
}

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatAmount(amountCents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amountCents / 100);
}

function paymentStatusKey(status: string) {
  if (status === "paid" || status === "succeeded") return "paid";
  if (status === "failed") return "failed";
  if (status === "refunded") return "refunded";
  return "pending";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("dashboard")]);
  const session = await auth();
  if (!session?.user?.id) {
    redirect(localePath(locale, "/login"));
  }
  const params = searchParams ? await searchParams : {};
  const firstName = session.user.name?.split(" ")[0] ?? t("fallbackName");
  const paymentState = firstParam(params.payment);
  const purchaseType = firstParam(params.purchase);
  const requestedStatus = firstParam(params.status);
  const status = requestedStatus === "published" || requestedStatus === "draft" ? requestedStatus : "all";
  const query = (firstParam(params.q) ?? "").trim().slice(0, 100);
  const invitationWhere = {
    userId: session.user.id,
    ...(status === "all" ? {} : { status }),
    ...(query ? { title: { contains: query, mode: "insensitive" as const } } : {}),
  };

  const [invitations, allInvitations, payments, billing] = await Promise.all([
    prisma.invitation.findMany({
      where: invitationWhere,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { rsvps: true } } },
    }),
    prisma.invitation.findMany({
      where: { userId: session.user.id },
      select: { status: true, viewCount: true, _count: { select: { rsvps: true } } },
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { invitation: { select: { id: true, title: true, slug: true } } },
    }),
    getLifetimeBillingStatus(session.user.id),
  ]);

  const publishedCount = allInvitations.filter((invitation) => invitation.status === "published").length;
  const guestCount = allInvitations.reduce((total, invitation) => total + invitation._count.rsvps, 0);
  const viewCount = allInvitations.reduce((total, invitation) => total + invitation.viewCount, 0);
  const hasFilters = status !== "all" || query.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href={localePath(locale)} className="flex items-center gap-2.5 text-lg font-semibold tracking-tight group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-foreground text-white transition-transform group-hover:scale-105">
              <Heart className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">{t("brand")}</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline truncate max-w-[200px]">{session.user.email}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: localePath(locale) }); }}>
              <Button variant="ghost" size="icon" type="submit" aria-label={t("signOut")} title={t("signOut")} className="rounded-full">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="flex flex-col justify-between gap-6 pb-10 sm:flex-row sm:items-end">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/30 border border-accent-foreground/20 text-sm font-medium text-accent-foreground">
              <Heart className="h-4 w-4" aria-hidden="true" />
              {t("studioEyebrow")}
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">{t("greeting", { name: firstName })}</h1>
            <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Link href={localePath(locale, "/create")} className={buttonVariants({ size: "lg", className: "rounded-full shadow-lg shadow-primary/20" })}>
            <Plus className="h-5 w-5" aria-hidden="true" /> {t("createInvitation")}
          </Link>
        </div>

        {paymentState === "success" ? (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950" role="status">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" /> {purchaseType === "lifetime" ? t("paymentSuccessLifetime") : t("paymentSuccessSingle")}
          </div>
        ) : null}
        {paymentState === "cancelled" ? (
          <div className="mt-6 rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground" role="status">{t("paymentCancelled")}</div>
        ) : null}

        <div className="pt-8">
          <LifetimeBilling {...billing} />
        </div>

        <section className="grid gap-6 py-10 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("overviewLabel")}>
          {[
            { label: t("stats.totalInvitations"), value: allInvitations.length, icon: LayoutGrid, gradient: "from-blue-500/10 to-blue-600/10", iconColor: "text-blue-600" },
            { label: t("stats.published"), value: publishedCount, icon: CalendarPlus, gradient: "from-primary/10 to-accent-foreground/10", iconColor: "text-primary" },
            { label: t("stats.guestResponses"), value: guestCount, icon: Users, gradient: "from-purple-500/10 to-purple-600/10", iconColor: "text-purple-600" },
            { label: t("stats.totalViews"), value: viewCount, icon: BarChart3, gradient: "from-emerald-500/10 to-emerald-600/10", iconColor: "text-emerald-600" },
          ].map(({ label, value, icon: Icon, gradient, iconColor }) => (
            <div key={label} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500`} />
              <div className="relative flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} border border-current/10 ${iconColor}`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-3xl font-semibold tracking-tight">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <form method="get" className="mb-8 rounded-2xl border border-border bg-card/50 backdrop-blur p-6 shadow-sm" aria-label={t("filters.label")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <label htmlFor="dashboard-search" className="text-sm font-semibold">{t("filters.search")}</label>
              <Input id="dashboard-search" name="q" defaultValue={query} placeholder={t("filters.searchPlaceholder")} maxLength={100} className="rounded-lg" />
            </div>
            <div className="w-full space-y-2 sm:w-48">
              <label htmlFor="dashboard-status" className="text-sm font-semibold">{t("filters.status")}</label>
              <Select id="dashboard-status" name="status" defaultValue={status} className="rounded-lg">
                <option value="all">{t("filters.all")}</option>
                <option value="published">{t("filters.published")}</option>
                <option value="draft">{t("filters.draft")}</option>
              </Select>
            </div>
            <Button type="submit" variant="secondary" className="rounded-lg"><Search className="h-4 w-4" aria-hidden="true" /> {t("filters.submit")}</Button>
            {hasFilters ? <Link href={localePath(locale, "/dashboard")} className={buttonVariants({ variant: "ghost", className: "rounded-lg" })}>{t("filters.clear")}</Link> : null}
          </div>
        </form>

        <section className="space-y-4" aria-labelledby="invitations-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 id="invitations-heading" className="text-xl font-semibold">{t("invitations.heading")}</h2>
            {invitations.length > 0 ? <Link href={localePath(locale, "/create")} className="text-sm font-medium underline-offset-4 hover:underline">{t("invitations.createAnother")}</Link> : null}
          </div>
          {invitations.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
              <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary"><Heart className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="text-xl font-semibold">{hasFilters ? t("invitations.noMatchingTitle") : t("invitations.firstTitle")}</h3>
              <p className="mt-2 max-w-md text-base text-muted-foreground">{hasFilters ? t("invitations.noMatchingDescription") : t("invitations.firstDescription")}</p>
              {hasFilters ? <Link href={localePath(locale, "/dashboard")} className={buttonVariants({ variant: "outline", className: "mt-6" })}>{t("invitations.showAll")}</Link> : <Link href={localePath(locale, "/create")} className={buttonVariants({ variant: "outline", className: "mt-6" })}>{t("invitations.exploreTemplates")} <Plus className="h-4 w-4" /></Link>}
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => {
                const isPublished = invitation.status === "published";
                return (
                  <article key={invitation.id} className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {isPublished ? <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" /> : <CircleDashed className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                        <h3 className="truncate text-lg font-semibold">{invitation.title}</h3>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">{isPublished ? t("invitations.status.published") : t("invitations.status.draft")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{isPublished
                        ? t("invitations.publishedMeta", { path: localePath(locale, `/i/${invitation.slug}`), views: invitation.viewCount, responses: invitation._count.rsvps })
                        : t("invitations.draftMeta", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(invitation.updatedAt) })}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={localePath(locale, `/editor/${invitation.id}`)} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit3 className="h-4 w-4" aria-hidden="true" /> {t("invitations.edit")}</Link>
                      {isPublished ? <>
                        <Link href={localePath(locale, `/dashboard/invitations/${invitation.id}/share`)} className={buttonVariants({ variant: "secondary", size: "sm" })}><ExternalLink className="h-4 w-4" aria-hidden="true" /> {t("invitations.share")}</Link>
                        <SendEmailsDialog invitationId={invitation.id} invitationTitle={invitation.title} />
                        <Link href={localePath(locale, `/dashboard/invitations/${invitation.id}/rsvps`)} className={buttonVariants({ variant: "outline", size: "sm" })}><Users className="h-4 w-4" aria-hidden="true" /> {t("invitations.responses")}</Link>
                      </> : null}
                      <InvitationActions invitationId={invitation.id} invitationTitle={invitation.title} />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {payments.length > 0 ? (
          <section className="mt-10 space-y-4" aria-labelledby="payments-heading">
            <div className="flex items-center justify-between gap-4">
              <h2 id="payments-heading" className="text-xl font-semibold">{t("payments.heading")}</h2>
              <Link href="/api/payment/history" className="text-sm font-medium underline-offset-4 hover:underline">{t("payments.viewApiData")}</Link>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 font-medium">{t("payments.product")}</th><th className="px-5 py-3 font-medium">{t("payments.amount")}</th><th className="px-5 py-3 font-medium">{t("payments.status")}</th><th className="px-5 py-3 font-medium">{t("payments.date")}</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {payments.map((payment) => <tr key={payment.id}><td className="px-5 py-4 font-medium">{payment.purchaseType === "lifetime" ? t("payments.lifetime") : payment.invitation?.title ?? t("payments.singlePublish")}</td><td className="px-5 py-4">{formatAmount(payment.amountCents, payment.currency, locale)}</td><td className="px-5 py-4">{t(`payments.statuses.${paymentStatusKey(payment.status)}`)}</td><td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(payment.createdAt)}</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
