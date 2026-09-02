import type { Page } from "@playwright/test";

export function createTestEmail() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `e2e-${suffix}@carte.test`;
}

export async function createGuestDraft(page: Page) {
  await page.goto("/create");
  await page.getByRole("link", { name: "Wedding" }).click();
  await page.waitForURL(/\/templates\?scene=wedding$/);
  await page.locator('a[href^="/templates/"]').first().click();
  await page.getByRole("link", { name: /Use this template/ }).click();
  await page.waitForURL(/\/editor\/[^/?]+$/);
  await page.getByText("Not logged in. Your draft will be saved for 7 days.").waitFor();

  const editorUrl = new URL(page.url());
  const invitationId = editorUrl.pathname.split("/").pop();
  if (!invitationId) {
    throw new Error(`Could not determine invitation id from ${page.url()}`);
  }

  return invitationId;
}

export async function signInWithTestCode(page: Page, email: string) {
  const code = process.env.E2E_TEST_EMAIL_CODE?.trim();
  if (!code || !/^\d{6}$/.test(code)) {
    throw new Error("E2E_TEST_EMAIL_CODE must be a six-digit code when running E2E tests");
  }

  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.getByLabel("Verification code").fill(code);
  await page.getByRole("button", { name: "Sign in" }).click();
}
