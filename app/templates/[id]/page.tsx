import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Button, buttonVariants } from "@/components/ui/button";
import { TemplatePreview } from "@/components/templates/template-preview";
import { getTemplateStructure, templateBackgroundType } from "@/lib/templates";
import { localePath } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type TemplateDetailProps = { params: Promise<{ id: string }> };

async function getTemplate(id: string) {
  return prisma.template.findFirst({ where: { id, isActive: true } });
}

export async function generateMetadata({ params }: TemplateDetailProps): Promise<Metadata> {
  const [locale, t, { id }] = await Promise.all([getLocale(), getTranslations("templates"), params]);
  const template = await getTemplate(id);
  const path = localePath(locale, `/templates/${encodeURIComponent(id)}`);
  const alternates = {
    canonical: absoluteSiteUrl(path),
    languages: {
      en: absoluteSiteUrl(`/en/templates/${encodeURIComponent(id)}`),
      "zh-CN": absoluteSiteUrl(`/zh-CN/templates/${encodeURIComponent(id)}`),
    },
  };
  if (!template) {
    return { title: { absolute: t("detail.metadataNotFoundTitle") }, alternates };
  }
  const title = `${template.name} ${t("detail.metadataSuffix")}`;
  const description = template.description ?? t("detail.metadataFallbackDescription");
  return {
    title,
    description,
    openGraph: { title, description, images: template.previewUrl ? [template.previewUrl] : undefined, url: absoluteSiteUrl(path) },
    alternates,
  };
}

export default async function TemplateDetailPage({ params }: TemplateDetailProps) {
  const [{ id }, locale, t] = await Promise.all([params, getLocale(), getTranslations("templates")]);
  const template = await getTemplate(id);
  if (!template) {
    notFound();
  }

  const structure = getTemplateStructure(template);
  const backgroundType = templateBackgroundType(template);
  const variableCount = structure.variables?.length ?? 0;
  const schemeCount = structure.colorSchemes?.length ?? 0;
  const layerCount = structure.layers?.length ?? 0;
  const sceneLabels = t.raw("sceneNames") as Record<string, string>;
  const styleLabels = t.raw("styleNames") as Record<string, string>;
  const backgroundLabels = t.raw("backgroundNames") as Record<string, string>;
  const features = t.raw("detail.features") as string[];
  const backgroundLabel = backgroundLabels[backgroundType] ?? t("detail.customBackground");

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={localePath(locale)} className="inline-flex items-center gap-2 text-base font-semibold tracking-wide"><Sparkles className="h-5 w-5" aria-hidden="true" /> Carte</Link>
          <Link href={localePath(locale, "/templates")} className={buttonVariants({ variant: "ghost", size: "sm" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("detail.back")}</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-16 lg:px-8 lg:py-14">
        <div><TemplatePreview template={template} labels={{ backgroundLabel, previewAlt: t("detail.previewAlt", { name: template.name }) }} /></div>

        <section className="flex flex-col justify-center py-2 lg:py-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">{sceneLabels[template.scene] ?? template.scene} / {styleLabels[template.style] ?? template.style}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">{template.name}</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{template.description}</p>

          <div className="mt-8 grid grid-cols-3 border-y border-border py-5 text-center sm:text-left">
            <div><p className="text-2xl font-semibold">{layerCount}</p><p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("detail.layers")}</p></div>
            <div className="border-x border-border"><p className="text-2xl font-semibold">{variableCount}</p><p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("detail.editableFields")}</p></div>
            <div><p className="text-2xl font-semibold">{schemeCount}</p><p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("detail.colorways")}</p></div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-secondary px-3 py-1.5">{backgroundLabel}</span>
            {template.tags.map((tag) => <span key={tag} className="rounded-full bg-secondary px-3 py-1.5">{tag}</span>)}
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={localePath(locale, `/editor/new?template=${encodeURIComponent(template.id)}`)} className={buttonVariants({ size: "lg", className: "flex-1" })}>{t("detail.useTemplate")} <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
            <Button variant="outline" size="lg" type="button" disabled aria-label={t("detail.premiumStatus")}>{template.isPremium ? t("detail.premium") : t("detail.included")}</Button>
          </div>

          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            {features.map((item) => <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" aria-hidden="true" /> {item}</li>)}
          </ul>
        </section>
      </div>
    </main>
  );
}
