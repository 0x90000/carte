import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Palette, Send, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";

const steps = [
  { icon: Sparkles, title: "Start with a feeling", body: "Tell us what you are gathering for and the atmosphere you want to create." },
  { icon: Palette, title: "Make it yours", body: "Shape the details, words, and visual rhythm until it feels unmistakably you." },
  { icon: Send, title: "Share the moment", body: "Send one beautiful link to every guest and keep the conversation together." },
];

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <header className="border-b border-border/70">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-wide"><Sparkles className="h-5 w-5" aria-hidden="true" /> Carte</Link>
          <nav className="flex items-center gap-2" aria-label="Main navigation"><Link href={session?.user ? "/dashboard" : "/login"} className={buttonVariants({ variant: "ghost", size: "sm" })}>{session?.user ? "Dashboard" : "Sign in"}</Link><Link href="/create" className={buttonVariants({ size: "sm" })}>Start creating <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20 lg:px-8 lg:pb-24">
        <div className="max-w-2xl space-y-8">
          <p className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" /> Digital invitations with intention</p>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-normal sm:text-5xl lg:text-6xl">Make room for the moments that matter.</h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">Carte helps you create a considered invitation in minutes, then share it with everyone who makes the moment meaningful.</p>
          <div className="flex flex-col gap-3 sm:flex-row"><Link href="/create" className={buttonVariants({ size: "lg" })}>Create your invitation <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link><Link href="#how-it-works" className={buttonVariants({ variant: "outline", size: "lg" })}>See how it works</Link></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">{["AI-assisted copy", "Beautiful on every screen", "One shareable link"].map((item) => <span key={item} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" aria-hidden="true" />{item}</span>)}</div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-label="Invitation preview">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-secondary p-4 shadow-xl sm:p-6"><div className="flex h-full flex-col justify-between rounded-xl border border-foreground/10 bg-background p-6 sm:p-8"><div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground"><span>Carte</span><CalendarDays className="h-4 w-4" aria-hidden="true" /></div><div className="space-y-5"><p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Save the date</p><h2 className="text-4xl font-semibold leading-tight sm:text-5xl">A summer evening together</h2><div className="h-px w-16 bg-primary" /><p className="text-base leading-7 text-muted-foreground">Saturday, 14 June 2026<br />The Glasshouse, London</p></div><div className="flex items-center justify-between border-t border-border pt-5 text-sm"><span className="font-medium">Maya &amp; Alex</span><span className="text-muted-foreground">You are invited</span></div></div></div>
          <div className="absolute -bottom-5 -left-3 hidden rounded-lg border border-border bg-card px-4 py-3 shadow-md sm:block"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Your story, beautifully told</p></div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-secondary/40"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="mb-10 max-w-xl space-y-3"><p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">How it works</p><h2 className="text-3xl font-semibold">A little help for a big feeling.</h2></div><div className="grid gap-8 md:grid-cols-3">{steps.map(({ icon: Icon, title, body }, index) => <div key={title} className="space-y-4"><span className="flex h-11 w-11 items-center justify-center rounded-md bg-background shadow-sm"><Icon className="h-5 w-5" aria-hidden="true" /></span><p className="text-sm font-medium text-muted-foreground">0{index + 1}</p><h3 className="text-xl font-semibold">{title}</h3><p className="text-base leading-7 text-muted-foreground">{body}</p></div>)}</div></div></section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span className="font-medium text-foreground">Carte</span><span>Invitations with intention.</span></footer>
    </main>
  );
}
