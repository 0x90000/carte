import { PrismaClient } from "@prisma/client";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const templatesDirectory = join(root, "..", "prisma", "templates");
const prisma = new PrismaClient();

function assertTemplate(template: Record<string, unknown>) {
  for (const key of ["id", "name", "scene", "style", "tags", "thumbnailUrl", "previewUrl", "canvas", "layers", "variables", "colorSchemes", "settings"]) {
    if (!(key in template)) throw new Error(`Template ${String(template.id ?? "unknown")} is missing ${key}`);
  }
  if (!Array.isArray(template.tags) || !Array.isArray(template.layers) || !Array.isArray(template.variables) || !Array.isArray(template.colorSchemes)) {
    throw new Error(`Template ${String(template.id)} has an invalid array field`);
  }
}

async function importTemplates() {
  const files = (await readdir(templatesDirectory))
    .filter((file) => file.endsWith(".json") && file !== "template.schema.json")
    .sort();

  for (const [sortOrder, file] of files.entries()) {
    const template = JSON.parse(await readFile(join(templatesDirectory, file), "utf8")) as Record<string, unknown>;
    assertTemplate(template);
    await prisma.template.upsert({
      where: { id: String(template.id) },
      update: {
        name: String(template.name), scene: String(template.scene), style: String(template.style),
        description: typeof template.description === "string" ? template.description : null,
        tags: template.tags as string[], thumbnailUrl: String(template.thumbnailUrl),
        previewUrl: typeof template.previewUrl === "string" ? template.previewUrl : null,
        structure: template, isPremium: false, sortOrder, isActive: true,
      },
      create: {
        id: String(template.id), name: String(template.name), scene: String(template.scene), style: String(template.style),
        description: typeof template.description === "string" ? template.description : null,
        tags: template.tags as string[], thumbnailUrl: String(template.thumbnailUrl),
        previewUrl: typeof template.previewUrl === "string" ? template.previewUrl : null,
        structure: template, isPremium: false, sortOrder, isActive: true,
      },
    });
    console.log(`Imported ${String(template.scene)} template: ${String(template.name)}`);
  }
}

importTemplates().finally(() => prisma.$disconnect());
