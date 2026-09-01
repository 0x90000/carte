"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

type TemplateResponse = {
  success?: boolean;
  data?: {
    id: string;
    name: string;
    scene: string;
    structure: unknown;
  };
  error?: { message?: string };
};

type InvitationResponse = {
  success?: boolean;
  data?: { id: string };
  error?: string;
};

function NewEditorContent() {
  const params = useSearchParams();
  const templateId = params.get("template");
  const startedRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!templateId || startedRef.current) {
      return;
    }
    startedRef.current = true;
    const selectedTemplateId = templateId;
    let active = true;

    async function createDraft() {
      try {
        const templateResponse = await fetch(`/api/templates/${encodeURIComponent(selectedTemplateId)}`);
        const templatePayload = (await templateResponse.json()) as TemplateResponse;
        if (!templateResponse.ok || !templatePayload.data) {
          throw new Error(templatePayload.error?.message ?? "Template not found.");
        }

        const invitationResponse = await fetch("/api/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene: templatePayload.data.scene,
            title: templatePayload.data.name,
            templateId: templatePayload.data.id,
            content: templatePayload.data.structure,
          }),
        });
        const invitationPayload = (await invitationResponse.json()) as InvitationResponse;
        if (!invitationResponse.ok || !invitationPayload.data?.id) {
          throw new Error(invitationPayload.error ?? "We could not start your invitation.");
        }
        window.location.replace(`/editor/${invitationPayload.data.id}`);
      } catch (createError) {
        if (active) {
          setError(createError instanceof Error ? createError.message : "We could not start your invitation.");
        }
      }
    }

    void createDraft();
    return () => {
      active = false;
    };
  }, [templateId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <Link href="/templates" className="mx-auto mb-8 inline-flex items-center gap-2 text-base font-semibold tracking-wide"><Sparkles className="h-5 w-5" aria-hidden="true" /> Carte</Link>
        {error ? (
          <>
            <h1 className="text-2xl font-semibold">We could not open that template.</h1>
            <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>
            <Link href="/templates" className={buttonVariants({ variant: "outline", className: "mt-6" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to templates</Link>
          </>
        ) : !templateId ? (
          <>
            <h1 className="text-2xl font-semibold">Choose a template first.</h1>
            <Link href="/templates" className={buttonVariants({ variant: "outline", className: "mt-6" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Browse templates</Link>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3"><Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" /><h1 className="text-2xl font-semibold">Preparing your invitation</h1><p className="text-sm text-muted-foreground">Your editable draft is being created.</p></div>
        )}
      </section>
    </main>
  );
}

function NewEditorFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <Loader2 className="h-7 w-7 animate-spin" aria-label="Loading editor" />
    </main>
  );
}

export default function NewEditorPage() {
  return <Suspense fallback={<NewEditorFallback />}><NewEditorContent /></Suspense>;
}
