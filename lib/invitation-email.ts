import { Resend } from "resend";

type InvitationEmailData = {
  title: string;
  slug: string;
  eventDate: Date | null;
  eventLocation: string | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function getAppUrl() {
  const value = readEnv("NEXT_PUBLIC_APP_URL")?.replace(/\/$/, "");
  return value || null;
}

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) return null;
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    const unquoted = value.slice(1, -1).trim();
    return unquoted || null;
  }
  return value;
}

function formatEventDate(eventDate: Date | null) {
  return eventDate?.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }) ?? null;
}

export function buildInvitationEmail(invitation: InvitationEmailData, customMessage?: string) {
  const appUrl = getAppUrl();
  if (!appUrl) {
    throw new Error("APP_URL_NOT_CONFIGURED");
  }

  const title = escapeHtml(invitation.title);
  const link = `${appUrl}/i/${encodeURIComponent(invitation.slug)}`;
  const eventDate = formatEventDate(invitation.eventDate);
  const eventLocation = invitation.eventLocation?.trim() || null;
  const details = [eventDate ? `<strong>When:</strong> ${escapeHtml(eventDate)}` : null, eventLocation ? `<strong>Where:</strong> ${escapeHtml(eventLocation)}` : null]
    .filter((value): value is string => Boolean(value))
    .join("<br />");
  const message = customMessage?.trim()
    ? `<p>${escapeHtml(customMessage.trim()).replaceAll("\n", "<br />")}</p>`
    : `<p>You're invited to <strong>${title}</strong>.</p>`;

  return {
    subject: `You're invited: ${invitation.title}`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
  <p>Hi there,</p>
  ${message}
  ${details ? `<p>${details}</p>` : ""}
  <p><a href="${link}" style="display: inline-block; padding: 12px 24px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">View invitation &amp; RSVP</a></p>
  <p style="color: #737373; font-size: 14px;">This invitation was sent via Carte.</p>
</div>`.trim(),
    link,
  };
}

export function getInvitationEmailSender() {
  return readEnv("EMAIL_FROM") || "Carte <noreply@carte.app>";
}

export function getResendClient() {
  const apiKey = readEnv("RESEND_API_KEY");
  return apiKey ? new Resend(apiKey) : null;
}
