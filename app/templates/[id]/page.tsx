import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { TemplatePreview } from "@/components/templates/template-preview";
import { getTemplateStructure, templateBackgroundType } from "@/lib/templates";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TemplateDetailProps = { params: Promise<{ id: string }> };

async function getTemplate(id: string) {
  return prisma.template.findFirst({ where: { id, isActive: true } });
}

export async function generateMetadata({ params }: TemplateDetailProps): Promise<Metadata> {
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) {
    return { title: "Template not found | Carte" };
  }
  return {
    title: `${template.name} template`,
    description: template.description ?? "A considered starting point for your next invitation.",
    openGraph: { images: template.previewUrl ? [template.previewUrl] : undefined },
  };
}

export default async function TemplateDetailPage({ params }: TemplateDetailProps) {
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) {
    notFound();
  }

  const structure = getTemplateStructure(template);
  const backgroundType = templateBackgroundType(template);
  const variableCount = structure.variables?.length ?? 0;
  const schemeCount = structure.colorSchemes?.length ?? 0;
  const layerCount = structure.layers?.length ?? 0;

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-wide"><Sparkles className="h-5 w-5" aria-hidden="true" /> Carte</Link>
          <Link href="/templates" className={buttonVariants({ variant: "ghost", size: "sm" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> All templates</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-16 lg:px-8 lg:py-14">
        <div><TemplatePreview template={template} /></div>

        <section className="flex flex-col justify-center py-2 lg:py-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">{template.scene} / {template.style}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">{template.name}</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{template.description}</p>

          <div className="mt-8 grid grid-cols-3 border-y border-border py-5 text-center sm:text-left">
            <div><p className="text-2xl font-semibold">{layerCount}</p><p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">Layers</p></div>
            <div className="border-x border-border"><p className="text-2xl font-semibold">{variableCount}</p><p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">Editable fields</p></div>
            <div><p className="text-2xl font-semibold">{schemeCount}</p><p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">Colorways</p></div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-secondary px-3 py-1.5 capitalize">{backgroundType} background</span>
            {template.tags.map((tag) => <span key={tag} className="rounded-full bg-secondary px-3 py-1.5">{tag}</span>)}
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={`/editor/new?template=${template.id}`} className={buttonVariants({ size: "lg", className: "flex-1" })}>Use this template <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
            <Button variant="outline" size="lg" type="button" disabled aria-label="Premium status">{template.isPremium ? "Premium" : "Included"}</Button>
          </div>

          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            {["Responsive invitation canvas", "Edit copy, colors, and event details", "Ready for RSVP when you publish"].map((item) => <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" aria-hidden="true" /> {item}</li>)}
          </ul>
        </section>
      </div>
    </main>
  );
}
