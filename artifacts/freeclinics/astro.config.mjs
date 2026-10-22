import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

// Clinic pages marked noindex (src/data/noindex-clinics.json) are left out of the sitemap.
const NOINDEX_PATHS = new Set(
  JSON.parse(readFileSync(new URL('./src/data/noindex-clinics.json', import.meta.url), 'utf8'))
    .map((c) => `/clinic/${c.slug}/`),
);

export default defineConfig({
  output: 'static',
  site: 'https://freeclinics.us',
  // Sitemap integration. `site` above is what makes URLs absolute. Astro emits
  // sitemap-index.xml + sitemap-N.xml chunks under /dist on every build.
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX_PATHS.has(new URL(page).pathname),
      // <lastmod> is added after the build by scripts/update-lastmod.mjs,
      // from changes in each page's rendered content.
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
