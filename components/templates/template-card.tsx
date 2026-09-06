import Link from "next/link";
import { ArrowUpRight, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { templateBackgroundType, type TemplateListItem } from "@/lib/templates";
import { LiveTemplatePreview } from "@/components/templates/live-template-preview";

export type TemplateCardLabels = {
  sceneNames: Record<string, string>;
  styleNames: Record<string, string>;
  backgroundNames: Record<string, string>;
  premium: string;
  customBackground: string;
  previewAlt: string;
};

export function TemplateCard({ template, href, labels, locale }: { template: TemplateListItem & { structure: unknown }; href: string; labels: TemplateCardLabels; locale: string }) {
  const backgroundType = templateBackgroundType(template);

  return (
    <Card className="group h-full overflow-hidden transition-transform duration-150 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
        <LiveTemplatePreview structure={template.structure} alt={labels.previewAlt} locale={locale} mode="fit" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
            {labels.sceneNames[template.scene] ?? template.scene}
          </span>
          {template.isPremium ? <Crown className="h-4 w-4 text-amber-300 drop-shadow" aria-label={labels.premium} /> : null}
        </div>
      </div>
      <CardContent className="space-y-4 p-5">
        <Link href={href} className="flex items-start justify-between gap-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">{template.name}</h2>
            <p className="text-sm text-muted-foreground">{template.description}</p>
          </div>
          <ArrowUpRight className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden="true" />
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2.5 py-1">{labels.styleNames[template.style] ?? template.style}</span>
          <span>{labels.backgroundNames[backgroundType] ?? labels.customBackground}</span>
        </div>
      </CardContent>
    </Card>
  );
}
