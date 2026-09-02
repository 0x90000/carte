import { getResendClient, getInvitationEmailSender } from "@/lib/invitation-email";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

const QUEUE_KEY = "carte:email-send-queue";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2_000;

const globalForEmailQueue = globalThis as unknown as {
  workerPromise?: Promise<void>;
};

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function enqueueInvitationEmails(sendIds: string[]) {
  if (sendIds.length === 0) return;
  const redis = await getRedis();
  if (!redis) {
    throw new Error("EMAIL_QUEUE_UNAVAILABLE");
  }
  await redis.rPush(QUEUE_KEY, sendIds);
}

async function processEmailSend(sendId: string) {
  const send = await prisma.emailSend.findUnique({ where: { id: sendId } });
  if (!send || send.status === "sent") return;

  const attemptCount = send.attemptCount + 1;
  await prisma.emailSend.update({
    where: { id: send.id },
    data: { status: "sending", attemptCount, lastAttemptAt: new Date() },
  });

  try {
    const resend = getResendClient();
    if (!resend) {
      throw new Error("EMAIL_NOT_CONFIGURED");
    }
    const result = await resend.emails.send({
      from: getInvitationEmailSender(),
      to: send.recipientEmail,
      subject: send.subject,
      html: send.message ?? "",
    });
    if (result.error) {
      throw new Error(result.error.message);
    }
    await prisma.emailSend.update({
      where: { id: send.id },
      data: { status: "sent", sentAt: new Date(), errorMessage: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed.";
    if (attemptCount >= MAX_ATTEMPTS) {
      await prisma.emailSend.update({
        where: { id: send.id },
        data: { status: "failed", errorMessage: message },
      });
      return;
    }

    await prisma.emailSend.update({
      where: { id: send.id },
      data: { status: "pending", errorMessage: message },
    });
    await delay(RETRY_DELAY_MS * attemptCount);
    try {
      await enqueueInvitationEmails([send.id]);
    } catch (enqueueError) {
      console.error(`[InvitationEmailQueue] retry enqueue failed for ${send.id}`, enqueueError);
    }
  }
}

async function workerLoop() {
  console.info("[InvitationEmailQueue] worker started");
  while (true) {
    try {
      const redis = await getRedis();
      if (!redis) {
        await delay(5_000);
        continue;
      }
      const sendId = await redis.lPop(QUEUE_KEY);
      if (sendId) {
        await processEmailSend(sendId);
      } else {
        await delay(1_000);
      }
    } catch (error) {
      console.error("[InvitationEmailQueue] worker cycle failed", error);
      await delay(5_000);
    }
  }
}

export function startInvitationEmailWorker() {
  globalForEmailQueue.workerPromise ??= workerLoop();
  return globalForEmailQueue.workerPromise;
}

export const emailQueueConfig = {
  maxAttempts: MAX_ATTEMPTS,
  queueKey: QUEUE_KEY,
};
