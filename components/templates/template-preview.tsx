import Image from "next/image";
import { Film, ImageIcon, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { templateBackgroundType } from "@/lib/templates";

type PreviewTemplate = {
  name: string;
  thumbnailUrl: string;
  previewUrl: string | null;
  structure: unknown;
};

const backgroundIcons: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: Film,
  html: Sparkles,
};

export function TemplatePreview({ template }: { template: PreviewTemplate }) {
  const backgroundType = templateBackgroundType(template);
  const Icon = backgroundIcons[backgroundType] ?? Sparkles;
  const imageUrl = template.previewUrl ?? template.thumbnailUrl;

  return (
    <Card className="overflow-hidden border-border bg-foreground p-3 shadow-xl sm:p-5">
      <div className="relative mx-auto aspect-[750/1334] w-full max-w-[520px] overflow-hidden rounded-md bg-secondary">
        <Image src={imageUrl} alt={`${template.name} full preview`} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" unoptimized />
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="capitalize">{backgroundType} background</span>
        </div>
      </div>
    </Card>
  );
}
