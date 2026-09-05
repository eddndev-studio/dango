import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

// Keep original photography untouched; generate cacheable responsive derivatives.
const root = new URL('../', import.meta.url);
const output = new URL('public/media/', root);
await fs.mkdir(output, { recursive: true });
const manifest = {};
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.(webp|jpe?g|png)$/i.test(file)) {
      const source = await fs.readFile(file);
      const metadata = await sharp(source).metadata();
      // The source photograph was saved sideways without orientation metadata.
      const rotation = file.endsWith('/Ritual_Dango/2-p.webp') ? 270 : 0;
      const widthOriginal = rotation ? metadata.height : metadata.width;
      const heightOriginal = rotation ? metadata.width : metadata.height;
      const hash = createHash('sha256')
        .update(source)
        .update(`responsive-v2-q78-r${rotation}`)
        .digest('hex')
        .slice(0, 12);
      const widths = [
        ...new Set(
          [480, 960, 1600].map((width) => Math.min(width, widthOriginal)),
        ),
      ];
      const variants = [];
      for (const width of widths) {
        const filename = `${hash}-${width}.webp`;
        const target = new URL(filename, output);
        try {
          await fs.access(target);
        } catch {
          await sharp(source)
            .rotate(rotation)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 78, effort: 5 })
            .toFile(target.pathname);
        }
        variants.push({ width, src: `/media/${filename}` });
      }
      const key =
        '/' +
        path
          .relative(new URL('public/', root).pathname, file)
          .split(path.sep)
          .join('/');
      manifest[key] = {
        width: widthOriginal,
        height: heightOriginal,
        src: variants[0].src,
        srcset: variants.map((v) => `${v.src} ${v.width}w`).join(', '),
        full: variants.at(-1).src,
      };
    }
  }
}
await walk(new URL('public/images/', root).pathname);
await fs.writeFile(
  new URL('src/data/media.json', root),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(
  `Responsive media ready: ${Object.keys(manifest).length} originals.`,
);
