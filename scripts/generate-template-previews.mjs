import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const sourceDir = join(root, "..", "prisma", "templates");
const outputRoot = join(root, "..", "public", "templates");

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]);
}

function gradientMarkup(background) {
  const gradient = typeof background?.gradient === "string" ? background.gradient : "";
  const colors = gradient.match(/#[0-9a-f]{3,8}/gi) ?? [];
  if (colors.length < 2) return `<rect width="100%" height="100%" fill="${escapeXml(background?.value ?? "#ffffff")}"/>`;
  const stops = colors.map((color, index) => `<stop offset="${Math.round((index / (colors.length - 1)) * 100)}%" stop-color="${color}"/>`).join("");
  return `<defs><linearGradient id="background" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs><rect width="100%" height="100%" fill="url(#background)"/>`;
}

function renderLayer(layer) {
  const x = Number(layer.position?.x ?? 0);
  const y = Number(layer.position?.y ?? 0);
  const width = Number(layer.size?.width ?? 100);
  const height = Number(layer.size?.height ?? 100);
  const opacity = Number(layer.opacity ?? 1);
  const transform = `translate(${x} ${y}) rotate(${Number(layer.rotation ?? 0)} ${width / 2} ${height / 2})`;
  const content = layer.content ?? {};

  if ((layer.type === "svg" || layer.type === "decoration") && typeof content.svg === "string") {
    const svg = content.svg.replace(/<svg\b([^>]*)>/i, (_match, attributes) => {
      const clean = attributes.replace(/\s(?:x|y|width|height|style)=(?:"[^"]*"|'[^']*')/gi, "");
      return `<svg${clean} x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none">`;
    });
    return `<g transform="${transform}" opacity="${opacity}">${svg}</g>`;
  }
  if (layer.type === "shape") {
    const fill = escapeXml(content.fill ?? "transparent");
    if (content.shape === "circle") return `<circle cx="${x + width / 2}" cy="${y + height / 2}" r="${Math.min(width, height) / 2}" fill="${fill}" opacity="${opacity}"/>`;
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${Number(content.borderRadius ?? 0)}" fill="${fill}" opacity="${opacity}"/>`;
  }
  if (layer.type === "text") {
    const font = content.font && typeof content.font === "object" ? content.font : {};
    const lines = String(content.text ?? "").split("\\n");
    const anchor = content.align === "center" ? "middle" : content.align === "right" ? "end" : "start";
    const textX = content.align === "center" ? x + width / 2 : content.align === "right" ? x + width : x;
    const size = Number(font.size ?? 24);
    const lineHeight = Number(font.lineHeight ?? 1.2) * size;
    const tspans = lines.map((line, index) => `<tspan x="${textX}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join("");
    return `<text x="${textX}" y="${y + size}" text-anchor="${anchor}" fill="${escapeXml(content.color ?? "#111827")}" font-family="${escapeXml(font.family ?? "Arial")}" font-size="${size}" font-weight="${Number(font.weight ?? 400)}" opacity="${opacity}">${tspans}</text>`;
  }
  return "";
}

async function generatePreview(file) {
  const template = JSON.parse(await readFile(join(sourceDir, file), "utf8"));
  if (template.scene !== "wedding") return;
  const width = Number(template.canvas?.width ?? 750);
  const height = Number(template.canvas?.height ?? 1334);
  const layers = (template.layers ?? []).slice().sort((left, right) => Number(left.zIndex ?? 0) - Number(right.zIndex ?? 0));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${gradientMarkup(template.canvas?.background)}${layers.map(renderLayer).join("")}</svg>`;
  const directory = join(outputRoot, file.replace(/\.json$/, ""));
  await mkdir(directory, { recursive: true });
  await Promise.all([writeFile(join(directory, "thumbnail.svg"), svg), writeFile(join(directory, "preview.svg"), svg)]);
}

const files = (await readdir(sourceDir)).filter((file) => file.startsWith("wedding-") && file.endsWith(".json") && file !== "wedding-modern.json");
await Promise.all(files.map(generatePreview));
console.log(`Generated previews for ${files.length} wedding templates.`);
