import { prisma } from "@/lib/prisma";
import { enqueueInvitationEmails } from "@/lib/invitation-email-queue";

const DEFAULT_INTERVAL_MS = 60 * 60 * 1_000;
const RSVP_NOTIFICATION_ENABLED = "true";

type RsvpDigestRecord = {
  id: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  status: string;
  partySize: number;
  dietaryPreferences: string | null;
  message: string | null;
  createdAt: Date;
};

type DigestInvitation = {
  id: string;
  title: string;
  slug: string;
  locale: string;
  eventDate: Date | null;
  eventLocation: string | null;
  user: { id: string; email: string; name: string | null; locale: string };
};

type DigestResult = {
  notifications: Array<{ id: string; invitationId: string; rsvpCount: number; emailSendId: string }>;
  queuedCount: number;
  skipped: boolean;
};

const globalForRsvpNotification = globalThis as unknown as {
  rsvpNotificationTimer?: ReturnType<typeof setInterval>;
  rsvpNotificationRun?: Promise<void>;
};

function isEnabled() {
  return process.env.RSVP_NOTIFICATION_ENABLED === RSVP_NOTIFICATION_ENABLED ||
    (process.env.NODE_ENV === "production" && process.env.RSVP_NOTIFICATION_ENABLED !== "false");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function readAppUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) return null;
  return value.replace(/\/$/, "");
}

function isChinese(locale: string) {
  return locale.toLowerCase().startsWith("zh");
}

