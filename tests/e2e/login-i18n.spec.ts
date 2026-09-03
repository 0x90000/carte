import { expect, test } from "@playwright/test";

test("localizes the login workflow and returns stable request-code errors", async ({ page, request }) => {
  test.skip(process.env.I18N_TEST_MODE !== "1", "Set I18N_TEST_MODE=1 to run localized login checks.");

  await page.goto("/en/login");
  await expect(page).toHaveTitle("Sign in | Carte");
  await expect(page.getByRole("heading", { name: "Sign in to your studio", exact: true })).toBeVisible();
  await expect(page.getByText("Your email", { exact: true })).toBeVisible();
  await expect(page.getByText("Verification", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with email", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google", exact: true })).toBeVisible();

  await page.goto("/zh-CN/login");
  await expect(page).toHaveTitle("登录 | Carte");
  await expect(page.getByRole("heading", { name: "登录你的工作室", exact: true })).toBeVisible();
  await expect(page.getByText("你的邮箱", { exact: true })).toBeVisible();
  await expect(page.getByText("验证", { exact: true })).toBeVisible();
  await expect(page.getByLabel("邮箱地址", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "使用邮箱继续", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "使用 Google 继续", exact: true })).toBeVisible();

  const invalidEmailResponse = await request.post("/api/auth/request-code", { data: { email: "invalid" } });
  expect(invalidEmailResponse.status()).toBe(400);
  expect(await invalidEmailResponse.json()).toEqual({ errorCode: "invalidEmail" });
});
