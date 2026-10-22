// Static search data for /near-me/: clinic points bucketed into 1° lat/long
// tiles, ZIP centroids sharded by 3-digit prefix, and a city list. Built once
// at build time and served as small JSON files under /data/, so a search
// downloads only the few tiles around the visitor instead of all ~18.8k
// clinics.

import { getAllClinics, getClinicsByCityState } from './clinics';
import { US_STATES } from './constants';
import { feeSummary } from './titles';
import { hoursLabel } from './hours';
import cities from '../data/cities.json';
import zipCentroids from '../data/zip-centroids.json';
import clinicSlugs from '../data/clinic-slugs.json';

/** One clinic in a tile: [slug, name, city, stateAbbr, lat, long, phone, fee, hours]. */
export type ClinicPoint = [string, string, string, string, number, number, string, string, string];

export const tileKey = (lat: number, long: number) => `${Math.floor(lat)}_${Math.floor(long)}`;

const PUBLISHED = new Set(clinicSlugs as string[]);

export const TILES: Map<string, ClinicPoint[]> = (() => {
  const map = new Map<string, ClinicPoint[]>();
  for (const c of getAllClinics()) {
    if (typeof c.lat !== 'number' || typeof c.long !== 'number') continue;
    if (!PUBLISHED.has(c.slug) || !(c.stateSlug in US_STATES)) continue;
    const key = tileKey(c.lat, c.long);
    const point: ClinicPoint = [
      c.slug, c.name, c.city, c.stateAbbr,
      Math.round(c.lat * 10000) / 10000, Math.round(c.long * 10000) / 10000,
      c.phone ?? '', feeSummary(c.feeStructure) ?? '', hoursLabel(c.hours),
    ];
    map.set(key, [...(map.get(key) ?? []), point]);
  }
  return map;
})();

export const ZIP_SHARDS: Map<string, Record<string, [number, number]>> = (() => {
  const map = new Map<string, Record<string, [number, number]>>();
  for (const [zip, coords] of Object.entries(zipCentroids as Record<string, [number, number]>)) {
    const prefix = zip.slice(0, 3);
    const shard = map.get(prefix) ?? {};
    shard[zip] = coords;
    map.set(prefix, shard);
  }
  return map;
})();

/** City list for text search: [cityName, stateAbbr, url, lat, long]. */
export const PLACES: Array<[string, string, string, number, number]> = (() => {
  const out: Array<[string, string, string, number, number]> = [];
  for (const city of cities as Array<{ stateSlug: string; citySlug: string; cityName: string; stateAbbr: string }>) {
    if (!(city.stateSlug in US_STATES)) continue;
    const located = getClinicsByCityState(city.stateSlug, city.citySlug)
      .filter((c) => typeof c.lat === 'number' && typeof c.long === 'number');
    if (located.length === 0) continue;
    const lat = located.reduce((s, c) => s + (c.lat as number), 0) / located.length;
    const long = located.reduce((s, c) => s + (c.long as number), 0) / located.length;
    out.push([city.cityName, city.stateAbbr, `/${city.stateSlug}/${city.citySlug}/`,
      Math.round(lat * 1000) / 1000, Math.round(long * 1000) / 1000]);
  }
  return out;
})();
