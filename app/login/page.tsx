import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Heart, Mail, Sparkles } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import { getSafeContinueUrl } from "@/lib/auth-redirect";
import { localePath } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login");
  return { title: { absolute: t("metadataTitle") }, description: t("metadataDescription") };
}

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const [locale, t] = await Promise.all([getLocale(), getTranslations("login")]);
  const continueUrl = getSafeContinueUrl(params.continue);
  const migrateAfterSignIn = params.migrate === "1";

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background">
      <div className="flex w-full flex-col lg:flex-row">
        {/* Left Side - Branding */}
        <div className="relative hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-primary/5 via-accent-foreground/5 to-primary/10 p-12">
          {/* Logo */}
          <Link href={localePath(locale)} className="flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent-foreground text-white shadow-xl transition-transform group-hover:scale-105">
              <Heart className="h-6 w-6" />
            </div>
            <span className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Carte
            </span>
          </Link>

          {/* Hero Content */}
          <div className="space-y-8 max-w-lg">
            <div className="space-y-4">
              <h1 className="text-5xl font-semibold leading-tight tracking-tight">
                {t("title")}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t("description")}
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent-foreground/10 border border-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <span className="text-base font-medium">{t("brandTagline")}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-muted-foreground">
            {t("brandTagline")}
          </p>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-1 items-center justify-center p-8 lg:w-1/2 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <Link href={localePath(locale)} className="mb-8 inline-flex items-center gap-2.5 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-foreground text-white">
                <Heart className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold">Carte</span>
            </Link>

            {/* Form Header */}
            <div className="mb-8 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/30 border border-accent-foreground/20 px-4 py-2 text-sm font-medium text-accent-foreground">
                <Sparkles className="h-4 w-4" />
                {t("eyebrow")}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("title")}
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                {t("description")}
              </p>
            </div>

            {/* Login Form */}
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur p-6 shadow-lg">
              <LoginForm continueUrl={continueUrl} migrateAfterSignIn={migrateAfterSignIn} />
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
              {t("terms")}
            </p>

            {/* Back Link (Mobile) */}
            <Link
              href={localePath(locale)}
              className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
