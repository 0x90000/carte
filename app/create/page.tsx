import Link from "next/link";
import { Briefcase, Cake, GraduationCap, Heart, Home, PartyPopper, Sparkles } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { localePath } from "@/lib/i18n";

const scenes = [
  {
    id: "wedding",
    nameKey: "wedding",
    icon: Heart,
    gradient: "from-rose-500/10 via-pink-500/10 to-red-500/10",
    iconBg: "from-rose-500 to-pink-500",
    textColor: "text-rose-600",
  },
  {
    id: "birthday",
    nameKey: "birthday",
    icon: Cake,
    gradient: "from-amber-500/10 via-orange-500/10 to-yellow-500/10",
    iconBg: "from-amber-500 to-orange-500",
    textColor: "text-amber-600",
  },
  {
    id: "business",
    nameKey: "business",
    icon: Briefcase,
    gradient: "from-blue-500/10 via-cyan-500/10 to-sky-500/10",
    iconBg: "from-blue-500 to-cyan-500",
    textColor: "text-blue-600",
  },
  {
    id: "graduation",
    nameKey: "graduation",
    icon: GraduationCap,
    gradient: "from-purple-500/10 via-violet-500/10 to-indigo-500/10",
    iconBg: "from-purple-500 to-violet-500",
    textColor: "text-purple-600",
  },
  {
    id: "housewarming",
    nameKey: "housewarming",
    icon: Home,
    gradient: "from-emerald-500/10 via-teal-500/10 to-green-500/10",
    iconBg: "from-emerald-500 to-teal-500",
    textColor: "text-emerald-600",
  },
  {
    id: "other",
    nameKey: "other",
    icon: PartyPopper,
    gradient: "from-fuchsia-500/10 via-pink-500/10 to-rose-500/10",
    iconBg: "from-fuchsia-500 to-pink-500",
    textColor: "text-fuchsia-600",
  },
];

export default async function CreatePage() {
  const [session, locale, t, common] = await Promise.all([
    auth(),
    getLocale(),
    getTranslations("create"),
    getTranslations("common"),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href={localePath(locale)} className="flex items-center gap-2.5 text-lg font-semibold tracking-tight group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-foreground text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <Heart className="h-4 w-4" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Carte
            </span>
          </Link>
          <Link
            href={localePath(locale, session?.user ? "/dashboard" : "/login")}
            className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-full" })}
          >
            {session?.user ? common("dashboard") : common("signIn")}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="mb-16 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/30 border border-accent-foreground/20 px-4 py-2 text-sm font-medium text-accent-foreground">
            <Sparkles className="h-4 w-4" />
            {t("eyebrow")}
          </div>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            {t("title")}
          </h1>
          <p className="text-xl leading-relaxed text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {/* Scene Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {scenes.map(({ id, nameKey, icon: Icon, gradient, iconBg, textColor }) => {
            const scene = t.raw(`scenes.${nameKey}`) as { name: string; description: string; examples: string[] };
            return (
              <Link
                key={id}
                href={localePath(locale, `/templates?scene=${id}`)}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-xl hover:-translate-y-1"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity group-hover:opacity-100`} />

                {/* Content */}
                <div className="relative flex flex-col gap-6 p-8">
                  {/* Icon */}
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${iconBg} shadow-lg text-white`}>
                    <Icon className="h-8 w-8" />
                  </div>

                  {/* Text */}
                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold tracking-tight capitalize">
                      {scene.name}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {scene.description}
                    </p>
                  </div>

                  {/* Examples Tags */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {scene.examples.map((example) => (
                      <span
                        key={example}
                        className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                      >
                        {example}
                      </span>
                    ))}
                  </div>

                  {/* Arrow Icon */}
                  <div className={`mt-auto flex items-center gap-2 text-sm font-medium ${textColor}`}>
                    {t("viewTemplates")}
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            {t("noAccount")}
          </p>
        </div>
      </section>
    </main>
  );
}
