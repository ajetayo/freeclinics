// Submit changed URLs to IndexNow (Bing, Yandex, Seznam, Naver share submissions).
//
// Run after a build has been deployed to public_html:
//   node scripts/indexnow.mjs            # URLs whose sitemap lastmod is newer than the last run
//   node scripts/indexnow.mjs --all      # every URL in the sitemap
//   node scripts/indexnow.mjs --dry-run  # print what would be sent, send nothing
//
// Reads dist/sitemap-*.xml. The time of the newest lastmod submitted is kept in
// .indexnow-state.json (gitignored) so the next run only sends what changed.
// The key file lives in public/<key>.txt and is served at the site root.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = 'freeclinics.us';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const BATCH_SIZE = 10_000; // IndexNow maximum per request

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const stateFile = join(root, '.indexnow-state.json');

const args = new Set(process.argv.slice(2));
const submitAll = args.has('--all');
const dryRun = args.has('--dry-run');

const keyFile = readdirSync(join(root, 'public')).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('No IndexNow key file (32 hex chars + .txt) in public/');
const key = keyFile.replace(/\.txt$/, '');

// Collect <url> entries from every sitemap chunk.
const entries = [];
for (const file of readdirSync(distDir).filter((f) => /^sitemap-\d+\.xml$/.test(f))) {
  const xml = readFileSync(join(distDir, file), 'utf8');
  for (const [, block] of xml.matchAll(/<url>(.*?)<\/url>/gs)) {
    const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1];
    const lastmod = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] ?? null;
    if (loc) entries.push({ loc, lastmod: lastmod ? Date.parse(lastmod) : null });
  }
}
if (entries.length === 0) throw new Error(`No URLs found in ${distDir}/sitemap-*.xml — build first.`);

const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
const since = submitAll ? null : state.lastSubmittedLastmod ?? null;

// First run (no state) sends everything; later runs send only newer lastmods.
const toSend = since === null ? entries : entries.filter((e) => e.lastmod !== null && e.lastmod > since);

console.log(`${entries.length} URLs in sitemap; ${toSend.length} to submit${since ? ` (lastmod after ${new Date(since).toISOString()})` : ''}.`);
if (toSend.length === 0) process.exit(0);

for (let i = 0; i < toSend.length; i += BATCH_SIZE) {
  const urlList = toSend.slice(i, i + BATCH_SIZE).map((e) => e.loc);
  if (dryRun) {
    console.log(`[dry run] batch ${i / BATCH_SIZE + 1}: ${urlList.length} URLs, e.g. ${urlList[0]}`);
    continue;
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList }),
  });
  // 200 = accepted, 202 = accepted, key validation pending.
  if (res.status !== 200 && res.status !== 202) {
    throw new Error(`IndexNow batch ${i / BATCH_SIZE + 1} failed: HTTP ${res.status} ${await res.text()}`);
  }
  console.log(`batch ${i / BATCH_SIZE + 1}: ${urlList.length} URLs → HTTP ${res.status}`);
}

if (!dryRun) {
  const newest = Math.max(...entries.map((e) => e.lastmod ?? 0));
  writeFileSync(stateFile, JSON.stringify({ lastSubmittedLastmod: newest, lastRun: new Date().toISOString() }, null, 2) + '\n');
}
