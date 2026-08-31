import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { templateBackgroundType, type TemplateListItem } from "@/lib/templates";

const sceneLabels: Record<string, string> = {
  wedding: "Wedding",
  birthday: "Birthday",
  business: "Business",
  baby: "Baby",
  other: "Other",
};

const backgroundLabels: Record<string, string> = {
  image: "Image background",
  html: "Animated background",
  video: "Video background",
  color: "Color background",
  gradient: "Gradient background",
};

export function TemplateCard({ template }: { template: TemplateListItem & { structure: unknown } }) {
  const backgroundType = templateBackgroundType(template);
  const imageUrl = template.thumbnailUrl || template.previewUrl;

  return (
    <Link href={`/templates/${template.id}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-transform duration-150 group-hover:-translate-y-1 group-hover:shadow-lg">
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${template.name} template preview`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              unoptimized
            />
          ) : null}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
            <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
              {sceneLabels[template.scene] ?? template.scene}
            </span>
            {template.isPremium ? <Crown className="h-4 w-4 text-amber-300 drop-shadow" aria-label="Premium template" /> : null}
          </div>
        </div>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold">{template.name}</h2>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
            <ArrowUpRight className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden="true" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-2.5 py-1 capitalize">{template.style}</span>
            <span>{backgroundLabels[backgroundType] ?? "Custom background"}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
