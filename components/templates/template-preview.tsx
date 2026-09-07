"use client";

import { useEffect, useState } from "react";
import { Film, ImageIcon, Sparkles } from "lucide-react";
import { getTemplateStructure, templateBackgroundType } from "@/lib/templates";
import { LiveTemplatePreview, type PreviewMode } from "@/components/templates/live-template-preview";
import { PreviewModeToggle } from "@/components/templates/preview-mode-toggle";

type PreviewTemplate = {
  name: string;
  thumbnailUrl: string;
  previewUrl: string | null;
  structure: unknown;
};

type TemplatePreviewLabels = {
  backgroundLabel: string;
  previewAlt: string;
  previewMode: string;
  desktopPreview: string;
  mobilePreview: string;
};

const backgroundIcons: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: Film,
  html: Sparkles,
};

export function TemplatePreview({ template, labels, locale }: { template: PreviewTemplate; labels: TemplatePreviewLabels; locale: string }) {
  const backgroundType = templateBackgroundType(template);
  const Icon = backgroundIcons[backgroundType] ?? Sparkles;
  const canvas = getTemplateStructure(template).canvas;
  const structure = getTemplateStructure(template);
  const [mode, setMode] = useState<PreviewMode>("desktop");
  const isLongScroll = structure.pageModel === "h5-long-scroll" && Boolean(structure.sections?.length);

  useEffect(() => {
    if (window.matchMedia("(max-width: 760px)").matches) {
      setMode("mobile");
    }
  }, []);

  return (
    <div className="template-preview-panel">
      {isLongScroll ? (
        <div className="template-preview-toolbar">
          <div className="template-preview-toolbar-label">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{labels.backgroundLabel}</span>
          </div>
          <PreviewModeToggle mode={mode} onChange={setMode} labels={{ group: labels.previewMode, desktop: labels.desktopPreview, mobile: labels.mobilePreview }} />
        </div>
      ) : null}
      <div className={`template-preview-viewport template-preview-viewport-${mode} ${isLongScroll ? "is-long-scroll" : ""}`} style={{ aspectRatio: isLongScroll ? undefined : `${canvas?.width ?? 750} / ${canvas?.height ?? 1334}` }}>
        <LiveTemplatePreview structure={structure} alt={labels.previewAlt} locale={locale} previewMode={mode} />
        {!isLongScroll ? (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{labels.backgroundLabel}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
