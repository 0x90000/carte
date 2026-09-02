import { expect, test } from "@playwright/test";
import { signInWithTestCode } from "./helpers";

test("localizes the published invitation share page", async ({ page }) => {
  test.skip(process.env.SHARE_I18N_TEST_MODE !== "1", "Set SHARE_I18N_TEST_MODE=1 to run share locale checks.");

  const invitationId = process.env.SHARE_I18N_INVITATION_ID?.trim();
  const invitationTitle = process.env.SHARE_I18N_INVITATION_TITLE?.trim();
  const slug = process.env.SHARE_I18N_SLUG?.trim();
  const testEmail = process.env.SHARE_I18N_EMAIL?.trim();
  if (!invitationId || !invitationTitle || !slug || !testEmail) {
    throw new Error("SHARE_I18N_INVITATION_ID, SHARE_I18N_INVITATION_TITLE, SHARE_I18N_SLUG, and SHARE_I18N_EMAIL are required");
  }

  await page.goto("/en/login");
  await signInWithTestCode(page, testEmail);
  await page.waitForURL(/\/en\/dashboard/);

  await page.goto(`/zh-CN/dashboard/invitations/${invitationId}/share`);
  await expect(page.getByRole("heading", { name: invitationTitle, exact: true })).toBeVisible();
  await expect(page.getByText("分享邀请函", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "公开链接", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "打开邀请函", exact: true })).toHaveAttribute("href", `/zh-CN/i/${slug}`);
  await expect(page.getByRole("img", { name: `${invitationTitle} 的二维码`, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "复制链接", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "分享", exact: true })).toBeVisible();

  await page.goto(`/en/dashboard/invitations/${invitationId}/share`);
  await expect(page.getByText("Share invitation", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Public link", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open invitation", exact: true })).toHaveAttribute("href", `/en/i/${slug}`);
  await expect(page.getByRole("img", { name: `QR code for ${invitationTitle}`, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy link", exact: true })).toBeVisible();
});
