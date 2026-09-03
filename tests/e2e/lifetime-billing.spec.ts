import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import { signInWithTestCode } from "./helpers";

const enabled = process.env.LIFETIME_BILLING_TEST_MODE === "1";
const standardEmail = process.env.BILLING_STANDARD_EMAIL ?? "billing-standard@carte.test";
const standardInvitationId = process.env.BILLING_STANDARD_INVITATION_ID;
const lifetimeEmail = process.env.BILLING_LIFETIME_EMAIL ?? "billing-lifetime@carte.test";
const lifetimeUserId = process.env.BILLING_LIFETIME_USER_ID;
const lifetimeInvitationIds = (process.env.BILLING_LIFETIME_INVITATION_IDS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const webhookSecret = process.env.BILLING_WEBHOOK_SECRET;

test.describe.serial("single-publish and lifetime billing", () => {
  test("shows only one-time and lifetime choices to a standard account", async ({ page }) => {
    test.skip(!enabled || !standardInvitationId, "Set the isolated standard billing fixture variables.");

    await page.goto("/en/login");
    await signInWithTestCode(page, standardEmail);
    await page.waitForURL(/\/en\/dashboard/);
    await expect(page.getByRole("button", { name: "Buy lifetime access for $299" })).toBeVisible();

    await page.goto(`/en/editor/${standardInvitationId}`);
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "One-time publish" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lifetime access" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pay $9.90 and publish" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buy lifetime and publish" })).toBeVisible();
    await expect(page.getByText("3-pack", { exact: false })).toHaveCount(0);
    await expect(page.getByText("10-pack", { exact: false })).toHaveCount(0);

    const invalidCheckout = await page.request.post("/api/payment/create-checkout", {
      data: { purchaseType: "single_publish" },
    });
    expect(invalidCheckout.status()).toBe(400);
    expect(await invalidCheckout.json()).toMatchObject({
      success: false,
      error: { code: "INVALID_CHECKOUT" },
    });
  });

  test("grants lifetime access idempotently and enforces ten UTC publications", async ({ page, request }) => {
    test.skip(
      !enabled || lifetimeInvitationIds.length !== 11 || !lifetimeUserId || !webhookSecret,
      "Set one bound invitation, ten additional invitations, and the webhook secret.",
    );

    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      id: `evt_lifetime_e2e_${timestamp}`,
      object: "event",
      api_version: "2024-12-18.acacia",
      created: timestamp,
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      type: "checkout.session.completed",
      data: {
        object: {
          id: `cs_lifetime_e2e_${timestamp}`,
          object: "checkout.session",
          amount_total: 29900,
          currency: "usd",
          payment_intent: `pi_lifetime_e2e_${timestamp}`,
          payment_status: "paid",
          metadata: {
            userId: lifetimeUserId!,
            invitationId: lifetimeInvitationIds[0],
            purchaseType: "lifetime",
          },
        },
      },
    });
    const signature = createHmac("sha256", webhookSecret!)
      .update(`${timestamp}.${body}`, "utf8")
      .digest("hex");
    const headers = {
      "content-type": "application/json",
      "stripe-signature": `t=${timestamp},v1=${signature}`,
    };

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const webhook = await request.post("/api/payment/webhook", { data: body, headers });
      expect(webhook.status()).toBe(200);
      expect(await webhook.json()).toEqual({ received: true });
    }

    await page.goto("/en/login");
    await signInWithTestCode(page, lifetimeEmail);
    await page.waitForURL(/\/en\/dashboard/);
    await expect(page.getByRole("heading", { name: "Lifetime access", exact: true })).toBeVisible();
    await expect(page.getByText("9 of 10 publications remaining today (1 used).", { exact: true })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr").first()).toContainText("$299.00");

    for (const invitationId of lifetimeInvitationIds.slice(1, 10)) {
      const publish = await page.request.post(`/api/invitations/${invitationId}/publish`);
      expect(publish.status()).toBe(200);
    }

    const overLimit = await page.request.post(`/api/invitations/${lifetimeInvitationIds[10]}/publish`);
    expect(overLimit.status()).toBe(429);
    expect(await overLimit.json()).toMatchObject({
      success: false,
      error: { code: "DAILY_LIMIT_REACHED" },
      data: { dailyLimit: 10, remainingToday: 0 },
    });

    await page.goto("/en/dashboard");
    await expect(page.getByText("0 of 10 publications remaining today (10 used).", { exact: true })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(1);
  });
});
