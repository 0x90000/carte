"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

type UseTemplateButtonProps = {
  templateId: string;
  scene: string;
  label: string;
  locale: string;
  structure: unknown;
};

export function UseTemplateButton({ templateId, scene, label, locale, structure }: UseTemplateButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          scene,
          locale,
          title: "",
          content: structure,
        }),
      });

      const result = await response.json();
      if (result.success && result.data?.id) {
        router.push(`/${locale}/editor/${result.data.id}`);
      } else {
        alert("Failed to create invitation");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to use template:", error);
      alert("Failed to create invitation");
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="lg"
      onClick={handleClick}
      disabled={isLoading}
      className="w-full rounded-full text-base h-14 shadow-xl shadow-primary/30 group"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </>
      )}
    </Button>
  );
}
