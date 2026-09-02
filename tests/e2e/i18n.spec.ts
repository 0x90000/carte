import { expect, test } from "@playwright/test";

test("serves localized public pages and negotiates the browser locale", async ({ page, request }) => {
  test.skip(process.env.I18N_TEST_MODE !== "1", "Set I18N_TEST_MODE=1 to run localized route checks.");

  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "Make room for the moments that matter.", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Language" })).toBeVisible();
  await expect(page.getByRole("link", { name: "中文", exact: true })).toHaveAttribute("href", "/zh-CN");

  await page.goto("/zh-CN");
  await expect(page.getByRole("heading", { name: "为值得珍惜的时刻留出空间。", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "语言" })).toBeVisible();
  await expect(page.getByRole("link", { name: "English", exact: true })).toHaveAttribute("href", "/en");

  const negotiated = await request.get("/", { maxRedirects: 0, headers: { "accept-language": "zh-CN,zh;q=0.9,en;q=0.8" } });
  expect([307, 308]).toContain(negotiated.status());
  expect(negotiated.headers().location).toContain("/zh-CN");
});
