import cron, { type ScheduledTask } from "node-cron";
import { prisma } from "@/lib/prisma";

const DEFAULT_SCHEDULE = "0 * * * *";
let cleanupTask: ScheduledTask | null = null;
let startPromise: Promise<void> | null = null;

function cleanupSchedule() {
  return process.env.GUEST_DRAFT_CLEANUP_SCHEDULE?.trim() || DEFAULT_SCHEDULE;
}

export async function purgeExpiredGuestDrafts(now = new Date()) {
  const result = await prisma.guestDraft.deleteMany({
    where: {
      expiresAt: { lt: now },
    },
  });

  return result.count;
}

async function runCleanup(trigger: "startup" | "scheduled") {
  try {
    const count = await purgeExpiredGuestDrafts();
    console.info(`[GuestDraftCleanup] ${trigger}: removed ${count} expired drafts`);
  } catch (error) {
    console.error(`[GuestDraftCleanup] ${trigger} run failed`, error);
  }
}

export async function startGuestDraftCleanup() {
  if (cleanupTask || startPromise) {
    return startPromise;
  }

  const schedule = cleanupSchedule();
  if (!cron.validate(schedule)) {
    console.error(`[GuestDraftCleanup] invalid cron schedule: ${schedule}`);
    return null;
  }

  startPromise = (async () => {
    await runCleanup("startup");
    cleanupTask = cron.schedule(schedule, () => runCleanup("scheduled"), {
      name: "carte-guest-draft-cleanup",
      noOverlap: true,
    });
  })();

  try {
    await startPromise;
  } finally {
    startPromise = null;
  }

  return null;
}
