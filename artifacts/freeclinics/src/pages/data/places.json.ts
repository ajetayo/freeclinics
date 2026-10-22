import type { APIRoute } from 'astro';
import { PLACES } from '../../lib/searchData';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(PLACES), {
    headers: { 'Content-Type': 'application/json' },
  });
