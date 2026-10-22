import type { APIRoute } from 'astro';
import { TILES } from '../../../lib/searchData';

export function getStaticPaths() {
  return [...TILES.keys()].map((tile) => ({ params: { tile } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(TILES.get(params.tile as string) ?? []), {
    headers: { 'Content-Type': 'application/json' },
  });
