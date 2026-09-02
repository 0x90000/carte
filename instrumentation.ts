export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const cleanupEnabled = process.env.NODE_ENV === "production" || process.env.GUEST_DRAFT_CLEANUP_ENABLED === "true";
  if (cleanupEnabled) {
    const { startGuestDraftCleanup } = await import("./lib/guest-draft-cleanup");
    await startGuestDraftCleanup();
  }

  const queueEnabled = process.env.EMAIL_QUEUE_ENABLED !== "false" && (process.env.NODE_ENV === "production" || process.env.EMAIL_QUEUE_ENABLED === "true");
  if (queueEnabled) {
    const { startInvitationEmailWorker } = await import("./lib/invitation-email-queue");
    void startInvitationEmailWorker();
  }
}