function formatDate(value: Date | null, chinese: boolean) {
  if (!value) return null;
  return value.toLocaleString(chinese ? "zh-CN" : "en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

function statusLabel(status: string, chinese: boolean) {
  if (chinese) {
    return { attending: "参加", declined: "不参加", maybe: "待定" }[status] ?? status;
  }
  return { attending: "Attending", declined: "Declined", maybe: "Maybe" }[status] ?? status;
}

export function buildRsvpDigestEmail(invitation: Pick<DigestInvitation, "title" | "slug" | "locale" | "eventDate" | "eventLocation">, rsvps: RsvpDigestRecord[], locale = invitation.locale) {
  const chinese = isChinese(locale);
  const title = escapeHtml(invitation.title);
  const count = rsvps.length;
  const appUrl = readAppUrl();
  const invitationUrl = appUrl ? `${appUrl}/i/${encodeURIComponent(invitation.slug)}` : null;
  const eventDate = formatDate(invitation.eventDate, chinese);
  const eventLocation = invitation.eventLocation?.trim() || null;
  const details = [
    eventDate ? `${chinese ? "时间" : "When"}: ${escapeHtml(eventDate)}` : null,
    eventLocation ? `${chinese ? "地点" : "Where"}: ${escapeHtml(eventLocation)}` : null,
  ].filter((value): value is string => Boolean(value));
  const rows = rsvps.map((rsvp) => {
    const contact = [rsvp.guestEmail, rsvp.guestPhone].filter(Boolean).map((value) => escapeHtml(value ?? "")).join(" / ") || (chinese ? "未提供" : "Not provided");
    const optional = [rsvp.dietaryPreferences, rsvp.message].filter(Boolean).map((value) => escapeHtml(value ?? ""));
    return `<li style="margin: 0 0 16px;"><strong>${escapeHtml(rsvp.guestName)}</strong><br />${chinese ? "状态" : "Status"}: ${escapeHtml(statusLabel(rsvp.status, chinese))}<br />${chinese ? "人数" : "Party size"}: ${rsvp.partySize}<br />${chinese ? "联系方式" : "Contact"}: ${contact}${optional.length ? `<br />${optional.join("<br />")}` : ""}</li>`;
  }).join("");
  const subject = chinese ? `「${invitation.title}」新增 ${count} 条 RSVP` : `${count} new RSVP${count === 1 ? "" : "s"} for ${invitation.title}`;
  const intro = chinese ? `你的邀请函「${title}」在过去一小时收到 ${count} 条新的 RSVP。` : `Your invitation “${title}” received ${count} new RSVP${count === 1 ? "" : "s"} in the past hour.`;
  const link = invitationUrl ? `<p><a href="${invitationUrl}" style="display: inline-block; padding: 12px 24px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">${chinese ? "查看邀请函" : "View invitation"}</a></p>` : "";

  return {
    subject,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
  <p>${chinese ? "你好，" : "Hello,"}</p>
  <p>${intro}</p>
  ${details.length ? `<p>${details.join("<br />")}</p>` : ""}
  <ul style="padding-left: 20px;">${rows}</ul>
  ${link}
  <p style="color: #737373; font-size: 14px;">${chinese ? "这是一封来自 Carte 的 RSVP 汇总通知。" : "This is an RSVP digest from Carte."}</p>
</div>`.trim(),
  };
}

async function createDigestForInvitation(invitation: DigestInvitation, now: Date) {
  return prisma.$transaction(async (transaction) => {
    const candidates = await transaction.rSVP.findMany({
      where: { invitationId: invitation.id, notificationSentAt: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        status: true,
        partySize: true,
        dietaryPreferences: true,
        message: true,
        createdAt: true,
      },
    });
    if (candidates.length === 0) return null;

    const claimedIds: string[] = [];
    for (const candidate of candidates) {
      const claimed = await transaction.rSVP.updateMany({
        where: { id: candidate.id, notificationSentAt: null },
        data: { notificationSentAt: now },
      });
      if (claimed.count === 1) claimedIds.push(candidate.id);
    }
    if (claimedIds.length === 0) return null;

    const claimedRsvps = candidates.filter((candidate) => claimedIds.includes(candidate.id));
    const email = buildRsvpDigestEmail(invitation, claimedRsvps, invitation.user.locale || invitation.locale);
    const notification = await transaction.rSVPNotification.create({
      data: {
        invitationId: invitation.id,
        userId: invitation.user.id,
        recipientEmail: invitation.user.email,
        recipientName: invitation.user.name,
        rsvpIds: claimedIds,
        rsvpCount: claimedRsvps.length,
        subject: email.subject,
        message: email.html,
        status: "pending",
        emailSend: {
          create: {
            invitationId: invitation.id,
            userId: invitation.user.id,
            recipientEmail: invitation.user.email,
            recipientName: invitation.user.name,
            subject: email.subject,
            message: email.html,
            status: "pending",
          },
        },
      },
      include: { emailSend: { select: { id: true } } },
    });
    if (!notification.emailSend) {
      throw new Error("RSVP_NOTIFICATION_EMAIL_SEND_MISSING");
    }
    return {
      id: notification.id,
      invitationId: invitation.id,
      rsvpCount: claimedRsvps.length,
      emailSendId: notification.emailSend.id,
    };
  });
}

export async function queuePendingNotifications() {
  if (!isEnabled()) return 0;
  const pending = await prisma.emailSend.findMany({
    where: {
      status: "pending",
      rsvpNotification: { is: { status: "pending" } },
    },
    select: { id: true, rsvpNotification: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });
  let queuedCount = 0;
  for (const send of pending) {
    if (!send.rsvpNotification) continue;
    const claimed = await prisma.rSVPNotification.updateMany({
      where: { id: send.rsvpNotification.id, status: "pending" },
      data: { status: "queued" },
    });
    if (claimed.count !== 1) continue;
    try {
      await enqueueInvitationEmails([send.id]);
      queuedCount += 1;
    } catch (error) {
      await prisma.rSVPNotification.updateMany({
        where: { id: send.rsvpNotification.id, status: "queued" },
        data: { status: "pending", errorMessage: "Email queue is unavailable." },
      });
      throw error;
    }
  }
  return queuedCount;
}

export async function runRsvpNotificationDigest(now = new Date()): Promise<DigestResult> {
  if (!isEnabled()) return { notifications: [], queuedCount: 0, skipped: true };
  const invitations = await prisma.invitation.findMany({
    where: { rsvps: { some: { notificationSentAt: null } } },
    select: {
      id: true,
      title: true,
      slug: true,
      locale: true,
      eventDate: true,
      eventLocation: true,
      user: { select: { id: true, email: true, name: true, locale: true } },
    },
    orderBy: { id: "asc" },
  });
  const notifications = [] as DigestResult["notifications"];
  for (const invitation of invitations) {
    const notification = await createDigestForInvitation(invitation, now);
    if (notification) notifications.push(notification);
  }
  let queuedCount = 0;
  try {
    queuedCount = await queuePendingNotifications();
  } catch (error) {
    console.warn("[RSVPNotification] queue unavailable; pending digests will retry", error);
  }
  return { notifications, queuedCount, skipped: false };
}

function intervalMilliseconds() {
  const configured = Number(process.env.RSVP_NOTIFICATION_INTERVAL_MS);
  return Number.isFinite(configured) && configured >= 1_000 ? configured : DEFAULT_INTERVAL_MS;
}

export function startRsvpNotificationScheduler() {
  if (!isEnabled() || globalForRsvpNotification.rsvpNotificationTimer) return;
  const run = () => {
    globalForRsvpNotification.rsvpNotificationRun ??= runRsvpNotificationDigest()
      .then((result) => {
        if (result.notifications.length > 0) {
          console.info(`[RSVPNotification] created ${result.notifications.length} digest(s) for ${result.notifications.reduce((total, item) => total + item.rsvpCount, 0)} RSVP(s)`);
        }
      })
      .catch((error) => console.error("[RSVPNotification] digest run failed", error))
      .finally(() => { globalForRsvpNotification.rsvpNotificationRun = undefined; });
  };
  if (process.env.RSVP_NOTIFICATION_RUN_ON_START === "1") run();
  globalForRsvpNotification.rsvpNotificationTimer = setInterval(run, intervalMilliseconds());
  globalForRsvpNotification.rsvpNotificationTimer.unref?.();
  console.info(`[RSVPNotification] scheduler started (interval=${intervalMilliseconds()}ms)`);
}

export const rsvpNotificationConfig = {
  intervalMs: DEFAULT_INTERVAL_MS,
};
