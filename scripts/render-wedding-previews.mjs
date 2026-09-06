import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artDir = path.join(root, "public/templates/wedding-art");
const reports = path.join(root, "test-results/wedding-art");
const contentTypes = { ".css": "text/css", ".ttf": "font/ttf", ".webp": "image/webp" };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (url.pathname === "/") {
      response.writeHead(200, { "Content-Type": "text/html" }).end("<!doctype html><html><body></body></html>");
      return;
    }
    const asset = path.resolve(root, "public", `.${url.pathname}`);
    const allowed = [artDir, path.join(root, "public/fonts/wedding")];
    if (!allowed.some((directory) => asset.startsWith(`${directory}${path.sep}`))) {
      response.writeHead(404).end();
      return;
    }
    const body = await readFile(asset);
    response.writeHead(200, { "Content-Type": contentTypes[path.extname(asset)] ?? "application/octet-stream" }).end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 750, height: 1125 }, deviceScaleFactor: 1 });
  await page.goto(origin);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const files = (await readdir(path.join(root, "prisma/templates"))).filter((file) => /^wedding-.*\.json$/.test(file) && file !== "wedding-modern.json");
  assert.equal(files.length, 10);
  await mkdir(reports, { recursive: true });
  const tiles = [];
  for (const [index, file] of files.entries()) {
    const template = JSON.parse(await readFile(path.join(root, "prisma/templates", file), "utf8"));
    await page.setContent(`<base href="${origin}"><link rel="stylesheet" href="/fonts/wedding/fonts.css"><style>body{margin:0}#art{width:750px;height:1125px;background-size:contain;background-repeat:no-repeat}</style><div id="art"><canvas id="canvas"></canvas></div>`);
    await page.addScriptTag({ path: path.join(root, "node_modules/fabric/dist/index.min.js") });
    const metrics = await page.evaluate(async (template) => {
      const fonts = new Set(template.layers.filter((layer) => layer.type === "text").map((layer) => layer.content.font.family));
      for (const font of fonts) await document.fonts.load(`400 74px "${font}"`);
      const image = new Image();
      image.src = template.canvas.background.url;
      await image.decode();
      document.querySelector("#art").style.backgroundImage = `url("${image.src}")`;
      const canvas = new window.fabric.StaticCanvas("canvas", { width: template.canvas.width, height: template.canvas.height, enableRetinaScaling: false });
      const metrics = [];
      for (const layer of [...template.layers].sort((a, b) => a.zIndex - b.zIndex)) {
        const { content, position, size } = layer;
        let object;
        if (layer.type === "text") {
          object = new window.fabric.Textbox(content.text, {
            originX: "left", originY: "top",
            left: position.x, top: position.y, width: size.width,
            fontSize: content.font.size, fontFamily: content.font.family,
            fontWeight: content.font.weight, lineHeight: content.font.lineHeight,
            textAlign: content.align, fill: content.color,
          });
          metrics.push({ id: layer.id, ...object.getBoundingRect(), expectedHeight: size.height, lines: object.textLines.length, expectedLines: content.text.split("\n").length });
        } else if (layer.type === "shape") {
          object = new window.fabric.Rect({ originX: "left", originY: "top", left: position.x, top: position.y, width: size.width, height: size.height, fill: content.fill, strokeWidth: 0 });
        }
        if (object) canvas.add(object);
      }
      canvas.renderAll();
      const pixels = canvas.getContext().getImageData(0, 0, canvas.width, canvas.height).data;
      const visiblePixels = pixels.reduce((total, value, i) => total + (i % 4 === 3 && value > 0 ? 1 : 0), 0);
      return { text: metrics, visiblePixels };
    }, template);
    assert.ok(metrics.visiblePixels > 1000, `${file}: blank text canvas`);
    for (const text of metrics.text) {
      assert.ok(text.height <= text.expectedHeight, `${file}/${text.id}: text exceeds its layer height`);
      assert.equal(text.lines, text.expectedLines, `${file}/${text.id}: unexpected text wrapping`);
      assert.ok(text.left >= 0 && text.top >= 0 && text.left + text.width <= 750 && text.top + text.height <= 1125);
    }
    for (const [i, text] of metrics.text.entries()) {
      for (const other of metrics.text.slice(i + 1)) {
        assert.ok(text.top + text.height <= other.top || other.top + other.height <= text.top, `${file}: ${text.id} overlaps ${other.id}`);
      }
    }
    const screenshot = await page.locator("#art").screenshot();
    await sharp(screenshot).webp({ quality: 92 }).toFile(path.join(root, "public", template.previewUrl));
    await sharp(screenshot).resize(400, 600).webp({ quality: 88 }).toFile(path.join(root, "public", template.thumbnailUrl));
    tiles.push({ input: await sharp(screenshot).resize(250, 375).toBuffer(), left: index % 5 * 262, top: Math.floor(index / 5) * 387 });
    console.log(`${template.name}: ${metrics.text.length} editable text layers, no overflow or overlap`);
  }
  assert.deepEqual(errors, []);
  await sharp({ create: { width: 1310, height: 774, channels: 3, background: "#ffffff" } }).composite(tiles).png().toFile(path.join(reports, "contact-sheet.png"));
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
