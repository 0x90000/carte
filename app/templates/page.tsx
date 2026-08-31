import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";

export default async function TemplatesPage() {
  const session = await auth();
  const studioHref = session?.user ? "/dashboard" : "/login";
  const backHref = session?.user ? "/dashboard" : "/create";

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-wide"><Sparkles className="h-5 w-5" aria-hidden="true" /> Carte</Link>
          <Link href={studioHref} className={buttonVariants({ variant: "ghost", size: "sm" })}>{session?.user ? "Dashboard" : "Sign in"}</Link>
        </div>
      </header>
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm"><Sparkles className="h-6 w-6" aria-hidden="true" /></span>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Template library</p>
        <h1 className="mt-3 text-3xl font-semibold">A considered starting point is on its way.</h1>
        <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">The first collection of wedding, birthday, and business templates will be ready in the next stage.</p>
        <Link href={backHref} className={buttonVariants({ variant: "outline", className: "mt-7" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> {session?.user ? "Back to dashboard" : "Back to scenes"}</Link>
      </section>
    </main>
  );
}
