import fs from 'node:fs/promises';
import sharp from 'sharp';
const root = new URL('../', import.meta.url);
const logo = await fs.readFile(
  new URL('public/images/brand/dango.svg', root),
  'utf8',
);
const paths = logo.slice(logo.indexOf('>') + 1, logo.lastIndexOf('</svg>'));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#11110f"/><circle cx="1120" cy="100" r="260" fill="#e6f191"/><circle cx="1120" cy="100" r="185" fill="#11110f"/><circle cx="1120" cy="100" r="110" fill="#ff6abe"/><text x="64" y="74" font-family="sans-serif" font-size="17" letter-spacing="4" fill="#f5f0e5">MÚSICA · RAÍCES · COMUNIDAD</text><svg x="64" y="155" width="830" height="316" viewBox="0 0 2129 809" fill="#ff6abe">${paths}</svg><path d="M64 516H1136" stroke="#f5f0e5" stroke-opacity=".3"/><text x="64" y="568" font-family="sans-serif" font-size="20" fill="#f5f0e5">TEOTIHUACÁN, MÉXICO</text><text x="1136" y="568" text-anchor="end" font-family="sans-serif" font-size="18" fill="#e6f191">EDICIÓN 2026 · 14 FEBRERO</text></svg>`;
await fs.writeFile(new URL('assets/social-dango-2026.svg', root), svg);
await sharp(Buffer.from(svg))
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(new URL('public/social-dango-2026.jpg', root).pathname);
