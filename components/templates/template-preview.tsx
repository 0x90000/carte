"use client";

import { Film, ImageIcon, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getTemplateStructure, templateBackgroundType } from "@/lib/templates";
import { LiveTemplatePreview } from "@/components/templates/live-template-preview";

type PreviewTemplate = {
  name: string;
  thumbnailUrl: string;
  previewUrl: string | null;
  structure: unknown;
};

type TemplatePreviewLabels = {
  backgroundLabel: string;
  previewAlt: string;
};

const backgroundIcons: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: Film,
  html: Sparkles,
};

export function TemplatePreview({ template, labels }: { template: PreviewTemplate; labels: TemplatePreviewLabels }) {
  const backgroundType = templateBackgroundType(template);
  const Icon = backgroundIcons[backgroundType] ?? Sparkles;
  const canvas = getTemplateStructure(template).canvas;
  const structure = getTemplateStructure(template);

  return (
    <Card className="overflow-hidden border-border bg-foreground p-3 shadow-xl sm:p-5">
      <div className={`relative mx-auto w-full max-w-[520px] rounded-md bg-secondary ${structure.pageModel === "h5-long-scroll" ? "max-h-[760px] overflow-auto" : "overflow-hidden"}`} style={{ aspectRatio: structure.pageModel === "h5-long-scroll" ? undefined : `${canvas?.width ?? 750} / ${canvas?.height ?? 1334}` }}>
        <LiveTemplatePreview structure={structure} alt={labels.previewAlt} />
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{labels.backgroundLabel}</span>
        </div>
      </div>
    </Card>
  );
}
