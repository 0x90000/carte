import { expect, test } from "@playwright/test";

test.describe("advanced editor text controls", () => {
  test("changes a text layer font, size, and color", async ({ page }) => {
    test.skip(process.env.ADVANCED_EDITOR_TEST_MODE !== "1", "Set ADVANCED_EDITOR_TEST_MODE=1 to run the advanced editor flow.");

    await page.goto("/en/templates?scene=wedding");
    await page.locator('a[href^="/en/templates/"]').first().click();
    await page.getByRole("link", { name: /Use this template/ }).click();
    await page.waitForURL(/\/en\/editor\/[^/?]+$/);
    await page.getByText("Not logged in. Your draft will be saved for 7 days.").waitFor();

    const invitationId = new URL(page.url()).pathname.split("/").pop();
    if (!invitationId) {
      throw new Error(`Could not determine invitation id from ${page.url()}`);
    }
    await page.getByRole("button", { name: "Select Couple names" }).click();

    await page.getByLabel("Font family").selectOption("Georgia");
    await page.getByLabel("Font size").fill("42");
    await page.getByLabel("Text color").fill("#ff0000");
    await page.getByRole("button", { name: /^Save$/ }).click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();

    const response = await page.request.get(`/api/invitations/${invitationId}`);
    expect(response.ok()).toBeTruthy();
    const payload = (await response.json()) as { data?: { content?: { layers?: Array<{ id?: string; content?: { font?: { family?: string; size?: number }; color?: string } }> } } };
    const titleLayer = payload.data?.content?.layers?.find((layer) => layer.id === "title");
    expect(titleLayer?.content?.font?.family).toBe("Georgia");
    expect(titleLayer?.content?.font?.size).toBe(42);
    expect(titleLayer?.content?.color).toBe("#ff0000");

    await page.goto(`/zh-CN/editor/${invitationId}`);
    await page.getByRole("button", { name: "选择 Couple names" }).click();
    await expect(page.getByLabel("字体")).toBeVisible();
    await expect(page.getByLabel("字号")).toBeVisible();
    await expect(page.getByLabel("文字颜色")).toBeVisible();
  });
});
