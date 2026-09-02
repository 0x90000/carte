import { expect, test } from "@playwright/test";

test("renders localized invitation and submits localized RSVP", async ({ page }) => {
  test.skip(process.env.INVITATION_I18N_TEST_MODE !== "1", "Set INVITATION_I18N_TEST_MODE=1 to run invitation locale checks.");

  const slug = process.env.INVITATION_I18N_SLUG?.trim();
  if (!slug) {
    throw new Error("INVITATION_I18N_SLUG must be set when running invitation locale checks");
  }

  await page.goto(`/en/i/${slug}`);
  await expect(page.getByText("You are invited", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "RSVP", exact: true })).toBeVisible();
  await expect(page.getByText("December 24, 2026", { exact: true })).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", `You're invited to Phase 2 RSVP i18n fixture`);

  await page.getByRole("button", { name: "Submit RSVP", exact: true }).click();
  await expect(page.getByText("Name is required.", { exact: true })).toBeVisible();
  await expect(page.getByText("Enter an email or phone number.", { exact: true })).toBeVisible();

  await page.getByLabel("Name", { exact: true }).fill("English Guest");
  await page.getByLabel("Email", { exact: true }).fill(`en-${Date.now()}@carte.test`);
  await page.getByRole("button", { name: "Submit RSVP", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Thank you for your RSVP.", exact: true })).toBeVisible();

  await page.goto(`/zh-CN/i/${slug}`);
  await expect(page.getByText("诚邀您的到来", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "RSVP 回复", exact: true })).toBeVisible();
  await expect(page.getByText("2026年12月24日", { exact: true })).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "诚邀你参加 Phase 2 RSVP i18n fixture");

  await page.getByLabel("姓名", { exact: true }).fill("中文访客");
  await page.getByLabel("邮箱", { exact: true }).fill(`zh-${Date.now()}@carte.test`);
  await page.getByRole("button", { name: "提交 RSVP", exact: true }).click();
  await expect(page.getByRole("heading", { name: "感谢你的 RSVP 回复。", exact: true })).toBeVisible();
});
