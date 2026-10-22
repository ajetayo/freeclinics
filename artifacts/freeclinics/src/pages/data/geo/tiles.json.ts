import type { APIRoute } from 'astro';
import { TILES } from '../../../lib/searchData';

// Index of tiles that exist, so the search never requests an empty (404) tile.
export const GET: APIRoute = () =>
  new Response(JSON.stringify([...TILES.keys()]), {
    headers: { 'Content-Type': 'application/json' },
  });
