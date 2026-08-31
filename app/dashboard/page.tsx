import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, FileText, LogOut, Plus, Sparkles, Users } from "lucide-react";
import { auth, signOut } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dashboard | Carte",
  description: "Manage your Carte invitations.",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-wide">
            <Sparkles className="h-5 w-5" aria-hidden="true" /> Carte
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{session?.user?.email ?? "Guest preview"}</span>
            {session ? (
              <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                <Button variant="ghost" size="icon" type="submit" aria-label="Sign out" title="Sign out">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </Button>
              </form>
            ) : null}
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

        <section className="grid gap-4 py-8 sm:grid-cols-3" aria-label="Invitation overview">
          {[
            { label: "Drafts", value: "0", icon: FileText },
            { label: "Published", value: "0", icon: CalendarPlus },
            { label: "Guests attending", value: "0", icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-foreground"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <div><p className="text-2xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
            </div>
          ))}
        </section>

        <section className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
          <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary"><Sparkles className="h-6 w-6" aria-hidden="true" /></span>
          <h2 className="text-xl font-semibold">Your first invitation starts here</h2>
          <p className="mt-2 max-w-md text-base text-muted-foreground">Choose a scene and let Carte help you shape the details, words, and atmosphere.</p>
          <Link href="/create" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
            Explore templates <Plus className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}
