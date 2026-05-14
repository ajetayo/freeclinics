# Free Clinics US

A static, SEO-focused directory of free and low-cost health clinics in the United States, served as fully pre-rendered HTML via Astro.

## Run & Operate

- `pnpm --filter @workspace/freeclinics run dev` — run the Astro dev server
- `pnpm --filter @workspace/freeclinics run build` — build static HTML to `artifacts/freeclinics/dist/`
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000, not used by the static site yet)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: Astro 5 (`output: 'static'`) — fully pre-rendered HTML, no client-side framework
- API: Express 5 (exists in workspace, not yet wired to the static site)
- DB: PostgreSQL + Drizzle ORM (exists in workspace, not yet used)

## Where things live

- `artifacts/freeclinics/` — the Astro site package (`@workspace/freeclinics`)
- `artifacts/freeclinics/astro.config.mjs` — Astro config (output: static, site: https://freeclinics.us)
- `artifacts/freeclinics/src/layouts/BaseLayout.astro` — base HTML layout with head, title, meta description, viewport, canonical
- `artifacts/freeclinics/src/pages/` — file-based routing:
  - `index.astro` → `/`
  - `[state]/[city]/index.astro` → `/georgia/atlanta/` (city hub)
  - `[state]/[city]/[service]/index.astro` → `/texas/houston/blood-pressure-screening/` (service + location)
  - `clinic/[slug]/index.astro` → `/clinic/example-clinic/` (clinic detail)
- `artifacts/freeclinics/dist/` — static build output (plain `.html` files, no JS bundles)

## Architecture decisions

- **No client-side framework** — Astro with `output: 'static'` produces plain HTML with zero JS overhead. Critical for SEO, especially for a directory site that previously suffered from CSR.
- **`getStaticPaths()` per route** — each dynamic route declares its own path set. When real data exists, these functions will query the DB at build time via Drizzle.
- **Canonical URLs baked in at build time** — `BaseLayout` accepts a `canonicalUrl` prop so every page's canonical is set statically, not derived from `window.location`.
- **`site` set in `astro.config.mjs`** — enables Astro's sitemap integration and ensures absolute URLs are correct in production.

## Product

Static HTML directory of free/low-cost US health clinics, SEO-optimized with unique titles, descriptions, and canonical tags per page.

## User preferences

- Static output only (`output: 'static'`), no SSR
- No UI framework integration (no React, Vue, Svelte, etc.)
- TypeScript throughout

## Gotchas

- Always re-run `astro build` after adding new routes — the static site is not auto-rebuilt on file changes in production.
- `getStaticPaths()` is the gating function for each dynamic route. Pages not returned from it will NOT be built.
- The `dist/` output is flat HTML — no JS bundles. Do not add framework integrations without confirming the SEO strategy.
- `pnpm --filter @workspace/freeclinics run typecheck` runs `astro check` (not `tsc --noEmit`), which type-checks `.astro` files.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
