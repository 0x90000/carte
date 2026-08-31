import Link from "next/link";
import { Briefcase, Cake, Heart, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const scenes = [
  {
    id: "wedding",
    name: "Wedding",
    description: "Celebrate your love story with those who matter most.",
    icon: Heart,
    examples: ["Engagement", "Ceremony", "Reception"],
    iconClassName: "bg-rose-100 text-rose-700",
  },
  {
    id: "birthday",
    name: "Birthday",
    description: "Mark another year with the people who make it bright.",
    icon: Cake,
    examples: ["Milestone", "Surprise", "Kids party"],
    iconClassName: "bg-amber-100 text-amber-700",
  },
  {
    id: "business",
    name: "Business event",
    description: "Gather for growth, connection, and shared purpose.",
    icon: Briefcase,
    examples: ["Conference", "Launch", "Networking"],
    iconClassName: "bg-sky-100 text-sky-700",
  },
  {
    id: "other",
    name: "Other gathering",
    description: "Any moment worth coming together for.",
    icon: Sparkles,
    examples: ["Baby shower", "Graduation", "Housewarming"],
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
];

export default async function CreatePage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-wide">
            <Sparkles className="h-5 w-5" aria-hidden="true" /> Carte
          </Link>
          <Link
            href={session?.user ? "/dashboard" : "/login"}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {session?.user ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-12 max-w-2xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Start with a feeling</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">What are you celebrating?</h1>
          <p className="text-lg leading-8 text-muted-foreground">Choose the moment you&apos;re making room for.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {scenes.map(({ id, name, description, icon: Icon, examples, iconClassName }) => (
            <Link key={id} href={`/templates?scene=${id}`} className="group">
              <Card className="h-full transition-transform duration-150 group-hover:-translate-y-1 group-hover:shadow-lg">
                <CardContent className="flex h-full flex-col gap-5 p-6">
                  <span className={`flex h-14 w-14 items-center justify-center rounded-full ${iconClassName}`}>
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold capitalize">{name}</h2>
                    <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {examples.map((example) => (
                      <span key={example} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                        {example}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          No account needed to start. We&apos;ll ask when you&apos;re ready to publish.
        </p>
      </section>
    </main>
  );
}
