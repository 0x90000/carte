import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TemplateCard } from "@/components/templates/template-card";
import { getTemplateList, templateScenes, type TemplateScene } from "@/lib/templates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Templates | Carte",
  description: "Choose a considered starting point for your next invitation.",
};

const sceneLabels: Record<TemplateScene, string> = {
  wedding: "Wedding",
  birthday: "Birthday",
  business: "Business event",
  baby: "Baby",
  other: "Other gathering",
};

const styleOptions = ["modern", "playful", "formal"];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

type TemplatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const session = await auth();
  const params = searchParams ? await searchParams : {};
  const rawScene = firstParam(params.scene);
  const scene = templateScenes.includes(rawScene as TemplateScene) ? (rawScene as TemplateScene) : undefined;
  const rawStyle = firstParam(params.style)?.trim().toLowerCase();
  const style = rawStyle && styleOptions.includes(rawStyle) ? rawStyle : undefined;
  const templates = await getTemplateList({ scene, style });
  const backHref = scene ? "/create" : "/";

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-wide">
            <Sparkles className="h-5 w-5" aria-hidden="true" /> Carte
          </Link>
          <div className="flex items-center gap-2">
            <Link href={session?.user ? "/dashboard" : "/login"} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {session?.user ? "Dashboard" : "Sign in"}
            </Link>
            <Link href="/create" className={buttonVariants({ size: "sm" })}>Start creating</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl space-y-3">
            <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {scene ? "Back to scenes" : "Back to Carte"}
            </Link>
            <p className="pt-3 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Template library</p>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">A considered starting point.</h1>
            <p className="text-base leading-7 text-muted-foreground">Choose a visual direction, then make every detail your own.</p>
          </div>

          <form action="/templates" method="get" className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:w-auto">
            <div className="space-y-1.5">
              <Label htmlFor="scene">Scene</Label>
              <Select id="scene" name="scene" defaultValue={scene ?? ""} aria-label="Filter by scene">
                <option value="">All scenes</option>
                {templateScenes.map((option) => <option key={option} value={option}>{sceneLabels[option]}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="style">Style</Label>
              <Select id="style" name="style" defaultValue={style ?? ""} aria-label="Filter by style">
                <option value="">All styles</option>
                {styleOptions.map((option) => <option key={option} value={option} className="capitalize">{option}</option>)}
              </Select>
            </div>
            <Button type="submit" variant="outline" className="self-end">Apply filters</Button>
          </form>
        </div>

        {templates.length > 0 ? (
          <section className="grid gap-5 pt-8 sm:grid-cols-2 lg:grid-cols-3" aria-label="Invitation templates">
            {templates.map((template) => <TemplateCard key={template.id} template={template} />)}
          </section>
        ) : (
          <section className="flex min-h-72 flex-col items-center justify-center border-b border-border py-16 text-center">
            <Sparkles className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-5 text-xl font-semibold">No templates match those filters.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Try another scene or style to see the collection.</p>
            <Link href="/templates" className={buttonVariants({ variant: "outline", className: "mt-6" })}>View all templates</Link>
          </section>
        )}
      </div>
    </main>
  );
}
