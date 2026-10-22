// Turns a raw screenshot into a project card image that follows
// docs/project-images.md: 16:10, 1280x800, WebP, all metadata stripped.
//
// Usage:
//   node scripts/process-project-image.mjs <input> <slug> [position]
//
//   <input>     the original image (keep originals in images-src/, which is
//               gitignored)
//   <slug>      output name: public/projects/<slug>.webp
//   [position]  which part to keep when cropping to 16:10: center (default),
//               top, bottom, left, right, or attention (sharp picks the most
//               interesting region)

import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const WIDTH = 1280;
const HEIGHT = 800;
const QUALITY = 82;
const MAX_KB = 250;

const [input, slug, position = "center"] = process.argv.slice(2);
if (!input || !slug) {
  console.error("Usage: node scripts/process-project-image.mjs <input> <slug> [position]");
  process.exit(1);
}

const positions = {
  center: "centre",
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right",
  attention: sharp.strategy.attention,
};
if (!(position in positions)) {
  console.error(`Unknown position "${position}". Use one of: ${Object.keys(positions).join(", ")}`);
  process.exit(1);
}

const source = await sharp(input).metadata();
if (source.width < WIDTH || source.height < HEIGHT) {
  console.warn(
    `Warning: the source is ${source.width}x${source.height}, smaller than ${WIDTH}x${HEIGHT}. ` +
      "It will be upscaled and may look soft. A larger screenshot is better."
  );
}

const outDir = path.join("public", "projects");
await mkdir(outDir, { recursive: true });
const output = path.join(outDir, `${slug}.webp`);

// rotate() applies the EXIF orientation before it's discarded. sharp drops all
// metadata (EXIF, GPS location, ICC, XMP) unless told to keep it.
await sharp(input)
  .rotate()
  .resize(WIDTH, HEIGHT, { fit: "cover", position: positions[position] })
  .webp({ quality: QUALITY })
  .toFile(output);

const result = await sharp(output).metadata();
const kb = Math.round((await stat(output)).size / 1024);
const leftovers = ["exif", "xmp", "iptc"].filter((key) => result[key]);

console.log(`Wrote ${output}: ${result.width}x${result.height}, ${kb} KB`);
if (leftovers.length) {
  console.error(`Metadata still present (${leftovers.join(", ")}). Do not commit this file.`);
  process.exit(1);
}
console.log("No EXIF, GPS or XMP metadata in the output.");
if (kb > MAX_KB) {
  console.warn(`Larger than the ${MAX_KB} KB target. Try a screenshot with less noise or detail.`);
}
