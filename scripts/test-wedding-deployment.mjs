import assert from "node:assert/strict";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const base = process.argv[2];
assert.ok(base, "Pass the test server URL explicitly.");
const report = path.resolve("test-results/wedding-deployment");
await mkdir(report, { recursive: true });
const browser = await chromium.launch({ headless: true });
const drafts = [];
const previousDrafts = JSON.parse(await readFile(path.join(report, "guest-draft-ids.json"), "utf8").catch(() => "[]"));
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const files = (await readdir("prisma/templates")).filter((file) => /^wedding-.*\.json$/.test(file) && file !== "wedding-modern.json");
  for (const file of files) {
    const local = JSON.parse(await readFile(path.join("prisma/templates", file), "utf8"));
    const response = await context.request.get(`${base}/api/templates/${local.id}`);
    assert.equal(response.status(), 200, `${local.id}: API failed`);
    const remote = (await response.json()).data;
    assert.deepEqual(remote.structure, local, `${local.id}: deployed structure differs`);
    for (const asset of [local.thumbnailUrl, local.previewUrl, local.canvas.background.url]) {
      const assetResponse = await context.request.get(`${base}${asset}`);
      assert.equal(assetResponse.status(), 200, `${asset}: missing`);
      assert.ok((await sharp(await assetResponse.body()).metadata()).width > 0);
    }
    await page.goto(`${base}/en/templates/${local.id}`);
    assert.ok(!(await page.locator("body").innerText()).includes("templates.detail."), "Missing template translations");
    await page.getByRole("button", { name: "Use this template", exact: true }).click();
    await page.waitForURL(/\/editor\/(?!new)[^/?]+$/, { timeout: 45000 });
    const id = new URL(page.url()).pathname.split("/").at(-1);
    drafts.push(id);
    await page.waitForFunction(() => {
      const canvas = document.querySelector("canvas.lower-canvas");
      if (!canvas) return false;
      const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      let count = 0;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) count++;
      return count > 1000;
    });
    await page.evaluate(() => document.fonts.ready);
    const lower = page.locator("canvas.lower-canvas");
    const surface = lower.locator("../..");
    const bounds = await lower.boundingBox();
    const frame = await surface.boundingBox();
    assert.ok(Math.abs(bounds.width - frame.width) <= 1 && Math.abs(bounds.height - frame.height) <= 1, `${local.id}: Fabric is cropped`);
    const screenshot = await surface.screenshot({ path: path.join(report, `${local.id}-canvas.png`) });
    const actual = await sharp(screenshot).resize(375, 563).removeAlpha().blur(1).raw().toBuffer();
    const expected = await sharp(path.join("public", local.previewUrl)).resize(375, 563).removeAlpha().blur(1).raw().toBuffer();
    const difference = actual.reduce((sum, value, index) => sum + Math.abs(value - expected[index]), 0) / actual.length;
    assert.ok(difference < 12, `${local.id}: editor differs from preview (${difference.toFixed(2)}/255)`);
    console.log(`${local.name}: API, 3 images, editor OK; preview difference ${difference.toFixed(2)}/255`);
  }

  await page.getByRole("button", { name: "Select Couple Names", exact: true }).click();
  await page.locator("#layer-text").fill("Amelia\n&\nJames");
  await page.waitForResponse((response) => response.request().method() === "PATCH" && response.url().includes(`/api/invitations/${drafts.at(-1)}`) && response.ok());
  await page.reload();
  await page.getByRole("button", { name: "Select Couple Names", exact: true }).click();
  await page.locator("#layer-text").waitFor();
  assert.equal(await page.locator("#layer-text").inputValue(), "Amelia\n&\nJames");
  await page.screenshot({ path: path.join(report, "editor-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const lower = page.locator("canvas.lower-canvas");
  await lower.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(report, "editor-mobile.png"), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(overflow, false, "Mobile page overflows horizontally");
  const mobileCanvas = await lower.boundingBox();
  assert.ok(mobileCanvas.width <= 390 && mobileCanvas.width > 150);
  assert.deepEqual(errors, []);
  console.log("Text editing, autosave/reload, desktop/mobile: OK");
} finally {
  await writeFile(path.join(report, "guest-draft-ids.json"), JSON.stringify([...new Set([...previousDrafts, ...drafts])], null, 2));
  await browser.close();
  console.log(`Temporary guest drafts: ${drafts.join(", ")}`);
}
