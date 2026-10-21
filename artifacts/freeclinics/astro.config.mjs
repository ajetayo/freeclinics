import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Clinic pages marked noindex (src/data/noindex-clinics.json) are left out of the sitemap.
const NOINDEX_PATHS = new Set(
  JSON.parse(readFileSync(new URL('./src/data/noindex-clinics.json', import.meta.url), 'utf8'))
    .map((c) => `/clinic/${c.slug}/`),
);

// ---------------------------------------------------------------------------
// Sitemap <lastmod>
// ---------------------------------------------------------------------------
// Pages carry no per-page dates, so each URL's lastmod is the date of the last
// git commit that touched the files the page is built from: its route
// template, the data it reads, and the shared layout/components. Rebuilding
// without changes therefore does not bump lastmod (search engines ignore
// lastmod that changes on every build). If git is unavailable (e.g. a copy of
// the package outside the repo), lastmod is omitted rather than guessed.

const SHARED = ['src/layouts', 'src/components', 'src/lib', 'src/styles'];
const CLINIC_DATA = 'src/data/clinics.json';

const commitDateCache = new Map();

/** ISO date of the newest commit touching any of `paths`, or null. */
function lastCommitDate(paths) {
  const key = paths.join('|');
  if (commitDateCache.has(key)) return commitDateCache.get(key);
  let date = null;
  try {
    // `:(literal)` stops git reading the `[state]`-style route folders as globs.
    const pathspecs = paths.map((p) => `:(literal)${p}`);
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...pathspecs], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    date = out || null;
  } catch {
    date = null;
  }
  commitDateCache.set(key, date);
  return date;
}

/** Source files a URL path is built from. */
function sourcesFor(pathname) {
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 0) return ['src/pages/index.astro', CLINIC_DATA, ...SHARED];
  if (parts[0] === 'clinic') return ['src/pages/clinic', CLINIC_DATA, ...SHARED];
  if (parts[0] === 'resources') {
    const page = parts.length > 1 ? `src/pages/resources/${parts[1]}` : 'src/pages/resources/index.astro';
    return [page, ...SHARED];
  }
  if (parts.length === 1 && ['about', 'privacy', 'contact'].includes(parts[0])) {
    // About shows the live clinic count.
    const extra = parts[0] === 'about' ? [CLINIC_DATA] : [];
    return [`src/pages/${parts[0]}.astro`, ...extra, ...SHARED];
  }
  if (parts.length === 1) return ['src/pages/[state]/index.astro', CLINIC_DATA, ...SHARED];
  if (parts.length === 2) return ['src/pages/[state]/[city]/index.astro', CLINIC_DATA, 'src/data/cities.json', 'src/data/service-taxonomy.json', ...SHARED];
  return ['src/pages/[state]/[city]/[service]', CLINIC_DATA, 'src/data', ...SHARED];
}

export default defineConfig({
  output: 'static',
  site: 'https://freeclinics.us',
  // Sitemap integration. `site` above is what makes URLs absolute. Astro emits
  // sitemap-index.xml + sitemap-N.xml chunks under /dist on every build.
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX_PATHS.has(new URL(page).pathname),
      serialize(item) {
        const lastmod = lastCommitDate(sourcesFor(new URL(item.url).pathname));
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  vite: {
    server: {
      allowedHosts: true,
    },
  },
});
