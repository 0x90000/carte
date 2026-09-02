"use client";

import { useState } from "react";
import { Copy, Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type InvitationActionsProps = {
  invitationId: string;
  invitationTitle: string;
};

type ApiError = { error?: { message?: string } | string };

function getErrorMessage(payload: ApiError) {
  return typeof payload.error === "string" ? payload.error : payload.error?.message ?? "We could not update this invitation.";
}

export function InvitationActions({ invitationId, invitationTitle }: InvitationActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"duplicate" | "delete" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  async function duplicate() {
    setPending("duplicate");
    setError("");
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(invitationId)}/duplicate`, { method: "POST" });
      const payload = (await response.json()) as ApiError;
      if (!response.ok) throw new Error(getErrorMessage(payload));
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not duplicate this invitation.");
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    setPending("delete");
    setError("");
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(invitationId)}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiError;
      if (!response.ok) throw new Error(getErrorMessage(payload));
      setConfirmOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not delete this invitation.");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => void duplicate()} disabled={pending !== null} aria-label={`Duplicate ${invitationTitle}`} title="Duplicate invitation">
          {pending === "duplicate" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { setError(""); setConfirmOpen(true); }} disabled={pending !== null} aria-label={`Delete ${invitationTitle}`} title="Delete invitation">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      {error ? <p className="basis-full text-right text-sm text-red-700" role="alert">{error}</p> : null}
      <Dialog open={confirmOpen} onClose={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="relative pr-10">
            <DialogTitle>Delete “{invitationTitle}”?</DialogTitle>
            <DialogDescription>This permanently removes the invitation and its RSVP responses.</DialogDescription>
            <Button variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setConfirmOpen(false)} aria-label="Close delete confirmation" title="Close">
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending !== null}>Cancel</Button>
            <Button variant="destructive" onClick={() => void remove()} disabled={pending !== null}>
              {pending === "delete" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              {pending === "delete" ? "Deleting" : "Delete invitation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
