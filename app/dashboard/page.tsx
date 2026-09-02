import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, CheckCircle2, CircleDashed, Edit3, ExternalLink, FileText, LogOut, Plus, Sparkles, Users } from "lucide-react";
import { auth, signOut } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { SendEmailsDialog } from "@/components/dashboard/send-emails-dialog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Carte",
  description: "Manage your Carte invitations.",
};

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatAmount(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100);
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const paymentState = firstParam(searchParams ? (await searchParams).payment : undefined);

  const [invitations, payments] = await Promise.all([
    prisma.invitation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { rsvps: true } } },
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { invitation: { select: { id: true, title: true, slug: true } } },
    }),
  ]);

  const publishedCount = invitations.filter((invitation) => invitation.status === "published").length;
  const guestCount = invitations.reduce((total, invitation) => total + invitation._count.rsvps, 0);

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-wide">
            <Sparkles className="h-5 w-5" aria-hidden="true" /> Carte
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{session.user.email ?? "Guest preview"}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <Button variant="ghost" size="icon" type="submit" aria-label="Sign out" title="Sign out">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-col justify-between gap-5 border-b border-border pb-8 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">Your studio</p>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">Good morning, {firstName}.</h1>
            <p className="text-base text-muted-foreground">Bring your next gathering to life.</p>
          </div>
          <Link href="/create" className={buttonVariants({ size: "lg" })}>
            <Plus className="h-5 w-5" aria-hidden="true" /> Create invitation
          </Link>
        </div>

        {paymentState === "success" ? (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950" role="status">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" /> Payment received. Your invitation is now published.
          </div>
        ) : null}

        <section className="grid gap-4 py-8 sm:grid-cols-3" aria-label="Invitation overview">
          {[
            { label: "Drafts", value: invitations.filter((invitation) => invitation.status === "draft").length, icon: FileText },
            { label: "Published", value: publishedCount, icon: CalendarPlus },
            { label: "Guest responses", value: guestCount, icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-foreground"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <div><p className="text-2xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
            </div>
          ))}
        </section>

        <section className="space-y-4" aria-labelledby="invitations-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 id="invitations-heading" className="text-xl font-semibold">Your invitations</h2>
            {invitations.length > 0 ? <Link href="/create" className="text-sm font-medium underline-offset-4 hover:underline">Create another</Link> : null}
          </div>
          {invitations.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
              <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary"><Sparkles className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="text-xl font-semibold">Your first invitation starts here</h3>
              <p className="mt-2 max-w-md text-base text-muted-foreground">Choose a scene and let Carte help you shape the details, words, and atmosphere.</p>
              <Link href="/create" className={buttonVariants({ variant: "outline", className: "mt-6" })}>Explore templates <Plus className="h-4 w-4" /></Link>
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
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">{invitation.status}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{isPublished ? `/i/${invitation.slug} · ${invitation.viewCount} views · ${invitation._count.rsvps} responses` : `Last edited ${invitation.updatedAt.toLocaleDateString("en")}`}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/editor/${invitation.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit3 className="h-4 w-4" aria-hidden="true" /> Edit</Link>
                      {isPublished ? <>
                        <Link href={`/dashboard/invitations/${invitation.id}/share`} className={buttonVariants({ variant: "secondary", size: "sm" })}><ExternalLink className="h-4 w-4" aria-hidden="true" /> Share</Link>
                        <SendEmailsDialog invitationId={invitation.id} invitationTitle={invitation.title} />
                        <Link href={`/dashboard/invitations/${invitation.id}/rsvps`} className={buttonVariants({ variant: "outline", size: "sm" })}><Users className="h-4 w-4" aria-hidden="true" /> Responses</Link>
                      </> : null}
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
              <h2 id="payments-heading" className="text-xl font-semibold">Payment history</h2>
              <Link href="/api/payment/history" className="text-sm font-medium underline-offset-4 hover:underline">View API data</Link>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Invitation</th><th className="px-5 py-3 font-medium">Amount</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Date</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {payments.map((payment) => <tr key={payment.id}><td className="px-5 py-4 font-medium">{payment.invitation?.title ?? "Invitation"}</td><td className="px-5 py-4">{formatAmount(payment.amountCents, payment.currency)}</td><td className="px-5 py-4 capitalize">{payment.status}</td><td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{payment.createdAt.toLocaleDateString("en")}</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
