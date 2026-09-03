import { expect, test } from "@playwright/test";
import { createGuestDraft } from "./helpers";

test.describe("advanced editor text controls", () => {
  test("changes a text layer font, size, and color", async ({ page }) => {
    test.skip(process.env.ADVANCED_EDITOR_TEST_MODE !== "1", "Set ADVANCED_EDITOR_TEST_MODE=1 to run the advanced editor flow.");

    const invitationId = await createGuestDraft(page);
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
  });
});
