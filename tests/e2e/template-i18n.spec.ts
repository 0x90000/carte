import { expect, test } from "@playwright/test";

const templateId = "3c8b3e51-9a1a-4d42-bd12-fd75a4a5d101";

test("localizes template detail pages and exposes locale SEO metadata", async ({ page }) => {
  test.skip(process.env.I18N_TEST_MODE !== "1", "Set I18N_TEST_MODE=1 to run localized template checks.");

  await page.goto(`/en/templates/${templateId}`);
  await expect(page).toHaveTitle("Modern vows template | Carte");
  await expect(page.getByRole("heading", { name: "Modern vows", exact: true })).toBeVisible();
  await expect(page.getByText("Layers", { exact: true })).toBeVisible();
  await expect(page.getByText("Editable fields", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "All templates", exact: true })).toHaveAttribute("href", "/en/templates");
  await expect(page.getByRole("link", { name: /Use this template/ })).toHaveAttribute("href", `/en/editor/new?template=${templateId}`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/en/templates/${templateId}$`));
  await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveAttribute("href", new RegExp(`/zh-CN/templates/${templateId}$`));

  await page.goto("/zh-CN/templates");
  await expect(page.locator('section[aria-label="邀请函模板"]').getByText("现代", { exact: true })).toBeVisible();

  await page.goto(`/zh-CN/templates/${templateId}`);
  await expect(page).toHaveTitle("Modern vows 模板 | Carte");
  await expect(page.getByRole("heading", { name: "Modern vows", exact: true })).toBeVisible();
  await expect(page.getByText("图层", { exact: true })).toBeVisible();
  await expect(page.getByText("可编辑字段", { exact: true })).toBeVisible();
  await expect(page.getByText("配色方案", { exact: true })).toBeVisible();
  await expect(page.locator("section").getByText("图片背景", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "全部模板", exact: true })).toHaveAttribute("href", "/zh-CN/templates");
  await expect(page.getByRole("link", { name: /使用此模板/ })).toHaveAttribute("href", `/zh-CN/editor/new?template=${templateId}`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/zh-CN/templates/${templateId}$`));
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", new RegExp(`/en/templates/${templateId}$`));
});
