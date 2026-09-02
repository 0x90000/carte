"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, RefreshCw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EmailSend = {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
};

type EmailApiResponse = {
  success?: boolean;
  data?: { sends?: EmailSend[] } | EmailSend[];
  error?: { message?: string } | string;
};

function getErrorMessage(payload: EmailApiResponse) {
  return typeof payload.error === "string" ? payload.error : payload.error?.message ?? "We could not process the email request.";
}

function parseRecipients(value: string) {
  return Array.from(new Set(value.split(/\r?\n/).map((line) => line.trim().toLowerCase()).filter(Boolean)));
}

function statusClass(status: string) {
  if (status === "sent") return "text-emerald-700";
  if (status === "failed") return "text-red-700";
  return "text-amber-700";
}

export function SendEmailsDialog({ invitationId, invitationTitle }: { invitationId: string; invitationTitle: string }) {
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<"preview" | "send" | "refresh" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadSends = useCallback(async () => {
    setAction("refresh");
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(invitationId)}/send-emails`, { cache: "no-store" });
      const payload = (await response.json()) as EmailApiResponse;
      if (!response.ok) throw new Error(getErrorMessage(payload));
      const data = Array.isArray(payload.data) ? payload.data : payload.data?.sends ?? [];
      setSends(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not load email history.");
    } finally {
      setAction(null);
    }
  }, [invitationId]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setNotice("");
    void loadSends();
  }, [loadSends, open]);

  async function submit(sendImmediately: boolean) {
    const emailRecipients = parseRecipients(recipients);
    if (emailRecipients.length === 0) {
      setError("Add at least one email address.");
      return;
    }

    setIsLoading(true);
    setAction(sendImmediately ? "send" : "preview");
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(invitationId)}/send-emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: emailRecipients.map((email) => ({ email })),
          subject: subject.trim() || undefined,
          message: message.trim() || undefined,
          sendImmediately,
        }),
      });
      const payload = (await response.json()) as EmailApiResponse;
      if (!response.ok) throw new Error(getErrorMessage(payload));
      const created = payload.data && !Array.isArray(payload.data) ? payload.data.sends ?? [] : [];
      setSends((current) => [...created, ...current].slice(0, 100));
      setNotice(sendImmediately ? "Email delivery queued." : `${emailRecipients.length} email draft${emailRecipients.length === 1 ? "" : "s"} created.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not process the email request.");
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Mail className="h-4 w-4" aria-hidden="true" /> Send via email
      </Button>
      <Dialog open={open} onClose={setOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader className="relative pr-10">
            <DialogTitle>Send “{invitationTitle}” via email</DialogTitle>
            <DialogDescription>Prepare invitation emails for your guests.</DialogDescription>
            <Button variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setOpen(false)} aria-label="Close email dialog" title="Close">
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`email-recipients-${invitationId}`}>Recipients</Label>
              <Textarea
                id={`email-recipients-${invitationId}`}
                rows={5}
                placeholder="guest@example.com\nfriend@example.com"
                value={recipients}
                onChange={(event) => setRecipients(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">{parseRecipients(recipients).length} recipient{parseRecipients(recipients).length === 1 ? "" : "s"}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`email-subject-${invitationId}`}>Subject</Label>
              <Input id={`email-subject-${invitationId}`} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={`You're invited: ${invitationTitle}`} maxLength={200} />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`email-message-${invitationId}`}>Personal message</Label>
              <Textarea id={`email-message-${invitationId}`} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add a personal note (optional)" maxLength={2000} />
            </div>

            {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
            {notice ? <p className="text-sm text-emerald-700" role="status">{notice}</p> : null}

            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={() => void submit(false)} disabled={isLoading}>
                <Mail className="h-4 w-4" aria-hidden="true" /> {action === "preview" ? "Preparing" : "Create preview"}
              </Button>
              <Button onClick={() => void submit(true)} disabled={isLoading}>
                <Send className="h-4 w-4" aria-hidden="true" /> {action === "send" ? "Sending" : "Send now"}
              </Button>
            </div>

            <section className="space-y-3 border-t border-border pt-4" aria-labelledby={`email-history-${invitationId}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 id={`email-history-${invitationId}`} className="text-sm font-semibold">Recent email status</h3>
                <Button variant="ghost" size="icon" onClick={() => void loadSends()} disabled={action !== null} aria-label="Refresh email status" title="Refresh">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              {sends.length === 0 ? <p className="text-sm text-muted-foreground">No email sends yet.</p> : (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {sends.map((send) => (
                    <li key={send.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate">{send.recipientEmail}</span>
                      <span className={`font-medium capitalize ${statusClass(send.status)}`}>{send.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
