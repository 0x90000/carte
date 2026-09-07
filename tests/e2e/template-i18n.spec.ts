import { expect, test } from "@playwright/test";

const templateId = "d3c0e5f4-0001-4a41-9b07-8c1d4f9b0001";

test("localizes template detail pages and exposes locale SEO metadata", async ({ page }) => {
  test.skip(process.env.I18N_TEST_MODE !== "1", "Set I18N_TEST_MODE=1 to run localized template checks.");

  await page.goto(`/en/templates/${templateId}`);
  await expect(page).toHaveTitle("A Love Letter / 云栖竹径 | Carte");
  await expect(page.getByRole("heading", { name: "A Love Letter / 云栖竹径", exact: true })).toBeVisible();
  await expect(page.getByText("Layers", { exact: true })).toBeVisible();
  await expect(page.getByText("Colorways", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "All templates", exact: true })).toHaveAttribute("href", "/en/templates");
  await expect(page.getByRole("button", { name: /Use this template/ })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/en/templates/${templateId}$`));
  await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveAttribute("href", new RegExp(`/zh-CN/templates/${templateId}$`));

  await page.goto("/zh-CN/templates");
  await expect(page.locator('section[aria-label="邀请函模板"]').getByText("A Love Letter / 云栖竹径", { exact: true })).toBeVisible();

  await page.goto(`/zh-CN/templates/${templateId}`);
  await expect(page).toHaveTitle("A Love Letter / 云栖竹径 | Carte");
  await expect(page.getByRole("heading", { name: "A Love Letter / 云栖竹径", exact: true })).toBeVisible();
  await expect(page.getByText("图层", { exact: true })).toBeVisible();
  await expect(page.getByText("配色方案", { exact: true })).toBeVisible();
  await expect(page.locator(".template-preview-toolbar-label")).toContainText("纯色背景");
  await expect(page.getByRole("link", { name: "全部模板", exact: true })).toHaveAttribute("href", "/zh-CN/templates");
  await expect(page.getByRole("button", { name: /使用此模板/ })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/zh-CN/templates/${templateId}$`));
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", new RegExp(`/en/templates/${templateId}$`));
});
