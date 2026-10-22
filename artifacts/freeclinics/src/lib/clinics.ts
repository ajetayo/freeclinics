// Build-time data-access module for the clinic dataset.
//
// The full dataset (~18.8k records) is imported once at module load and held
// in memory. All accessor functions read from this in-memory array — there is
// no per-call file I/O. Because Astro runs `getStaticPaths` and page rendering
// at build time, this module is only ever evaluated during the build, never
// in a request hot path.

import rawClinics from '../data/clinics.json';
import rawTaxonomy from '../data/service-taxonomy.json';
import type { Clinic } from './types';

const ALL_CLINICS: readonly Clinic[] = rawClinics as unknown as Clinic[];

const SERVICE_TAXONOMY: Record<string, string[]> = rawTaxonomy as Record<string, string[]>;

// Pre-built index: "stateSlug/citySlug" → clinics in that city. Built once on
// module load so per-call lookups are O(1) instead of O(n) over ~18.8k rows.
const BY_CITY: Map<string, Clinic[]> = (() => {
  const map = new Map<string, Clinic[]>();
  for (const c of ALL_CLINICS) {
    const key = `${c.stateSlug}/${c.citySlug}`;
    let bucket = map.get(key);
    if (!bucket) {
      bucket = [];
      map.set(key, bucket);
    }
    bucket.push(c);
  }
  return map;
})();

const BY_SLUG: Map<string, Clinic> = (() => {
  const map = new Map<string, Clinic>();
  for (const c of ALL_CLINICS) {
    map.set(c.slug, c);
  }
  return map;
})();

/** Return all clinics in the dataset. */
export function getAllClinics(): Clinic[] {
  return ALL_CLINICS as Clinic[];
}

/** Return all clinics in a given city. Empty array if the city is unknown. */
export function getClinicsByCityState(stateSlug: string, citySlug: string): Clinic[] {
  return BY_CITY.get(`${stateSlug}/${citySlug}`) ?? [];
}

/** Return a single clinic by slug, or undefined if no clinic has that slug. */
export function getClinicBySlug(slug: string): Clinic | undefined {
  return BY_SLUG.get(slug);
}

/**
 * Filter `clinics` down to those that offer the service identified by
 * `serviceSlug`. Membership is decided by the canonical mapping in
 * `service-taxonomy.json`: a clinic matches if its `services` array contains
 * at least one of the raw source strings the slug maps to.
 *
 * Throws if `serviceSlug` is not present in the taxonomy. We deliberately
 * fail the build here rather than silently shipping an unmapped service —
 * an unmapped slug would otherwise filter to zero clinics and produce a
 * broken-looking page.
 */
export function getClinicsByService(clinics: Clinic[], serviceSlug: string): Clinic[] {
  const sourceTerms = SERVICE_TAXONOMY[serviceSlug];
  if (!sourceTerms) {
    throw new Error(
      `getClinicsByService: service slug "${serviceSlug}" is not in service-taxonomy.json. ` +
        `Add a mapping there before generating routes for this service.`,
    );
  }
  const termSet = new Set(sourceTerms);
  return clinics.filter((c) => c.services.some((s) => termSet.has(s)));
}

// ---------------------------------------------------------------------------
// Nearby clinics
// ---------------------------------------------------------------------------
// Clinics are bucketed into a 0.5° lat/long grid once at module load, so a
// nearest-neighbour lookup only scans the surrounding cells instead of all
// ~18.8k clinics (this runs once per clinic page at build time).

const GRID_DEG = 0.5;
const EARTH_RADIUS_MI = 3958.8;

const hasCoords = (c: Clinic): c is Clinic & { lat: number; long: number } =>
  typeof c.lat === 'number' && typeof c.long === 'number';

const cellKey = (lat: number, long: number) =>
  `${Math.floor(lat / GRID_DEG)}:${Math.floor(long / GRID_DEG)}`;

const BY_CELL: Map<string, Clinic[]> = (() => {
  const map = new Map<string, Clinic[]>();
  for (const c of ALL_CLINICS) {
    if (!hasCoords(c)) continue;
    const key = cellKey(c.lat, c.long);
    let bucket = map.get(key);
    if (!bucket) {
      bucket = [];
      map.set(key, bucket);
    }
    bucket.push(c);
  }
  return map;
})();

function distanceMiles(lat1: number, long1: number, lat2: number, long2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLong = toRad(long2 - long1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLong / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(a));
}

export interface NearbyClinic {
  clinic: Clinic;
  miles: number;
}

/**
 * Up to `limit` clinics within `maxMiles` of a point, nearest first, skipping
 * any for which `exclude` returns true. The scan covers enough grid cells to
 * reach `maxMiles` in every direction: a degree of latitude is ~69 mi, a
 * degree of longitude shrinks with cos(latitude).
 */
export function getClinicsNearPoint(
  lat: number,
  long: number,
  { limit = 6, maxMiles = 25, exclude = (_: Clinic) => false }: { limit?: number; maxMiles?: number; exclude?: (c: Clinic) => boolean } = {},
): NearbyClinic[] {
  const row = Math.floor(lat / GRID_DEG);
  const col = Math.floor(long / GRID_DEG);
  const milesPerDegLat = 69.0;
  const milesPerDegLong = Math.max(69.17 * Math.cos((lat * Math.PI) / 180), 1);
  const rowSpan = Math.ceil(maxMiles / (milesPerDegLat * GRID_DEG));
  const colSpan = Math.ceil(maxMiles / (milesPerDegLong * GRID_DEG));

  const found: NearbyClinic[] = [];
  for (let r = row - rowSpan; r <= row + rowSpan; r++) {
    for (let k = col - colSpan; k <= col + colSpan; k++) {
      for (const other of BY_CELL.get(`${r}:${k}`) ?? []) {
        if (!hasCoords(other) || exclude(other)) continue;
        const miles = distanceMiles(lat, long, other.lat, other.long);
        if (miles <= maxMiles) found.push({ clinic: other, miles });
      }
    }
  }
  found.sort((a, b) => a.miles - b.miles || a.clinic.name.localeCompare(b.clinic.name));
  return found.slice(0, limit);
}

/** Up to `limit` other clinics within `maxMiles` of `clinic`, nearest first. */
export function getNearbyClinics(clinic: Clinic, limit = 6, maxMiles = 25): NearbyClinic[] {
  if (!hasCoords(clinic)) return [];
  return getClinicsNearPoint(clinic.lat, clinic.long, {
    limit,
    maxMiles,
    exclude: (other) => other.slug === clinic.slug,
  });
}

/**
 * Clinics near a city but outside it, measured from the average position of
 * the city's own clinics. Empty when none of the city's clinics have coordinates.
 * With `serviceSlug`, only clinics offering that service are returned.
 */
export function getClinicsNearCity(
  stateSlug: string,
  citySlug: string,
  limit = 8,
  maxMiles = 25,
  serviceSlug?: string,
): NearbyClinic[] {
  const located = getClinicsByCityState(stateSlug, citySlug).filter(hasCoords);
  if (located.length === 0) return [];
  const lat = located.reduce((sum, c) => sum + c.lat, 0) / located.length;
  const long = located.reduce((sum, c) => sum + c.long, 0) / located.length;
  const offers = serviceSlug ? new Set(SERVICE_TAXONOMY[serviceSlug] ?? []) : null;
  return getClinicsNearPoint(lat, long, {
    limit,
    maxMiles,
    exclude: (other) =>
      (other.stateSlug === stateSlug && other.citySlug === citySlug) ||
      (offers !== null && !other.services.some((s) => offers.has(s))),
  });
}
