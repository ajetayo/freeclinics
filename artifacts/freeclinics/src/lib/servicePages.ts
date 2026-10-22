// Which /[state]/[city]/[service]/ pages exist.
//
// Two sources: the hand-picked Phase 1 combos (phase1-service-locations.json),
// and services that get a page in every city where at least one listed clinic
// offers them (AUTO_SERVICES). Pages are only built when the city itself has a
// matching clinic, so no service page is ever empty.

import phase1Combos from '../data/phase1-service-locations.json';
import cities from '../data/cities.json';
import { getClinicsByCityState, getClinicsByService } from './clinics';
import { US_STATES } from './constants';

export interface ServiceCombo {
  stateSlug: string;
  citySlug: string;
  serviceSlug: string;
}

/** Services built for every city with at least one matching clinic. */
export const AUTO_SERVICES = ['std-testing'] as const;

const ALL_COMBOS: ServiceCombo[] = (() => {
  const seen = new Set<string>();
  const out: ServiceCombo[] = [];
  const add = (c: ServiceCombo) => {
    const key = `${c.stateSlug}/${c.citySlug}/${c.serviceSlug}`;
    if (seen.has(key) || !(c.stateSlug in US_STATES)) return;
    if (getClinicsByService(getClinicsByCityState(c.stateSlug, c.citySlug), c.serviceSlug).length === 0) return;
    seen.add(key);
    out.push(c);
  };
  for (const c of phase1Combos as ServiceCombo[]) add(c);
  for (const city of cities as Array<{ stateSlug: string; citySlug: string }>) {
    for (const serviceSlug of AUTO_SERVICES) add({ stateSlug: city.stateSlug, citySlug: city.citySlug, serviceSlug });
  }
  return out;
})();

const BY_CITY: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const c of ALL_COMBOS) {
    const key = `${c.stateSlug}/${c.citySlug}`;
    map.set(key, [...(map.get(key) ?? []), c.serviceSlug]);
  }
  return map;
})();

/** Every service+location page to build. */
export function getServiceCombos(): ServiceCombo[] {
  return ALL_COMBOS;
}

/** Service slugs that have a page for this city (empty if none). */
export function getServicePagesForCity(stateSlug: string, citySlug: string): string[] {
  return BY_CITY.get(`${stateSlug}/${citySlug}`) ?? [];
}
