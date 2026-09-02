"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ShareLinkActionsProps = {
  publicUrl: string;
  title: string;
};

export function ShareLinkActions({ publicUrl, title }: ShareLinkActionsProps) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      const input = document.createElement("textarea");
      input.value = publicUrl;
      input.setAttribute("readonly", "true");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({ title, url: publicUrl }).catch(() => undefined);
      return;
    }
    await copyLink();
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => void copyLink()} variant="outline">
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        {copied ? t("copied") : t("copyLink")}
      </Button>
      <Button onClick={() => void shareLink()} variant="secondary">
        <Share2 className="h-4 w-4" aria-hidden="true" /> {t("share")}
      </Button>
    </div>
  );
}
