import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, Users } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { localePath } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

type RSVPPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rsvpDashboard");
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function RSVPPage({ params }: RSVPPageProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("rsvpDashboard")]);
  const session = await auth();
  if (!session?.user?.id) {
    redirect(localePath(locale, "/login"));
  }

  const { id } = await params;
  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      slug: true,
      rsvps: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!invitation) {
    notFound();
  }

  const attending = invitation.rsvps.filter((rsvp) => rsvp.status === "attending");
  const declined = invitation.rsvps.filter((rsvp) => rsvp.status === "declined");
  const maybe = invitation.rsvps.filter((rsvp) => rsvp.status === "maybe");
  const totalPartySize = attending.reduce((total, rsvp) => total + rsvp.partySize, 0);
  const statusLabels: Record<string, string> = {
    attending: t("statuses.attending"),
    declined: t("statuses.declined"),
    maybe: t("statuses.maybe"),
  };

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href={localePath(locale, "/dashboard")} className="inline-flex items-center gap-2 text-sm font-medium"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("backDashboard")}</Link>
          <a href={`/api/invitations/${invitation.id}/rsvps/export`} className={buttonVariants({ variant: "outline", size: "sm" })}><Download className="h-4 w-4" aria-hidden="true" /> {t("exportCsv")}</a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">{t("eyebrow")}</p>
          <h1 className="text-3xl font-semibold">{invitation.title}</h1>
          <p className="text-sm text-muted-foreground">carte.app/i/{invitation.slug}</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-4" aria-label={t("summaryLabel")}>
          {[
            [t("summary.responses"), invitation.rsvps.length],
            [t("summary.attending"), attending.length],
            [t("summary.partySize"), totalPartySize],
            [t("summary.maybeDeclined"), maybe.length + declined.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {invitation.rsvps.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
              <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold">{t("noResponses")}</h2>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-5 py-3 font-medium">{t("table.guest")}</th><th className="px-5 py-3 font-medium">{t("table.contact")}</th><th className="px-5 py-3 font-medium">{t("table.status")}</th><th className="px-5 py-3 font-medium">{t("table.party")}</th><th className="px-5 py-3 font-medium">{t("table.message")}</th><th className="px-5 py-3 font-medium">{t("table.submitted")}</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invitation.rsvps.map((rsvp) => (
                    <tr key={rsvp.id}>
                      <td className="px-5 py-4 font-medium">{rsvp.guestName}</td>
                      <td className="px-5 py-4 text-muted-foreground">{[rsvp.guestEmail, rsvp.guestPhone].filter(Boolean).join(" / ") || t("noContact")}</td>
                      <td className="px-5 py-4">{statusLabels[rsvp.status] ?? rsvp.status}</td>
                      <td className="px-5 py-4">{rsvp.partySize}</td>
                      <td className="max-w-xs px-5 py-4 text-muted-foreground">{[rsvp.dietaryPreferences, rsvp.message].filter(Boolean).join(" · ") || t("noMessage")}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(rsvp.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
