import { expect, test } from "@playwright/test";

test.describe("SEO surfaces", () => {
  test("serves a sitemap and robots policy for public routes", async ({ request }) => {
    const sitemapResponse = await request.get("/sitemap.xml");
    expect(sitemapResponse.ok()).toBeTruthy();
    expect(sitemapResponse.headers()["content-type"]).toContain("xml");
    const sitemap = await sitemapResponse.text();
    expect(sitemap).toContain("/en/templates");
    expect(sitemap).toContain("/zh-CN/templates");
    expect(sitemap).not.toContain("/dashboard");
    expect(sitemap).not.toContain("/editor");

    const robotsResponse = await request.get("/robots.txt");
    expect(robotsResponse.ok()).toBeTruthy();
    const robots = await robotsResponse.text();
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Disallow: /dashboard");
    expect(robots).toContain("Sitemap:");
  });

  test("exposes homepage title, description, and Open Graph metadata", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Carte | Invitations with intention");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Create thoughtful digital invitations for the moments worth gathering for.",
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Carte | Invitations with intention",
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      "Create thoughtful digital invitations for the moments worth gathering for.",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/en$/);
    await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveAttribute("href", /\/zh-CN$/);

    await page.goto("/zh-CN");
    await expect(page).toHaveTitle("Carte｜用心设计的邀请函");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "为值得相聚的时刻，制作一份恰到好处的数字邀请函。",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/zh-CN$/);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", /\/en$/);
  });
});
