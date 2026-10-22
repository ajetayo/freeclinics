// Set sitemap <lastmod> from changes in each page's rendered content.
//
// Run after `astro build`, before copying dist/ to public_html:
//   node scripts/update-lastmod.mjs                 # update dist/sitemap-*.xml and the hash store
//   node scripts/update-lastmod.mjs --dry-run       # report what changed, write nothing
//   node scripts/update-lastmod.mjs --seed=<dir>    # create the store from a deployed site
//
// For every URL in the sitemap, the page's content (see contentOf below) is
// hashed and compared with .page-hashes.json (gitignored, kept on the server
// between builds). Unchanged pages keep their stored lastmod; changed and new
// pages get the time of this run. Shared-code, CSS, ad and analytics changes
// therefore do not re-date every URL, and scripts/indexnow.mjs only sends the
// pages whose content really changed.
//
// --seed=<dir> hashes <dir>/**/index.html and takes dates from
// <dir>/sitemap-*.xml (e.g. the live public_html), so the first run does not
// re-date everything. It writes only the store; run again without it after.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const storeFile = join(root, '.page-hashes.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const seedDir = args.find((a) => a.startsWith('--seed='))?.slice('--seed='.length);

const sitemapFiles = (dir) => readdirSync(dir).filter((f) => /^sitemap-\d+\.xml$/.test(f));

/** Text of every match of `re`'s first group in `html`, joined. */
const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]).join('\n');

// What counts as a page's content: title, description, robots, canonical,
// JSON-LD, and the <main> element with scripts, styles, comments, ad slots
// and presentational/analytics attributes (class, style, data-*) removed.
// Site header/footer, CSS bundles and ad/analytics scripts are left out.
function contentOf(html) {
  const head = [
    all(html, /<title>([\s\S]*?)<\/title>/g),
    all(html, /(<meta\s+name="(?:description|robots)"[^>]*>)/g),
    all(html, /(<link\s+rel="canonical"[^>]*>)/g),
    all(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
  ].join('\n');
  const main = html.match(/<main\b[\s\S]*<\/main>/)?.[0] ?? html.match(/<body\b[\s\S]*<\/body>/)?.[0] ?? html;
  const body = main
    .replace(/<script\b[\s\S]*?<\/script>/g, '')
    .replace(/<style\b[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ins\b[^>]*adsbygoogle[\s\S]*?<\/ins>/g, '')
    .replace(/<[a-zA-Z][^>]*>/g, (tag) =>
      tag.replace(/\s(?:class|style|data-[\w-]+)(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/g, ''),
    )
    // Content-hashed asset names (/_astro/photo.AbC123xY.webp) change with unrelated builds.
    .replace(/(\/_astro\/[^"'\s?#]*?)\.[\w-]{8}(\.\w+)/g, '$1$2')
    .replace(/\s+/g, ' ');
  return `${head}\n${body}`;
}

const hashPage = (dir, pathname) => {
  const file = join(dir, pathname, 'index.html');
  if (!existsSync(file)) return null;
  return createHash('sha256').update(contentOf(readFileSync(file, 'utf8'))).digest('base64url').slice(0, 22);
};

/** { pathname: lastmod|null } for every <url> in `dir`'s sitemap chunks. */
function readSitemaps(dir) {
  const urls = new Map();
  for (const file of sitemapFiles(dir)) {
    const xml = readFileSync(join(dir, file), 'utf8');
    for (const [, block] of xml.matchAll(/<url>(.*?)<\/url>/gs)) {
      const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1];
      if (loc) urls.set(new URL(loc).pathname, block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] ?? null);
    }
  }
  return urls;
}

if (seedDir) {
  if (existsSync(storeFile)) throw new Error(`${storeFile} already exists; delete it to re-seed.`);
  const store = {};
  let missing = 0;
  for (const [pathname, lastmod] of readSitemaps(seedDir)) {
    const hash = hashPage(seedDir, pathname);
    if (!hash || !lastmod) { missing++; continue; }
    store[pathname] = { hash, lastmod };
  }
  console.log(`Seeded ${Object.keys(store).length} pages from ${seedDir} (${missing} skipped: no page or no lastmod).`);
  if (!dryRun) writeFileSync(storeFile, JSON.stringify(store) + '\n');
  process.exit(0);
}

const urls = readSitemaps(distDir);
if (urls.size === 0) throw new Error(`No URLs found in ${distDir}/sitemap-*.xml — build first.`);

const prev = existsSync(storeFile) ? JSON.parse(readFileSync(storeFile, 'utf8')) : {};
const now = new Date().toISOString().replace(/\.\d{3}Z$/, '.000Z');
const store = {};
const changed = [];
let added = 0;
let missing = 0;

for (const pathname of urls.keys()) {
  const hash = hashPage(distDir, pathname);
  if (!hash) { missing++; continue; }
  const old = prev[pathname];
  if (old && old.hash === hash) {
    store[pathname] = old;
  } else {
    store[pathname] = { hash, lastmod: now };
    if (old) changed.push(pathname);
    else added++;
  }
}

console.log(
  `${urls.size} URLs: ${changed.length} changed, ${added} new, ` +
    `${urls.size - changed.length - added - missing} unchanged${missing ? `, ${missing} with no index.html (no lastmod)` : ''}.`,
);
for (const p of changed.slice(0, 20)) console.log(`  changed ${p}`);
if (changed.length > 20) console.log(`  … and ${changed.length - 20} more`);

if (dryRun) process.exit(0);

// Rewrite each <url> with its lastmod (replacing any the build emitted).
for (const file of sitemapFiles(distDir)) {
  const path = join(distDir, file);
  const xml = readFileSync(path, 'utf8').replace(/<url>(.*?)<\/url>/gs, (_, block) => {
    const loc = block.match(/<loc>(.*?)<\/loc>/)[1];
    const rest = block.replace(/<loc>.*?<\/loc>/, '').replace(/<lastmod>.*?<\/lastmod>/, '');
    const lastmod = store[new URL(loc).pathname]?.lastmod;
    return `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${rest}</url>`;
  });
  writeFileSync(path, xml);
}
writeFileSync(storeFile, JSON.stringify(store) + '\n');
