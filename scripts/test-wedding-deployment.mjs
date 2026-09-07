import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = process.argv[2];
assert.ok(base, "Pass the test server URL explicitly.");

const templateId = "d3c0e5f4-0001-4a41-9b07-8c1d4f9b0001";
const template = JSON.parse(await readFile(path.resolve("prisma/templates/wedding-0001.json"), "utf8"));
assert.equal(template.id, templateId);

const report = path.resolve("test-results/wedding-deployment");
await mkdir(report, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));

  const listResponse = await context.request.get(`${base}/api/templates?scene=wedding`);
  assert.equal(listResponse.status(), 200, "Template list API failed");
  const listed = (await listResponse.json()).data;
  assert.equal(listed.length, 1, "More than one active wedding template is deployed");
  assert.equal(listed[0].id, templateId);

  const detailResponse = await context.request.get(`${base}/api/templates/${templateId}`);
  assert.equal(detailResponse.status(), 200, "Template detail API failed");
  assert.deepEqual((await detailResponse.json()).data.structure, template, "Deployed structure differs");

  const oldResponse = await context.request.get(`${base}/api/templates/3c8b3e51-9a1a-4d42-bd12-fd75a4a5d101`);
  assert.equal(oldResponse.status(), 404, "A removed template is still available");

  const assetUrls = new Set([template.thumbnailUrl, template.previewUrl, ...template.assets.map((asset) => asset.url).filter(Boolean)]);
  for (const asset of assetUrls) {
    const response = await context.request.get(`${base}${asset}`);
    assert.equal(response.status(), 200, `${asset}: missing deployed asset`);
    assert.ok((await response.body()).length > 100, `${asset}: empty deployed asset`);
  }

  await page.goto(`${base}/en/templates/${templateId}`);
  assert.ok(!(await page.locator("body").innerText()).includes("templates.detail."), "Missing template translations");
  await page.getByRole("link", { name: /Use this template/ }).click();
  await page.waitForURL(/\/editor\/(?!new)[^/?]+$/, { timeout: 45000 });
  await page.locator(".scene-preview-device").waitFor();
  assert.ok(await page.locator(".scene-preview-device").boundingBox(), "Scene graph preview is not visible");
  await page.screenshot({ path: path.join(report, "editor-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".scene-preview-device").scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, "Mobile page overflows horizontally");
  const mobilePreview = await page.locator(".scene-preview-device").boundingBox();
  assert.ok(mobilePreview && mobilePreview.width <= 390 && mobilePreview.width > 150, "Mobile preview has an invalid width");
  await page.screenshot({ path: path.join(report, "editor-mobile.png"), fullPage: true });

  assert.deepEqual(errors, []);
  console.log(`${template.name}: API, ${assetUrls.size} assets, scene graph editor, desktop/mobile preview: OK`);
} finally {
  await browser.close();
}
