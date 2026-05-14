import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://freeclinics.us',
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
