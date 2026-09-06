# Wedding Artwork Pipeline

Ten wedding templates use original `gpt-image-2` artwork generated through the
explicit imagegen CLI fallback. The exact ten prompts are in
`scripts/generate-wedding-images.py` (`JOBS`). No credentials are stored in Git.

## Deliverables

- Original images: `public/templates/wedding-art/*.png`, 1024 x 1536.
- Web backgrounds: same filenames with `.webp`, retaining the original aspect ratio.
- Finished previews: `*-preview.webp`, 750 x 1125, including the editable typography.
- Thumbnails: `*-thumbnail.webp`, 400 x 600.
- Template definitions: the ten named `prisma/templates/wedding-*.json` files.
  `wedding-modern.json` is intentionally unchanged.

The painterly, photographic and foil details remain raster artwork. Names,
dates, venue, invitation copy and the fine divider are editable Fabric layers;
the artwork is not falsely represented as independently editable vector paths.
The templates use bundled OFL-licensed Cormorant Garamond and Manrope fonts.

## Generate

Use Python 3.10+ and an installed Codex imagegen skill. Set `IMAGEGEN_CLI` to
the skill's `scripts/image_gen.py` when it is not at its default location.
An isolated environment is recommended:

```powershell
python -m venv .venv-wedding
.venv-wedding/Scripts/python -m pip install -r scripts/requirements-imagegen.txt
```

Set `OPENAI_API_KEY` in the process environment. `OPENAI_BASE_URL` defaults to
`https://backend.intelalloc.com/v1`; neither value is written into output files.

```powershell
.venv-wedding/Scripts/python scripts/generate-wedding-images.py --dry-run
.venv-wedding/Scripts/python scripts/generate-wedding-images.py
```

Existing images are skipped. Use `--only romantic-blush` to select a theme;
`--force` explicitly regenerates existing files and incurs API charges. Failed
batches can be resumed with the same command. The wrapper adjusts the HTTP
User-Agent for gateway compatibility without modifying the bundled CLI.

## Rebuild Templates And Previews

```powershell
node scripts/apply-wedding-art.mjs
npx playwright install chromium
node scripts/render-wedding-previews.mjs
python -m unittest discover -s scripts/tests
npm run build
```

Applying artwork deliberately replaces the ten templates' layer layouts. It
does not change saved invitations or guest drafts. The preview renderer uses
Fabric, the bundled fonts and Chromium; it checks actual text bounds, wrapping,
overlap and nonblank canvas pixels. Its temporary asset server is closed at exit.
The visual contact sheet is saved in `test-results/wedding-art/contact-sheet.png`.

## Deployment

Deploy the application image on the test server only. Preserve the server's
`.env`, database and Redis volumes. Import only the ten changed JSON filenames
by passing them as arguments to `scripts/import-templates.mjs`; without arguments
that script retains its previous behavior of importing all templates.
Existing invitation content is not migrated or overwritten.
