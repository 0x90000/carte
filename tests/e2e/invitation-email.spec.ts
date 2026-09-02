import { expect, test } from "@playwright/test";
import { signInWithTestCode } from "./helpers";

const invitationId = process.env.EMAIL_TEST_INVITATION_ID;
const testEmail = process.env.EMAIL_TEST_EMAIL ?? "e2e-email-20260902@carte.test";

test("creates an invitation email preview and queues immediate delivery", async ({ page }) => {
  test.skip(!invitationId, "Set EMAIL_TEST_INVITATION_ID to run the email flow against a published fixture.");

  await page.goto("/login");
  await signInWithTestCode(page, testEmail);
  await page.waitForURL(/\/dashboard/);

  await expect(page.getByRole("button", { name: "Send via email" })).toBeVisible();
  await page.getByRole("button", { name: "Send via email" }).click();
  await page.getByLabel("Recipients").fill("guest@example.com");
  await page.getByRole("button", { name: "Create preview" }).click();

  await expect(page.getByRole("status")).toContainText("1 email draft created.");
  const statusList = page.getByRole("list");
  await expect(statusList.getByText("guest@example.com").last()).toBeVisible();
  await expect(statusList.getByText("pending", { exact: true }).last()).toBeVisible();

  const responsePromise = page.waitForResponse((response) => response.url().includes(`/api/invitations/${invitationId}/send-emails`) && response.request().method() === "POST");
  await page.getByRole("button", { name: "Send now" }).click();
  expect((await responsePromise).status()).toBe(202);
  await expect(page.getByText("Email delivery queued.", { exact: true })).toBeVisible();
});

test("queues immediate invitation email delivery", async ({ page }) => {
  test.skip(!invitationId || process.env.EMAIL_TEST_QUEUE_MODE !== "1", "Set EMAIL_TEST_QUEUE_MODE=1 and EMAIL_TEST_INVITATION_ID to run the queue flow.");

  await page.goto("/login");
  await signInWithTestCode(page, testEmail);
  await page.waitForURL(/\/dashboard/);
  await page.getByRole("button", { name: "Send via email" }).click();
  await page.getByLabel("Recipients").fill("queue@example.com");

  const responsePromise = page.waitForResponse((response) => response.url().includes(`/api/invitations/${invitationId}/send-emails`) && response.request().method() === "POST");
  await page.getByRole("button", { name: "Send now" }).click();
  expect((await responsePromise).status()).toBe(202);
  await expect(page.getByText("Email delivery queued.", { exact: true })).toBeVisible();
});
