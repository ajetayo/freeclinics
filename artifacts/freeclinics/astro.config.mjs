import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://freeclinics.us',
  // Sitemap integration. `site` above is what makes URLs absolute. With ~593
  // static routes, Astro will emit a sitemap-index.xml + one or more
  // sitemap-0.xml chunks under /dist on every build.
  integrations: [sitemap()],
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
