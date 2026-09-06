import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TemplateCard } from "@/components/templates/template-card";
import { getTemplateList, templateScenes, type TemplateScene } from "@/lib/templates";
import { localePath } from "@/lib/i18n";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("templates")]);
  return {
    title: { absolute: t("metadataTitle") },
    description: t("metadataDescription"),
    alternates: {
      canonical: absoluteSiteUrl(`/${locale}/templates`),
      languages: {
        en: absoluteSiteUrl("/en/templates"),
        "zh-CN": absoluteSiteUrl("/zh-CN/templates"),
      },
    },
  };
}

const styleOptions = ["modern", "playful", "formal"];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

type TemplatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const [locale, session, t] = await Promise.all([getLocale(), auth(), getTranslations("templates")]);
  const common = await getTranslations("common");
  const sceneLabels = t.raw("sceneNames") as Record<TemplateScene, string>;
  const styleLabels = t.raw("styleNames") as Record<string, string>;
  const backgroundLabels = t.raw("backgroundNames") as Record<string, string>;
  const params = searchParams ? await searchParams : {};
  const rawScene = firstParam(params.scene);
  const scene = templateScenes.includes(rawScene as TemplateScene) ? (rawScene as TemplateScene) : undefined;
  const rawStyle = firstParam(params.style)?.trim().toLowerCase();
  const style = rawStyle && styleOptions.includes(rawStyle) ? rawStyle : undefined;
  const templates = await getTemplateList({ scene, style });
  const backHref = scene ? localePath(locale, "/create") : localePath(locale);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href={localePath(locale)} className="flex items-center gap-2.5 text-lg font-semibold tracking-tight group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-foreground text-white transition-transform group-hover:scale-105">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Carte</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href={localePath(locale, session?.user ? "/dashboard" : "/login")} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {session?.user ? common("dashboard") : common("signIn")}
            </Link>
            <Link href={localePath(locale, "/create")} className={buttonVariants({ size: "sm", className: "rounded-full" })}>{common("startCreating")}</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="flex flex-col justify-between gap-8 pb-10 lg:flex-row lg:items-end">
          <div className="max-w-2xl space-y-4">
            <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground group">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" /> {scene ? t("backScenes") : t("backCarte")}
            </Link>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/30 border border-accent-foreground/20 text-sm font-medium text-accent-foreground mb-4">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {t("eyebrow")}
              </div>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3">{t("title")}</h1>
              <p className="text-lg leading-relaxed text-muted-foreground">{t("description")}</p>
            </div>
          </div>

          <form action={localePath(locale, "/templates")} method="get" className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:w-auto rounded-2xl border border-border bg-card/50 backdrop-blur p-4 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="scene" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("scene")}</Label>
              <Select id="scene" name="scene" defaultValue={scene ?? ""} aria-label={t("scene")} className="rounded-lg">
                <option value="">{t("allScenes")}</option>
                {templateScenes.map((option) => <option key={option} value={option}>{sceneLabels[option]}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="style" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("style")}</Label>
              <Select id="style" name="style" defaultValue={style ?? ""} aria-label={t("style")} className="rounded-lg">
                <option value="">{t("allStyles")}</option>
                {styleOptions.map((option) => <option key={option} value={option}>{styleLabels[option]}</option>)}
              </Select>
            </div>
            <Button type="submit" variant="secondary" className="self-end rounded-lg">{t("apply")}</Button>
          </form>
        </div>

        {templates.length > 0 ? (
          <section className="grid gap-6 pt-10 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("listLabel")}>
            {templates.map((template) => <TemplateCard
              key={template.id}
              template={template}
              href={localePath(locale, `/templates/${encodeURIComponent(template.id)}`)}
              locale={locale}
              labels={{
                sceneNames: sceneLabels,
                styleNames: styleLabels,
                backgroundNames: backgroundLabels,
                premium: t("detail.premium"),
                customBackground: t("detail.customBackground"),
                previewAlt: t("detail.templatePreviewAlt", { name: template.name }),
              }}
            />)}
          </section>
        ) : (
          <section className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 backdrop-blur py-20 text-center mt-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent-foreground/10 border border-primary/20 mb-6">
              <Sparkles className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">{t("noMatch")}</h2>
            <p className="text-base text-muted-foreground mb-8 max-w-md">{t("tryAnother")}</p>
            <Link href={localePath(locale, "/templates")} className={buttonVariants({ variant: "outline", className: "rounded-full" })}>{t("viewAll")}</Link>
          </section>
        )}
      </div>
    </main>
  );
}
