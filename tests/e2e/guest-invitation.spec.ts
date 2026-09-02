import { expect, test } from "@playwright/test";
import { createGuestDraft } from "./helpers";

test.describe("guest invitation creation", () => {
  test("creates a seven-day guest draft, saves edits, and requires sign-in to publish", async ({ page }) => {
    const invitationId = await createGuestDraft(page);
    const title = `E2E guest invitation ${Date.now()}`;

    const titleInput = page.getByLabel("Invitation title");
    await titleInput.fill(title);
    await page.getByRole("button", { name: /^Save$/ }).click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Invitation title")).toHaveValue(title);
    await expect(page.getByText("Not logged in. Your draft will be saved for 7 days.")).toBeVisible();

    await page.getByRole("button", { name: /^Publish$/ }).click();
    await page.waitForURL(/\/login\?continue=/);

    const loginUrl = new URL(page.url());
    expect(loginUrl.pathname).toBe("/login");
    expect(loginUrl.searchParams.get("continue")).toBe(`/editor/${invitationId}?action=publish`);
  });
});
