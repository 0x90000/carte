import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Heart, Image, Mail, Palette, Sparkles, User } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { absoluteSiteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("home")]);
  const canonicalPath = `/${locale}`;
  return {
    title: { absolute: t("metadataTitle") },
    description: t("metadataDescription"),
    alternates: {
      canonical: absoluteSiteUrl(canonicalPath),
      languages: {
        en: absoluteSiteUrl("/en"),
        "zh-CN": absoluteSiteUrl("/zh-CN"),
      },
    },
  };
}

const features = [
  { icon: Palette, title: "steps.yours.title", body: "steps.yours.body" },
  { icon: Image, title: "steps.feeling.title", body: "steps.feeling.body" },
  { icon: Mail, title: "steps.share.title", body: "steps.share.body" },
];

const occasions = [
  { emoji: "💍", key: "wedding" },
  { emoji: "🎂", key: "birthday" },
  { emoji: "🎓", key: "graduation" },
  { emoji: "🏠", key: "housewarming" },
  { emoji: "💼", key: "business" },
  { emoji: "🎊", key: "other" },
];

export default async function Home() {
  const session = await auth();
  const t = await getTranslations("home");
  const createT = await getTranslations("create");
  const common = await getTranslations("common");

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Elegant single header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-foreground text-white transition-transform group-hover:scale-105">
              <Heart className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Carte</span>
          </Link>
          <nav className="flex items-center gap-3" aria-label="Main navigation">
            <Link href={session?.user ? "/dashboard" : "/login"} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {session?.user ? common("dashboard") : common("signIn")}
            </Link>
            <Link href="/create" className={buttonVariants({ size: "sm", className: "rounded-full" })}>
              {common("startCreating")}
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section - Warm and inviting */}
      <section className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 lg:px-8 lg:pt-32 lg:pb-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          <div className="space-y-8 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/30 border border-accent-foreground/20 text-sm font-medium text-accent-foreground">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t("eyebrow")}
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.1] tracking-tight">
              <span className="block text-foreground">{t("title")}</span>
            </h1>

            <p className="text-xl leading-relaxed text-muted-foreground max-w-xl">
              {t("description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/create"
                className={buttonVariants({ size: "lg", className: "rounded-full text-base h-14 px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" })}
              >
                {t("createCta")}
                <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
              </Link>
              <Link
                href="/templates"
                className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-full text-base h-14 px-8" })}
              >
                {t("howItWorksCta")}
              </Link>
            </div>

            {/* Occasion chips */}
            <div className="flex flex-wrap gap-3 pt-6">
              {occasions.map(({ emoji, key }) => (
                <Link
                  key={key}
                  href={`/templates?scene=${key}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all text-sm font-medium"
                >
                  <span className="text-lg">{emoji}</span>
                  <span>{createT(`scenes.${key}.name`)}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Beautiful preview card */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-label="Invitation preview">
            <div className="absolute -top-4 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-accent-foreground/10 rounded-full blur-3xl" />

            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-secondary shadow-2xl p-6 transform hover:scale-[1.02] transition-transform duration-500">
              <div className="flex h-full flex-col justify-between rounded-2xl border border-border/50 bg-background/95 backdrop-blur p-8">
                <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Carte
                  </span>
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                </div>

                <div className="space-y-6">
                  <div className="inline-block px-3 py-1 rounded-full bg-accent/20 border border-accent-foreground/20">
                    <p className="text-xs uppercase tracking-widest text-accent-foreground font-medium">
                      {t("preview.saveTheDate")}
                    </p>
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-semibold leading-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                    A summer evening together
                  </h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent-foreground rounded-full" />
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {t("preview.details")}<br />
                    {t("preview.location")}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent-foreground/20 border border-primary/30">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">Maya & Alex</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{t("preview.invited")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative border-t border-border/50 bg-card/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="mb-16 max-w-2xl space-y-4 text-center mx-auto">
            <h2 className="text-4xl font-semibold tracking-tight">
              {t("howItWorksTitle")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("description")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent-foreground/10 border border-primary/20 group-hover:scale-110 transition-transform">
                    <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold">{t(title)}</h3>
                  <p className="text-base leading-relaxed text-muted-foreground">{t(body)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden border-t border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent-foreground/5" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center lg:px-8 lg:py-28">
          <div className="space-y-8">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              {t("createCta")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/create"
                className={buttonVariants({ size: "lg", className: "rounded-full text-base h-14 px-8 shadow-lg shadow-primary/20" })}
              >
                {t("createCta")}
                <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-foreground text-white">
                <Heart className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-lg font-semibold">Carte</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("howItWorks")}
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
