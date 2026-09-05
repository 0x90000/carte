import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  CircleDashed,
  Edit3,
  ExternalLink,
  Eye,
  Filter,
  Heart,
  LayoutGrid,
  LogOut,
  Mail,
  MoreVertical,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
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
  const [locale, t, common] = await Promise.all([getLocale(), getTranslations("dashboard"), getTranslations("common")]);
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
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Modern App Shell Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
          {/* Logo + Navigation */}
          <div className="flex items-center gap-6">
            <Link href={localePath(locale)} className="flex items-center gap-2.5 text-lg font-semibold tracking-tight group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-foreground text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <Heart className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Carte
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
              <Link
                href={localePath(locale, "/dashboard")}
                className="rounded-lg px-3 py-2 text-sm font-medium bg-secondary/50 text-foreground"
              >
                {common("dashboard")}
              </Link>
              <Link
                href={localePath(locale, "/templates")}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
              >
                {t("studioEyebrow")}
              </Link>
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-secondary/50 px-3 py-1.5 md:flex">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center text-xs font-semibold text-white">
                {firstName[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium truncate max-w-[150px]">{firstName}</span>
            </div>

            <Link
              href={localePath(locale, "/dashboard/settings")}
              className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-full" })}
              aria-label={t("settings", { defaultValue: "Settings" })}
              title={t("settings", { defaultValue: "Settings" })}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </Link>

            <form action={async () => { "use server"; await signOut({ redirectTo: localePath(locale) }); }}>
              <Button variant="ghost" size="icon" type="submit" className="rounded-full" aria-label={t("signOut")} title={t("signOut")}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-12">
        {/* Hero Section */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
              {t("greeting", { name: firstName })}
            </h1>
            <p className="text-base text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          <Link
            href={localePath(locale, "/create")}
            className={buttonVariants({ size: "lg", className: "rounded-full shadow-lg shadow-primary/20 group" })}
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            {t("createInvitation")}
          </Link>
        </div>

        {/* Payment Success Banner */}
        {paymentState === "success" ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4" role="status">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-emerald-900">
                {purchaseType === "lifetime" ? t("paymentSuccessLifetime") : t("paymentSuccessSingle")}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -mr-2">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        {paymentState === "cancelled" ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-border bg-card p-4" role="status">
            <CircleDashed className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
            <p className="flex-1 text-sm text-muted-foreground">{t("paymentCancelled")}</p>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -mr-2">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        {/* Lifetime Billing */}
        <div className="mb-8">
          <LifetimeBilling {...billing} />
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: t("stats.totalInvitations"),
              value: allInvitations.length,
              icon: LayoutGrid,
              gradient: "from-violet-500/10 via-purple-500/10 to-fuchsia-500/10",
              iconBg: "from-violet-500/20 to-purple-500/20",
              iconColor: "text-violet-600",
              trend: "+12%",
            },
            {
              label: t("stats.published"),
              value: publishedCount,
              icon: CalendarPlus,
              gradient: "from-blue-500/10 via-cyan-500/10 to-teal-500/10",
              iconBg: "from-blue-500/20 to-cyan-500/20",
              iconColor: "text-blue-600",
              trend: "+5%",
            },
            {
              label: t("stats.guestResponses"),
              value: guestCount,
              icon: Users,
              gradient: "from-amber-500/10 via-orange-500/10 to-red-500/10",
              iconBg: "from-amber-500/20 to-orange-500/20",
              iconColor: "text-amber-600",
              trend: "+18%",
            },
            {
              label: t("stats.totalViews"),
              value: viewCount,
              icon: Eye,
              gradient: "from-emerald-500/10 via-teal-500/10 to-cyan-500/10",
              iconBg: "from-emerald-500/20 to-teal-500/20",
              iconColor: "text-emerald-600",
              trend: "+24%",
            },
          ].map(({ label, value, icon: Icon, gradient, iconBg, iconColor, trend }) => (
            <div
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity group-hover:opacity-100`} />

              {/* Content */}
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${iconBg} border border-current/10 ${iconColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    {trend}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-semibold tracking-tight">{value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <form method="get" className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card/50 backdrop-blur p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder={t("filters.searchPlaceholder")}
              maxLength={100}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select name="status" defaultValue={status} className="w-[150px]">
              <option value="all">{t("filters.all")}</option>
              <option value="published">{t("filters.published")}</option>
              <option value="draft">{t("filters.draft")}</option>
            </Select>

            <Button type="submit" variant="secondary" size="icon" className="rounded-full">
              <Filter className="h-4 w-4" />
            </Button>

            {hasFilters ? (
              <Link href={localePath(locale, "/dashboard")} className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-full" })}>
                <X className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </form>

        {/* Invitations List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("invitations.heading")}</h2>
            {invitations.length > 0 && (
              <Link
                href={localePath(locale, "/templates")}
                className="text-sm font-medium text-primary hover:underline underline-offset-4"
              >
                {t("studioEyebrow")}
              </Link>
            )}
          </div>

          {invitations.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/30 backdrop-blur px-6 py-16 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent-foreground/10 border border-primary/20">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                {hasFilters ? t("invitations.noMatchingTitle") : t("invitations.firstTitle")}
              </h3>
              <p className="mb-8 max-w-md text-base text-muted-foreground">
                {hasFilters ? t("invitations.noMatchingDescription") : t("invitations.firstDescription")}
              </p>
              {hasFilters ? (
                <Link href={localePath(locale, "/dashboard")} className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
                  {t("invitations.showAll")}
                </Link>
              ) : (
                <Link href={localePath(locale, "/create")} className={buttonVariants({ className: "rounded-full group" })}>
                  {t("invitations.exploreTemplates")}
                  <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {invitations.map((invitation) => {
                const isPublished = invitation.status === "published";
                return (
                  <article
                    key={invitation.id}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg hover:-translate-y-1"
                  >
                    {/* Card Header/Preview */}
                    <div className="aspect-[16/10] bg-gradient-to-br from-secondary to-secondary/50 p-6">
                      <div className="flex items-start justify-between">
                        <div className={`rounded-full px-3 py-1 text-xs font-medium ${isPublished ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground"}`}>
                          {isPublished ? t("invitations.status.published") : t("invitations.status.draft")}
                        </div>
                        <button className="rounded-lg p-1.5 hover:bg-background/50 transition-colors">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      <h3 className="mb-2 text-lg font-semibold line-clamp-1">{invitation.title}</h3>

                      {isPublished ? (
                        <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {invitation.viewCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {invitation._count.rsvps}
                          </div>
                        </div>
                      ) : (
                        <p className="mb-4 text-sm text-muted-foreground">
                          {t("invitations.draftMeta", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(invitation.updatedAt) })}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={localePath(locale, `/editor/${invitation.id}`)}
                          className={buttonVariants({ variant: "outline", size: "sm", className: "flex-1" })}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          {t("invitations.edit")}
                        </Link>

                        {isPublished && (
                          <Link
                            href={localePath(locale, `/dashboard/invitations/${invitation.id}/share`)}
                            className={buttonVariants({ size: "sm", className: "flex-1" })}
                          >
                            <Send className="h-3.5 w-3.5" />
                            {t("invitations.share")}
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Payments Section */}
        {payments.length > 0 ? (
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("payments.heading")}</h2>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-secondary/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("payments.product")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("payments.amount")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("payments.status")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("payments.date")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4 font-medium">
                          {payment.purchaseType === "lifetime"
                            ? t("payments.lifetime")
                            : payment.invitation?.title ?? t("payments.singlePublish")}
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          {formatAmount(payment.amountCents, payment.currency, locale)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            paymentStatusKey(payment.status) === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {t(`payments.statuses.${paymentStatusKey(payment.status)}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(payment.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
