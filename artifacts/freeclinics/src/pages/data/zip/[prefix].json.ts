import type { APIRoute } from 'astro';
import { ZIP_SHARDS } from '../../../lib/searchData';

// ZIP code centroids (US Census Bureau 2024 ZCTA gazetteer), one file per 3-digit prefix.
export function getStaticPaths() {
  return [...ZIP_SHARDS.keys()].map((prefix) => ({ params: { prefix } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(ZIP_SHARDS.get(params.prefix as string) ?? {}), {
    headers: { 'Content-Type': 'application/json' },
  });
