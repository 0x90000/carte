import { expect, test } from "@playwright/test";

test.describe("SEO surfaces", () => {
  test("serves a sitemap and robots policy for public routes", async ({ request }) => {
    const sitemapResponse = await request.get("/sitemap.xml");
    expect(sitemapResponse.ok()).toBeTruthy();
    expect(sitemapResponse.headers()["content-type"]).toContain("xml");
    const sitemap = await sitemapResponse.text();
    expect(sitemap).toContain("/templates");
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
  });
});
