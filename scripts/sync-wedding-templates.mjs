import assert from "node:assert/strict";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "template", "wedding");
const publicRoot = path.join(root, "public", "templates");
const descriptorRoot = path.join(root, "prisma", "templates");

const variants = [
  { code: "0002", slug: "jade-moon", description: "A moonlit jade and bamboo wedding invitation.", palette: ["#d9b982", "#bd897b", "#e9e4d9", "#eeeae1", "#101917"] },
  { code: "0003", slug: "rococo-champagne", description: "A soft rococo wedding invitation in champagne and blush.", palette: ["#bd8879", "#a16d80", "#fffaf6", "#423237", "#f5eae0"] },
  { code: "0004", slug: "midnight-cinema", description: "A cinematic midnight wedding invitation with film-inspired details.", palette: ["#c6a06e", "#a94b52", "#171b25", "#f2eee6", "#090d14"] },
  { code: "0005", slug: "coastal-pearl", description: "A light coastal wedding invitation shaped by pearl and sea tones.", palette: ["#bb9769", "#6c99a2", "#f7faf9", "#23393e", "#e5edf0"] },
  { code: "0006", slug: "terracotta-courtyard", description: "A sunlit courtyard wedding invitation with warm terracotta character.", palette: ["#e0b173", "#c56d56", "#f0e4d4", "#322921", "#2a241f"] },
  { code: "0007", slug: "monochrome-modern", description: "A precise monochrome wedding invitation with modern editorial structure.", palette: ["#181a1c", "#a58d73", "#ffffff", "#151719", "#f1f0ee"] },
  { code: "0008", slug: "sakura-mist", description: "A romantic sakura wedding invitation in misty rose tones.", palette: ["#b47a8c", "#80618a", "#fff6f3", "#4a3640", "#f3e7e9"] },
  { code: "0009", slug: "art-deco-gold", description: "A glamorous Art Deco wedding invitation in deep green and gold.", palette: ["#e3b965", "#a86c6a", "#e8e2d4", "#15231f", "#0c1716"] },
  { code: "0010", slug: "lavender-nocturne", description: "A nocturnal lavender wedding invitation beneath a violet sky.", palette: ["#c1a5d8", "#879ac7", "#e7e1ed", "#27213c", "#151426"] },
  { code: "0011", slug: "wild-meadow", description: "A free-spirited meadow wedding invitation with pressed-flower details.", palette: ["#e3bb70", "#c87e68", "#f2e9d5", "#273228", "#1a261d"] },
];

function decode(value = "") {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&middot;", "·")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function plainText(value = "") {
  return decode(value.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]+>/g, "").trim());
}

function capture(value, pattern, label) {
  const match = value.match(pattern);
  assert.ok(match?.[1], `Missing ${label}`);
  return match[1];
}

function section(html, type) {
  const match = html.match(new RegExp(`<section class="module ${type}"[\\s\\S]*?</section>`));
  assert.ok(match?.[0], `Missing ${type} section`);
  return match[0];
}

function heading(value) {
  return plainText(capture(value, /<h2[^>]*>([\s\S]*?)<\/h2>/, "heading")).split("\n").filter(Boolean);
}

function templateId(code) {
  return `d3c0e5f4-${code}-4a41-9b07-8c1d4f9b${code}`;
}

function commonRsvpData(reply) {
  return {
    enabled: true,
    deadline: plainText(capture(reply, /<div class="module-code">(.*?)<\/div>/, "RSVP code")),
    heading: { lines: heading(reply) },
    description: plainText(capture(reply, /reply-copy[\s\S]*?<h2>[\s\S]*?<\/h2><p>(.*?)<\/p>/, "RSVP description")),
    fields: {
      name: { label: "你的名字", placeholder: "请输入姓名", required: true },
      guests: { label: "出席人数", min: 1, max: 4, default: 1 },
      attending: { label: "出席意愿", options: [{ value: "yes", label: "如约而至" }, { value: "no", label: "遗憾缺席" }] },
      message: { label: "想对我们说", placeholder: "写下一句祝福（选填）", required: false },
      submitLabel: "发送回执",
    },
    successMessage: "谢谢你，我们已经收到你的回执。",
  };
}

