import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Heart, Palette, Sparkles, Star } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { TemplatePreview } from "@/components/templates/template-preview";
import { getTemplateStructure, templateBackgroundType } from "@/lib/templates";
import { localePath } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { absoluteSiteUrl } from "@/lib/site-url";
import { UseTemplateButton } from "./use-template-button";

export const dynamic = "force-dynamic";

type TemplateDetailProps = { params: Promise<{ id: string }> };

async function getTemplate(id: string) {
  return prisma.template.findFirst({ where: { id, isActive: true } });
}

export async function generateMetadata({ params }: TemplateDetailProps): Promise<Metadata> {
  const [locale, t, { id }] = await Promise.all([getLocale(), getTranslations("templates"), params]);
  const template = await getTemplate(id);
  if (!template) {
    return { title: { absolute: t("metadataTitle") } };
  }
  const canonicalPath = `/${locale}/templates/${encodeURIComponent(template.id)}`;
  return {
    title: { absolute: t("detail.metadataTitle", { name: template.name }) },
    description: template.description,
    alternates: {
      canonical: absoluteSiteUrl(canonicalPath),
      languages: { en: absoluteSiteUrl(`/en/templates/${encodeURIComponent(template.id)}`), "zh-CN": absoluteSiteUrl(`/zh-CN/templates/${encodeURIComponent(template.id)}`) },
    },
  };
}

export default async function TemplateDetailPage({ params }: TemplateDetailProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("templates")]);
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) {
    notFound();
  }

  const structure = getTemplateStructure(template);
  const sceneLabels = t.raw("sceneNames") as Record<string, string>;
  const styleLabels = t.raw("styleNames") as Record<string, string>;
  const backgroundLabels = t.raw("backgroundNames") as Record<string, string>;
  const backgroundLabel = backgroundLabels[templateBackgroundType(template)];

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
          <Link href={localePath(locale, "/templates")} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t("detail.back")}
          </Link>
          <Link href={localePath(locale)} className="flex items-center gap-2.5 text-lg font-semibold tracking-tight group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-foreground text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <Heart className="h-4 w-4" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Carte</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_480px] lg:gap-16">
          {/* Preview Section */}
          <div className="order-2 lg:order-1">
            <div className="sticky top-24">
              <div className="rounded-3xl border-2 border-border bg-white p-6 shadow-2xl">
                <TemplatePreview
                  template={template}
                  locale={locale}
                  labels={{
                    backgroundLabel,
                    previewAlt: t("detail.previewAlt", { name: template.name }),
                  }}
                />
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="order-1 space-y-8 lg:order-2">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 to-accent-foreground/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                {sceneLabels[template.scene] ?? template.scene}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium">
                <Palette className="h-4 w-4" />
                {styleLabels[template.style] ?? template.style}
              </span>
              {template.isPremium && (
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700">
                  <Star className="h-4 w-4" />
                  {t("detail.premium")}
                </span>
              )}
            </div>

            {/* Title & Description */}
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {template.name}
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {template.description}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-card/50 backdrop-blur p-6">
              <div className="text-center">
                <div className="text-2xl font-semibold">{structure.layers?.length ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  {t("detail.layers")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">{structure.colorSchemes?.length ?? 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  {t("detail.colorways")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold leading-snug break-words">{backgroundLabel}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  {t("detail.backgroundLabel")}
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">{t("detail.metadataSuffix")}</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">{t("detail.useTemplate")}</span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <UseTemplateButton
              templateId={template.id}
              scene={template.scene}
              label={t("detail.useTemplate")}
              locale={locale}
              structure={structure}
            />

            {/* Additional Info */}
            <div className="rounded-2xl border border-dashed border-border/60 bg-secondary/30 p-6 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("detail.metadataFallbackDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
