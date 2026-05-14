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