async function syncVariant(variant) {
  const sourceDirectory = path.join(sourceRoot, variant.code);
  const html = await readFile(path.join(sourceDirectory, "index.html"), "utf8");
  const layout = Number(capture(html, /<body class="layout-(\d+)"/, "layout"));
  const name = plainText(capture(html, /<title>(.*?) ·/, "title"));
  const edition = plainText(capture(html, /<span class="edition">(.*?)<\/span>/, "edition"));
  const hero = section(html, "hero");
  const story = section(html, "story");
  const details = section(html, "details");
  const reply = section(html, "reply");
  const heroSource = capture(hero, /--hero:url\('([^']+)'/, "hero image");
  const heroFilename = path.basename(heroSource);
  const publicDirectory = path.join(publicRoot, `wedding-${variant.code}`);
  const heroUrl = `/templates/wedding-${variant.code}/${heroFilename}`;
  const heroAssetId = `wedding-${variant.code}-hero`;
  const floralAssetId = `wedding-${variant.code}-floral-detail`;
  const venueAssetId = `wedding-${variant.code}-venue-garden`;

  const figures = [...story.matchAll(/<figure[^>]*>[\s\S]*?<img src="([^"]+)" alt="([^"]*)"[^>]*>[\s\S]*?<figcaption>(.*?)<\/figcaption>[\s\S]*?<\/figure>/g)]
    .map((match, index) => ({
      id: `album-${index + 1}`,
      media: {
        assetId: match[1].includes("floral-detail") ? floralAssetId : match[1].includes("venue-garden") ? venueAssetId : heroAssetId,
        fit: "cover",
        alt: plainText(match[2]),
      },
      caption: plainText(match[3]),
    }));
  assert.equal(figures.length, 3, `${variant.code}: expected three album images`);

  const events = [...details.matchAll(/<div class="day-item"><div><strong>(.*?)<\/strong><span>(.*?)<\/span><\/div><p>(.*?)<\/p><\/div>/g)]
    .map((match, index) => ({ id: `event-${index + 1}`, time: plainText(match[1]), label: plainText(match[2]), title: plainText(match[3]), description: "" }));
  assert.equal(events.length, 4, `${variant.code}: expected four celebration events`);

  const venueAddress = plainText(capture(details, /<div class="venue-row[^>]*><span>([\s\S]*?)<\/span>/, "venue address")).split("\n");
  const footerItems = [...html.matchAll(/<footer class="footer">[\s\S]*?<span>(.*?)<\/span><span>(.*?)<\/span><span>(.*?)<\/span>/g)][0]?.slice(1).map(plainText);
  assert.equal(footerItems?.length, 3, `${variant.code}: expected three footer items`);
  const heroAlt = plainText(capture(story, new RegExp(`<img src="${heroSource.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" alt="([^"]*)"`), "hero alt"));
  const [primary, secondary, accent, text, background] = variant.palette;

  const template = {
    id: templateId(variant.code),
    name,
    scene: "wedding",
    style: variant.slug,
    description: variant.description,
    tags: ["wedding", "editorial", "long-scroll", "album", variant.slug],
    thumbnailUrl: heroUrl,
    previewUrl: heroUrl,
    pageModel: "h5-long-scroll",
    canvas: { width: 750, height: 1334, background: { type: "color", value: background } },
    layers: [],
    assets: [
      { id: heroAssetId, kind: "image", url: heroUrl, name: `${name} hero`, alt: heroAlt },
      { id: floralAssetId, kind: "image", url: "/templates/wedding-0001/floral-detail.png", name: "Floral detail", alt: "象牙白花束与金色婚戒" },
      { id: venueAssetId, kind: "image", url: "/templates/wedding-0001/venue-garden.png", name: "Venue garden", alt: "蓝调时刻的花园婚礼场地" },
      { id: "music-placeholder-001", kind: "audio", url: "", name: "Music library placeholder" },
    ],
    sections: [
      {
        id: "hero", type: "hero", name: "Hero",
        data: {
          brand: { monogram: "L & X", caption: edition },
          eyebrow: plainText(capture(hero, /hero-kicker[^>]*>(.*?)<\/p>/, "hero kicker")),
          names: { partnerA: "林深", separator: "&", partnerB: "许棠" },
          date: { value: "2026-10-18", display: plainText(capture(hero, /hero-date[^>]*>(.*?)<\/p>/, "hero date")) },
          location: { city: "杭州", venue: "云栖竹径" },
          media: { assetId: heroAssetId, fit: "cover", position: "center 62%", alt: heroAlt },
          scrollCue: { label: "SCROLL", targetSectionId: "story" },
          soundControl: { label: "声音" },
        },
      },
      {
        id: "story", type: "gallery", name: "Story album",
        data: {
          moduleCode: plainText(capture(story, /module-code[^>]*>(.*?)<\/div>/, "story code")),
          label: plainText(capture(story, /<p class="eyebrow">(.*?)<\/p>/, "story eyebrow")),
          heading: { lines: heading(story) },
          paragraphs: [plainText(capture(story, /story-copy[\s\S]*?<h2>[\s\S]*?<\/h2><p>(.*?)<\/p>/, "story paragraph"))],
          signature: { caption: "with all our love", names: "L & X" },
          album: { autoplay: true, intervalMs: 6200, controls: { arrows: true, dots: true, keyboard: true, touch: true }, items: figures },
        },
      },
      {
        id: "celebration", type: "celebration", name: "Celebration and venue",
        data: {
          moduleCode: plainText(capture(details, /module-code[^>]*>(.*?)<\/div>/, "celebration code")),
          heading: { lines: heading(details) },
          events,
          image: { assetId: floralAssetId, fit: "cover", alt: "象牙白花束与金色婚戒" },
          address: venueAddress,
          actions: [{ id: "navigate", label: "导航", kind: "navigation", href: "https://uri.amap.com/marker?position=120.0917,30.1804", icon: "navigation", target: "new" }],
          map: {
            markerLabel: "云栖竹径", latitude: 30.1804, longitude: 120.0917,
            providers: {
              "zh-CN": { provider: "amap", embedUrl: "https://ditu.amap.com", externalUrl: "https://uri.amap.com/marker?position=120.0917,30.1804" },
              default: { provider: "google", embedUrl: "https://www.google.com/maps?q=30.1804,120.0917&output=embed", externalUrl: "https://www.google.com/maps/search/?api=1&query=30.1804,120.0917" },
            },
          },
        },
      },
      { id: "rsvp", type: "rsvp", name: "RSVP", data: commonRsvpData(reply) },
      { id: "footer", type: "footer", name: "Footer", data: { items: footerItems } },
    ],
    variables: [],
    colorSchemes: [{ id: variant.slug, name, colors: { primary, secondary, accent, text, background } }],
    effects: { particles: { enabled: true, color: primary, countPreview: 12 }, petals: { enabled: false, count: 0 }, noise: { enabled: true, opacity: 0.035 }, reducedMotion: "system" },
    music: { enabled: true, source: "asset-library", assetId: "music-placeholder-001", userGestureRequired: true },
    settings: {
      allowMusic: true, allowAnimation: true, rsvpEnabled: true, pageModel: "h5-long-scroll", previewRsvpOnly: true,
      designVariant: { layout, label: edition, slug: variant.slug },
    },
  };

  await mkdir(publicDirectory, { recursive: true });
  await copyFile(path.join(sourceDirectory, heroSource), path.join(publicDirectory, heroFilename));
  await writeFile(path.join(descriptorRoot, `wedding-${variant.code}.json`), `${JSON.stringify(template, null, 2)}\n`, "utf8");
  console.log(`${variant.code}: ${name} -> ${heroUrl}`);
}

await Promise.all(variants.map(syncVariant));
