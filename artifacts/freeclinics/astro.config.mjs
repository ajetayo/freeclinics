import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://freeclinics.us',
  server: {
    host: '0.0.0.0',
  },
  vite: {
    server: {
      allowedHosts: true,
    },
  },
});
