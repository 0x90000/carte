import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateDir = path.join(root, "prisma", "templates");
const artBase = "/templates/wedding-art";

const assignments = {
  "wedding-romantic.json": "romantic-blush.png",
  "wedding-luxe.json": "luxe-noir.png",
  "wedding-garden.json": "secret-garden.png",
  "wedding-sunset.json": "golden-hour.png",
  "wedding-minimal.json": "pure-minimalist.png",
  "wedding-vintage.json": "vintage-romance.png",
  "wedding-ocean.json": "ocean-waves.png",
  "wedding-golden.json": "gilded-elegance.png",
  "wedding-forest.json": "enchanted-forest.png",
  "wedding-starry.json": "starry-night.png",
};

const designs = {
  "romantic-blush.png": { ink: "#743e46", accent: "#99606a", heading: "Together with our families", note: "Invite you to celebrate our wedding\nand the beginning of a beautiful forever." },
  "luxe-noir.png": { ink: "#eddbb5", accent: "#d4b673", heading: "THE WEDDING CELEBRATION", note: "Request the pleasure of your company\nas we celebrate our marriage." },
  "secret-garden.png": { ink: "#374b38", accent: "#627252", heading: "Love, in full bloom", note: "Together with our families,\nwe invite you to our wedding celebration." },
  "golden-hour.png": { ink: "#5b321e", accent: "#774028", heading: "A golden kind of forever", note: "Join us as we begin our life together.", top: 145, compact: true },
  "pure-minimalist.png": { ink: "#272824", accent: "#715a4d", heading: "WE ARE GETTING MARRIED", note: "One day. Our people. A lifetime together.", align: "left", sans: true },
  "vintage-romance.png": { ink: "#563d3e", accent: "#725356", heading: "Together with their families", note: "Request the honour of your presence\nat the celebration of their marriage." },
  "ocean-waves.png": { ink: "#335363", accent: "#587784", heading: "By the sea, with you", note: "Together with our families,\nwe invite you to celebrate our wedding." },
  "gilded-elegance.png": { ink: "#695426", accent: "#816a34", heading: "THE WEDDING OF", note: "Request the pleasure of your company\nas we join our lives in marriage." },
  "enchanted-forest.png": { ink: "#f1ebd9", accent: "#d5c7a4", heading: "Beneath the canopy", note: "Surrounded by the ones we love,\nwe invite you to witness our forever." },
  "starry-night.png": { ink: "#f0e9d7", accent: "#d6c59d", heading: "Written in the stars", note: "Under a sky full of stars,\njoin us as we begin our forever." },
};

function text(id, name, value, y, height, size, color, family, align, variable) {
  return {
    id, type: "text", name,
    position: { x: 140, y }, size: { width: 470, height }, zIndex: 2,
    ...(variable ? { variable } : {}),
    content: {
      text: value, font: { family, size, weight: 400, lineHeight: 1.2 },
      color, align,
    },
  };
}

for (const [filename, image] of Object.entries(assignments)) {
  const templatePath = path.join(templateDir, filename);
  const imagePath = path.join(root, "public", "templates", "wedding-art", image);
  await fs.access(imagePath);
  const template = JSON.parse(await fs.readFile(templatePath, "utf8"));
  const slug = image.replace(/\.png$/, "");
  const design = designs[image];
  const align = design.align ?? "center";
  const top = design.top ?? 230;
  const serif = "Cormorant Garamond";
  const sans = "Manrope";
  const names = template.variables.find((variable) => variable.key === "couple_names");
  const details = template.variables.find((variable) => variable.key === "event_details");
  const message = template.variables.find((variable) => variable.key === "message");
  names.defaultValue = names.defaultValue.replace(/\s*&\s*/, "\n&\n");
  message.defaultValue = design.note;
  const nameSize = design.sans ? 58 : design.compact ? 66 : 74;
  const detailsY = top + (design.compact ? 325 : 380);
  template.description = `Original ${template.name.toLowerCase()} artwork with editable wedding typography on a portrait 2:3 canvas.`;
  template.thumbnailUrl = `${artBase}/${slug}-thumbnail.webp`;
  template.previewUrl = `${artBase}/${slug}-preview.webp`;
  template.canvas = {
    width: 750, height: 1125,
    background: { type: "image", url: `${artBase}/${slug}.webp`, fit: "contain" },
  };
  template.layers = [
    text("invitation-heading", "Invitation heading", design.heading, top, 36, design.heading === design.heading.toUpperCase() ? 15 : 25, design.accent, design.heading === design.heading.toUpperCase() ? sans : serif, align),
    text("couple-names", "Couple Names", names.defaultValue, top + 62, 290, nameSize, design.ink, design.sans ? sans : serif, align, "couple_names"),
    text("date-venue", "Date and Location", details.defaultValue, detailsY, 100, 19, design.ink, sans, align, "event_details"),
    { id: "fine-rule", type: "shape", name: "Fine divider", position: { x: align === "left" ? 140 : 345, y: detailsY + 113 }, size: { width: 60, height: 1 }, zIndex: 1, content: { shape: "rectangle", fill: design.accent } },
    text("invitation-text", "Invitation Message", message.defaultValue, detailsY + 140, 100, 23, design.ink, serif, align, "message"),
  ];
  // The image carries the artwork; only compatible ink palettes are offered.
  template.colorSchemes = [{
    id: slug, name: template.name,
    colors: { primary: design.accent, secondary: design.ink, accent: design.accent, text: design.ink },
  }];
  await sharp(imagePath).webp({ quality: 90 }).toFile(path.join(root, "public", "templates", "wedding-art", `${slug}.webp`));
  await fs.writeFile(templatePath, `${JSON.stringify(template, null, 2)}\n`, "utf8");
  console.log(`${filename} -> ${template.canvas.background.url}`);
}
