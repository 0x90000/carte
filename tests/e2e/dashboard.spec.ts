import { expect, test } from "@playwright/test";
import { signInWithTestCode } from "./helpers";

const invitationId = process.env.DASHBOARD_TEST_INVITATION_ID;
const invitationTitle = process.env.DASHBOARD_TEST_INVITATION_TITLE ?? "Dashboard E2E";
const testEmail = process.env.DASHBOARD_TEST_EMAIL ?? "dashboard-e2e@carte.test";

test("filters, duplicates, and deletes invitations from the dashboard", async ({ page }) => {
  test.skip(!invitationId || process.env.DASHBOARD_TEST_MODE !== "1", "Set DASHBOARD_TEST_MODE=1 and DASHBOARD_TEST_INVITATION_ID to run dashboard mutations.");

  await page.goto("/login");
  await signInWithTestCode(page, testEmail);
  await page.waitForURL(/\/dashboard/);
  await page.goto(`/dashboard?status=published&q=${encodeURIComponent(invitationTitle)}`);

  await expect(page.getByRole("heading", { name: invitationTitle, exact: true })).toBeVisible();
  const overview = page.getByRole("region", { name: "Invitation overview" });
  await expect(overview.getByText("Total invitations", { exact: true }).locator("..")).toContainText("1");
  await expect(overview.getByText("Published", { exact: true }).locator("..")).toContainText("1");
  await expect(overview.getByText("Guest responses", { exact: true }).locator("..")).toContainText("2");
  await expect(overview.getByText("Total views", { exact: true }).locator("..")).toContainText("12");
  await page.getByRole("button", { name: `Duplicate ${invitationTitle}` }).click();

  const duplicateTitle = `${invitationTitle} (copy)`;
  await page.goto(`/dashboard?status=all&q=${encodeURIComponent(invitationTitle)}`);
  await expect(page.getByRole("heading", { name: duplicateTitle, exact: true })).toBeVisible();
  await page.getByRole("button", { name: `Delete ${duplicateTitle}` }).click();
  await page.getByRole("button", { name: "Delete invitation", exact: true }).click();
  await expect(page.getByRole("heading", { name: duplicateTitle, exact: true })).not.toBeVisible();
});
