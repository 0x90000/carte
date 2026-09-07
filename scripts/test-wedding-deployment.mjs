import assert from "node:assert/strict";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = process.argv[2];
assert.ok(base, "Pass the test server URL explicitly.");

const templateDirectory = path.resolve("prisma/templates");
const templateFiles = (await readdir(templateDirectory)).filter((file) => /^wedding-\d{4}\.json$/.test(file)).sort();
const templates = await Promise.all(templateFiles.map(async (file) => JSON.parse(await readFile(path.join(templateDirectory, file), "utf8"))));
assert.equal(templates.length, 11, "Expected wedding-0001 through wedding-0011 descriptors");

const report = path.resolve("test-results/wedding-deployment");
await mkdir(report, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));

  const listResponse = await context.request.get(`${base}/api/templates?scene=wedding&limit=50`);
  assert.equal(listResponse.status(), 200, "Template list API failed");
  const listPayload = await listResponse.json();
  assert.equal(listPayload.meta.total, templates.length, "Unexpected number of active wedding templates");
  assert.deepEqual(listPayload.data.map((item) => item.id).sort(), templates.map((template) => template.id).sort(), "Deployed wedding template IDs differ");

  const assetUrls = new Set();
  for (const template of templates) {
    const detailResponse = await context.request.get(`${base}/api/templates/${template.id}`);
    assert.equal(detailResponse.status(), 200, `${template.name}: template detail API failed`);
    assert.deepEqual((await detailResponse.json()).data.structure, template, `${template.name}: deployed structure differs`);
    [template.thumbnailUrl, template.previewUrl, ...template.assets.map((asset) => asset.url)].filter(Boolean).forEach((url) => assetUrls.add(url));

    await page.goto(`${base}/en/templates/${template.id}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    assert.ok(!(await page.locator("body").innerText()).includes("templates.detail."), `${template.name}: missing template translations`);
    const layout = template.settings?.designVariant?.layout;
    if (layout) {
      await page.locator(`.wedding-variant.layout-${layout}`).waitFor({ timeout: 15000 });
      assert.ok(await page.locator(`.wedding-variant.layout-${layout} .hero`).boundingBox(), `${template.name}: live variant preview is not visible`);
      await page.locator(".template-preview-viewport").screenshot({ path: path.join(report, `template-layout-${layout}.png`) });
    } else {
      await page.locator(".scene-invitation .scene-hero").waitFor({ timeout: 15000 });
    }
  }

  for (const asset of assetUrls) {
    const response = await context.request.get(`${base}${asset}`);
    assert.equal(response.status(), 200, `${asset}: missing deployed asset`);
    assert.ok((await response.body()).length > 100, `${asset}: empty deployed asset`);
  }

  const oldResponse = await context.request.get(`${base}/api/templates/3c8b3e51-9a1a-4d42-bd12-fd75a4a5d101`);
  assert.equal(oldResponse.status(), 404, "A removed template is still available");

  const editorTemplate = templates.find((template) => template.settings?.designVariant?.layout === 1);
  assert.ok(editorTemplate, "Layout 1 template is missing");
  await page.goto(`${base}/en/templates/${editorTemplate.id}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.getByRole("button", { name: /Use this template/ }).click();
  await page.waitForFunction(() => /\/editor\/(?!new)[^/?]+$/.test(window.location.pathname), undefined, { timeout: 45000 });
  await page.locator(".scene-preview-device .wedding-variant.layout-1").waitFor({ timeout: 15000 });
  assert.ok(await page.locator(".scene-preview-device .wedding-variant.layout-1 .hero").boundingBox(), "Scene graph editor preview is not visible");
  const soundToggle = page.locator(".scene-preview-device .sound-toggle");
  await soundToggle.click();
  assert.equal(await soundToggle.getAttribute("aria-pressed"), "true", "Music control did not expose its playing state");
  const album = page.locator(".scene-preview-device .album");
  const activeDotBefore = await album.locator(".album-dot.is-active").getAttribute("aria-label");
  await album.locator(".album-next").click();
  assert.notEqual(await album.locator(".album-dot.is-active").getAttribute("aria-label"), activeDotBefore, "Album next control did not change the active slide");
  await page.screenshot({ path: path.join(report, "editor-desktop.png"), fullPage: true });

  await page.getByRole("button", { name: /^Mobile$/ }).click();
  await page.locator(".scene-preview-device.is-preview-mobile .wedding-variant.variant-preview-mobile").waitFor({ timeout: 15000 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".scene-preview-device").scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, "Mobile page overflows horizontally");
  const mobilePreview = await page.locator(".scene-preview-device").boundingBox();
  assert.ok(mobilePreview && mobilePreview.width <= 390 && mobilePreview.width > 150, "Mobile preview has an invalid width");
  await page.screenshot({ path: path.join(report, "editor-mobile.png"), fullPage: true });

  assert.deepEqual(errors, []);
  console.log(`${templates.length} wedding templates, ${assetUrls.size} assets, live previews, and editor desktop/mobile modes: OK`);
} finally {
  await browser.close();
}
