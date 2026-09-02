import { expect, test } from "@playwright/test";
import { createGuestDraft, createTestEmail, signInWithTestCode } from "./helpers";

test.describe("guest draft migration", () => {
  test("moves the guest draft to the signed-in account", async ({ page }) => {
    const invitationId = await createGuestDraft(page);
    const email = createTestEmail();

    await page.goto(`/login?continue=${encodeURIComponent(`/editor/${invitationId}`)}`);
    await signInWithTestCode(page, email);
    await page.waitForURL(new RegExp(`/editor/${invitationId}$`));

    await expect(page.getByText("Not logged in. Your draft will be saved for 7 days.")).not.toBeVisible();
    const response = await page.request.get(`/api/invitations/${invitationId}`);
    expect(response.ok()).toBeTruthy();

    const payload = (await response.json()) as { isGuest?: boolean; data?: { id?: string } };
    expect(payload.isGuest).toBe(false);
    expect(payload.data?.id).toBe(invitationId);

    const dashboardResponse = await page.request.get("/api/invitations");
    expect(dashboardResponse.ok()).toBeTruthy();
    const dashboardPayload = (await dashboardResponse.json()) as { isGuest?: boolean; data?: Array<{ id?: string }> };
    expect(dashboardPayload.isGuest).toBe(false);
    expect(dashboardPayload.data?.some((invitation) => invitation.id === invitationId)).toBe(true);

    await page.goto("/dashboard");
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await expect(page.getByText("Your invitations", { exact: true })).toBeVisible();
  });
});
