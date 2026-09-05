import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
const root = path.resolve('dist');
const origin = 'https://festivaldango.com';
const pages = ['index.html', 'informacion/index.html', '404.html'];
const documentFor = (file) => load(fs.readFileSync(file, 'utf8'));
const resolveFile = (pathname) =>
  path.join(root, pathname.endsWith('/') ? `${pathname}index.html` : pathname);
let linkCount = 0,
  imageCount = 0;
for (const relative of pages) {
  const file = path.join(root, relative);
  const $ = documentFor(file);
  const route =
    relative === 'index.html'
      ? '/'
      : relative === '404.html'
        ? '/404/'
        : '/informacion/';
  assert.equal($('main').length, 1, `${relative}: one main landmark`);
  assert.equal($('h1').length, 1, `${relative}: one H1`);
  assert.equal($('html').attr('lang'), 'es-MX');
  assert.equal($('link[rel=canonical]').attr('href'), origin + route);
  assert.ok(
    $('meta[name=description]').attr('content')?.length >
      (relative === '404.html' ? 20 : 70),
  );
  const ids = $('[id]')
    .map((_, el) => $(el).attr('id'))
    .get();
  assert.equal(new Set(ids).size, ids.length, `${relative}: duplicate IDs`);
  const modules = $('script[type=module]')
    .map((_, el) => $(el).text())
    .get()
    .join('');
  assert.ok(
    Buffer.byteLength(modules) < 10000,
    `${relative}: client script budget`,
  );
  assert.ok(fs.statSync(file).size < 65000, `${relative}: HTML budget`);
  for (const el of $('a').toArray()) {
    const a = $(el),
      href = a.attr('href');
    assert.ok(href && href !== '#', `${relative}: empty link`);
    assert.ok(
      a.attr('aria-label') || a.text().trim() || a.find('img[alt]').attr('alt'),
      `${relative}: unnamed link ${href}`,
    );
    if (a.attr('target') === '_blank')
      assert.ok(a.attr('rel')?.includes('noopener'));
    if (/^(mailto:|tel:)/.test(href)) continue;
    const url = new URL(href, origin + route);
    if (url.origin !== origin) continue;
    const target = href.startsWith('#') ? file : resolveFile(url.pathname);
    assert.ok(fs.existsSync(target), `${relative}: missing target ${href}`);
    if (url.hash)
      assert.ok(
        documentFor(target)(`[id="${decodeURIComponent(url.hash.slice(1))}"]`)
          .length,
        `${relative}: broken anchor ${href}`,
      );
    linkCount++;
  }
  for (const el of $('img[src]').toArray()) {
    const img = $(el),
      src = img.attr('src');
    assert.ok(src, `${relative}: empty image src`);
    assert.ok(img.attr('alt') !== undefined, `${relative}: missing alt`);
    assert.ok(
      Number(img.attr('width')) > 0 && Number(img.attr('height')) > 0,
      `${relative}: missing dimensions ${src}`,
    );
    const sources = [
      src,
      ...(img.attr('srcset') ?? '')
        .split(',')
        .filter(Boolean)
        .map((value) => value.trim().split(/\s+/)[0]),
    ];
    for (const source of sources)
      assert.ok(
        fs.existsSync(resolveFile(new URL(source, origin).pathname)),
        `Missing image: ${source}`,
      );
    imageCount++;
  }
  const social = $('meta[property="og:image"]').attr('content');
  assert.ok(social?.startsWith(origin));
  assert.ok(fs.existsSync(resolveFile(new URL(social).pathname)));
  if (relative === '404.html')
    assert.ok($('meta[name=robots]').attr('content')?.includes('noindex'));
  else {
    const schema = JSON.parse($('script[type="application/ld+json"]').text());
    const event = schema['@graph'].find(
      (item) => item['@type'] === 'MusicFestival',
    );
    if (relative === 'index.html') {
      assert.equal(
        event.startDate,
        '2026-02-14',
        'Event must match the official poster',
      );
      assert.equal(
        event.offers,
        undefined,
        'Do not advertise stock for a past edition',
      );
      assert.equal(
        $('[data-gallery-image]').length,
        27,
        'Preserve all gallery photographs',
      );
      assert.equal(
        $('img[fetchpriority=high]').length,
        1,
        'Only prioritize the hero',
      );
      assert.equal($('.artist-list a').length, 12, 'Preserve all artists');
    } else
      assert.equal(event, undefined, 'Event schema belongs on the event page');
  }
}
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
assert.ok(robots.includes(`${origin}/sitemap-index.xml`));
const sitemap = fs.readFileSync(path.join(root, 'sitemap-0.xml'), 'utf8');
assert.ok(sitemap.includes(`${origin}/informacion/`));
assert.ok(!sitemap.includes('/404'));
assert.ok(!sitemap.includes('dangofestival.com'));
console.log(
  `Verified ${pages.length} pages, ${linkCount} local links and ${imageCount} images: SEO, anchors, accessibility structure, content preservation and size budgets pass.`,
);
