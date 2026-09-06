import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = dirname(fileURLToPath(import.meta.url));
const templatesDirectory = join(root, "..", "prisma", "templates");
const templateFiles = (await readdir(templatesDirectory))
  .filter((file) => file.endsWith(".json") && file !== "template.schema.json")
  .sort();
const requestedFiles = process.argv.slice(2);
for (const file of requestedFiles) {
  if (!templateFiles.includes(file)) throw new Error(`Unknown template file: ${file}`);
}
const selectedFiles = requestedFiles.length ? templateFiles.filter((file) => requestedFiles.includes(file)) : templateFiles;
const prisma = new PrismaClient();

function assertTemplate(template) {
  const required = ["id", "name", "scene", "style", "tags", "thumbnailUrl", "previewUrl", "canvas", "layers", "variables", "colorSchemes", "settings"];
  for (const key of required) {
    if (!(key in template)) {
      throw new Error(`Template ${template.id ?? "unknown"} is missing ${key}`);
    }
  }
  if (!Array.isArray(template.tags) || !Array.isArray(template.layers) || !Array.isArray(template.variables) || !Array.isArray(template.colorSchemes)) {
    throw new Error(`Template ${template.id} has an invalid array field`);
  }
}

try {
  for (const file of selectedFiles) {
    const template = JSON.parse(await readFile(join(templatesDirectory, file), "utf8"));
    assertTemplate(template);

    await prisma.template.upsert({
      where: { id: template.id },
      update: {
        name: template.name,
        scene: template.scene,
        style: template.style,
        description: template.description,
        tags: template.tags,
        thumbnailUrl: template.thumbnailUrl,
        previewUrl: template.previewUrl,
        structure: template,
        isPremium: false,
        sortOrder: templateFiles.indexOf(file),
        isActive: true,
      },
      create: {
        id: template.id,
        name: template.name,
        scene: template.scene,
        style: template.style,
        description: template.description,
        tags: template.tags,
        thumbnailUrl: template.thumbnailUrl,
        previewUrl: template.previewUrl,
        structure: template,
        isPremium: false,
        sortOrder: templateFiles.indexOf(file),
        isActive: true,
      },
    });
    console.log(`Imported ${template.scene} template: ${template.name}`);
  }
} finally {
  await prisma.$disconnect();
}
