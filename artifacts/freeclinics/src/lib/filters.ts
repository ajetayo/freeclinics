// Clinic filter attributes for list pages (city hubs). Derived from each
// listing's own data at build time; a clinic only gets an attribute when the
// listing says so, never by assumption.

import serviceTaxonomy from '../data/service-taxonomy.json';
import type { Clinic } from './types';

const TAXONOMY = serviceTaxonomy as Record<string, string[]>;

export interface ClinicFilter {
  key: string;
  label: string;
  matches: (c: Clinic) => boolean;
}

const offers = (slug: string) => {
  const terms = new Set(TAXONOMY[slug] ?? []);
  return (c: Clinic) => c.services.some((s) => terms.has(s));
};

export const CLINIC_FILTERS: ClinicFilter[] = [
  {
    key: 'free',
    label: 'Free',
    matches: (c) => /free|no fee|donation/i.test(c.feeStructure ?? ''),
  },
  {
    key: 'sliding',
    label: 'Sliding scale',
    matches: (c) => /sliding/i.test(c.feeStructure ?? ''),
  },
  { key: 'dental', label: 'Dental', matches: offers('dental') },
  { key: 'mental', label: 'Mental health', matches: offers('mental-health') },
  {
    key: 'walkin',
    label: 'Walk-ins',
    matches: (c) => c.services.includes('Walk-ins Accepted') || /walk-?in/i.test(c.name),
  },
  {
    key: 'spanish',
    label: 'Spanish spoken',
    matches: (c) => c.languages.some((l) => /spanish/i.test(l)),
  },
  {
    key: 'saturday',
    label: 'Open Saturday',
    matches: (c) => /saturday|sunday|7 days/i.test(c.hours ?? ''),
  },
];

/** Filter keys that apply to a clinic, in CLINIC_FILTERS order. */
export function clinicFilterKeys(clinic: Clinic): string[] {
  return CLINIC_FILTERS.filter((f) => f.matches(clinic)).map((f) => f.key);
}
