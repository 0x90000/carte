import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, Users } from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

type RSVPPageProps = { params: Promise<{ id: string }> };

export default async function RSVPPage({ params }: RSVPPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
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

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Dashboard</Link>
          <a href={`/api/invitations/${invitation.id}/rsvps/export`} className={buttonVariants({ variant: "outline", size: "sm" })}><Download className="h-4 w-4" aria-hidden="true" /> Export CSV</a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">RSVP responses</p>
          <h1 className="text-3xl font-semibold">{invitation.title}</h1>
          <p className="text-sm text-muted-foreground">carte.app/i/{invitation.slug}</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-4" aria-label="RSVP summary">
          {[
            ["Responses", invitation.rsvps.length],
            ["Attending", attending.length],
            ["Party size", totalPartySize],
            ["Maybe / declined", maybe.length + declined.length],
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
              <h2 className="mt-4 text-lg font-semibold">No responses yet</h2>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-5 py-3 font-medium">Guest</th><th className="px-5 py-3 font-medium">Contact</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Party</th><th className="px-5 py-3 font-medium">Message</th><th className="px-5 py-3 font-medium">Submitted</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invitation.rsvps.map((rsvp) => (
                    <tr key={rsvp.id}>
                      <td className="px-5 py-4 font-medium">{rsvp.guestName}</td>
                      <td className="px-5 py-4 text-muted-foreground">{[rsvp.guestEmail, rsvp.guestPhone].filter(Boolean).join(" / ") || "-"}</td>
                      <td className="px-5 py-4 capitalize">{rsvp.status}</td>
                      <td className="px-5 py-4">{rsvp.partySize}</td>
                      <td className="max-w-xs px-5 py-4 text-muted-foreground">{[rsvp.dietaryPreferences, rsvp.message].filter(Boolean).join(" · ") || "-"}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{rsvp.createdAt.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</td>
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
