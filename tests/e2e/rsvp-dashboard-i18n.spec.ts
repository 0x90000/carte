import { expect, test } from "@playwright/test";
import { signInWithTestCode } from "./helpers";

test("localizes the RSVP management dashboard", async ({ page }) => {
  test.skip(process.env.RSVP_DASHBOARD_I18N_TEST_MODE !== "1", "Set RSVP_DASHBOARD_I18N_TEST_MODE=1 to run RSVP dashboard locale checks.");

  const invitationId = process.env.RSVP_DASHBOARD_I18N_INVITATION_ID?.trim();
  const invitationTitle = process.env.RSVP_DASHBOARD_I18N_INVITATION_TITLE?.trim();
  const testEmail = process.env.RSVP_DASHBOARD_I18N_EMAIL?.trim();
  if (!invitationId || !invitationTitle || !testEmail) {
    throw new Error("RSVP_DASHBOARD_I18N_INVITATION_ID, RSVP_DASHBOARD_I18N_INVITATION_TITLE, and RSVP_DASHBOARD_I18N_EMAIL are required");
  }

  await page.goto("/en/login");
  await signInWithTestCode(page, testEmail);
  await page.waitForURL(/\/en\/dashboard/);

  await page.goto(`/zh-CN/dashboard/invitations/${invitationId}/rsvps`);
  await expect(page.getByRole("heading", { name: invitationTitle, exact: true })).toBeVisible();
  await expect(page.getByText("RSVP 回复", { exact: true })).toBeVisible();
  await expect(page.getByText("回复数", { exact: true }).locator("..")).toContainText("3");
  await expect(page.getByText("确认出席", { exact: true }).first().locator("..")).toContainText("1");
  await expect(page.getByText("无法出席", { exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "宾客", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "中文访客", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "导出 CSV", exact: true })).toHaveAttribute("href", `/api/invitations/${invitationId}/rsvps/export`);

  await page.goto(`/en/dashboard/invitations/${invitationId}/rsvps`);
  await expect(page.getByText("RSVP responses", { exact: true })).toBeVisible();
  await expect(page.getByText("Responses", { exact: true }).locator("..")).toContainText("3");
  await expect(page.getByRole("columnheader", { name: "Guest", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Export CSV", exact: true })).toBeVisible();
});
