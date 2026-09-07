"use client";

import { Monitor, Smartphone } from "lucide-react";
import type { PreviewMode } from "@/components/templates/live-template-preview";

type PreviewModeToggleProps = {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
  labels: {
    group: string;
    desktop: string;
    mobile: string;
  };
};

export function PreviewModeToggle({ mode, onChange, labels }: PreviewModeToggleProps) {
  return (
    <div className="preview-mode-toggle" role="group" aria-label={labels.group}>
      <button
        type="button"
        className={mode === "desktop" ? "is-active" : ""}
        onClick={() => onChange("desktop")}
        aria-pressed={mode === "desktop"}
        title={labels.desktop}
      >
        <Monitor size={15} aria-hidden="true" />
        <span>{labels.desktop}</span>
      </button>
      <button
        type="button"
        className={mode === "mobile" ? "is-active" : ""}
        onClick={() => onChange("mobile")}
        aria-pressed={mode === "mobile"}
        title={labels.mobile}
      >
        <Smartphone size={15} aria-hidden="true" />
        <span>{labels.mobile}</span>
      </button>
    </div>
  );
}
