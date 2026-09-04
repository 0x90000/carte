import { expect, test } from "@playwright/test";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test.describe("photo gallery", () => {
  test("adds, removes, and saves gallery photos", async ({ page }) => {
    test.skip(process.env.PHOTO_GALLERY_TEST_MODE !== "1", "Set PHOTO_GALLERY_TEST_MODE=1 to run the photo gallery flow.");

    await page.goto("/en/templates?scene=wedding");
    await page.locator('a[href^="/en/templates/"]').first().click();
    await page.getByRole("link", { name: /Use this template/ }).click();
    await page.waitForURL(/\/en\/editor\/[^/?]+$/);
    await page.getByText("Not logged in. Your draft will be saved for 7 days.").waitFor();

    const invitationId = new URL(page.url()).pathname.split("/").pop();
    if (!invitationId) {
      throw new Error(`Could not determine invitation id from ${page.url()}`);
    }

    await page.getByLabel("Choose gallery photos").setInputFiles([
      { name: "first.png", mimeType: "image/png", buffer: onePixelPng },
      { name: "second.png", mimeType: "image/png", buffer: onePixelPng },
    ]);
    await expect(page.getByRole("region", { name: "Photo gallery" }).getByLabel("Selected gallery photos")).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove gallery photo 1" })).toBeVisible();
    await page.getByRole("button", { name: "Remove gallery photo 1" }).click();
    await page.getByRole("button", { name: /^Save$/ }).click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();

    const response = await page.request.get(`/api/invitations/${invitationId}`);
    expect(response.ok()).toBeTruthy();
    const payload = (await response.json()) as { data?: { content?: { gallery?: Array<{ url?: string; alt?: string }> } } };
    expect(payload.data?.content?.gallery).toHaveLength(1);
    expect(payload.data?.content?.gallery?.[0]?.url).toMatch(/^data:image\/png;base64,/);
    expect(payload.data?.content?.gallery?.[0]?.alt).toBe("second");
  });

  test("renders the gallery grid on a published invitation", async ({ page }) => {
    const slug = process.env.PHOTO_GALLERY_INVITATION_SLUG?.trim();
    test.skip(!slug, "Set PHOTO_GALLERY_INVITATION_SLUG to run the published H5 gallery check.");

    await page.goto(`/en/i/${encodeURIComponent(slug as string)}`);
    await expect(page.getByRole("heading", { name: "Photo gallery", exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: /Gallery photo/ }).first()).toBeVisible();
  });
});
