import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import { getSafeContinueUrl } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: { absolute: "Sign in | Carte" },
  description: "Sign in to create and manage your invitations.",
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const t = await getTranslations("login");
  const continueUrl = getSafeContinueUrl(params.continue);
  const migrateAfterSignIn = params.migrate === "1";

  return (
    <main className="min-h-screen bg-secondary/40">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex xl:p-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide">
            <Sparkles className="h-5 w-5" aria-hidden="true" /> Carte
          </Link>
          <div className="max-w-md space-y-7">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-foreground/65">Thoughtful invitations</p>
            <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">Give every gathering a beautiful beginning.</h1>
            <p className="text-base leading-7 text-primary-foreground/70">Create, refine, and share an invitation that feels like your event before the first guest arrives.</p>
          </div>
          <p className="text-sm text-primary-foreground/55">Carte · Invitations with intention</p>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("back")}
            </Link>
            <div className="mb-8 space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">{t("eyebrow")}</p>
              <h1 className="text-3xl font-semibold tracking-normal">{t("title")}</h1>
              <p className="text-base text-muted-foreground">{t("description")}</p>
            </div>
            <LoginForm continueUrl={continueUrl} migrateAfterSignIn={migrateAfterSignIn} />
            <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">{t("terms")}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
