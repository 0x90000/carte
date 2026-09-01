export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const enabled = process.env.GUEST_DRAFT_CLEANUP_ENABLED;
  if (process.env.NODE_ENV !== "production" && enabled !== "true") {
    return;
  }

  const { startGuestDraftCleanup } = await import("./lib/guest-draft-cleanup");
  await startGuestDraftCleanup();
}
