// Page <title> and meta-description builders for clinic and city pages.
//
// Titles target <= 60 characters so they are not truncated in search results,
// lead with the words people search for (the clinic's own name, then the
// place), and end with what the page answers ("Hours, Phone & Fees"). Clinic
// names are long (median 41 chars) and ~78% are "Organization - Site" pairs,
// so the clinic title tries progressively shorter forms of the name before
// dropping the suffix. Titles that would collide with another clinic's are
// disambiguated with the street address.

import { getAllClinics } from './clinics';
import type { Clinic } from './types';

const MAX_TITLE = 60;
const MAX_DESCRIPTION = 155;

const TITLE_SUFFIXES = [': Hours, Phone & Fees', ': Hours & Phone', ''];

const LEGAL_SUFFIX = /,?\s+(Inc\.?|LLC|L\.L\.C\.|P\.?C\.?|PLLC|Corp\.?|Corporation|Ltd\.?)(?=$|\s|,)/gi;

// Words that don't identify a site on their own ("Central Clinic",
// "Main Office"). A site part made only of these keeps its organization name.
const GENERIC_WORDS = new Set(
  ('clinic clinics health center centre centers medical office main campus satellite family primary ' +
   'care community location site va building services service the of at and in on de del la el en ' +
   'north south east west central downtown medicine practice group hospital program unit suite ' +
   'street st ave avenue road rd').split(' '),
);

/** Collapse whitespace, normalize " -X" separators, drop "Inc."/"LLC" etc. */
function cleanName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+-(?=\S)/g, ' - ')
    .replace(/(?<=\S)-\s+/g, ' - ')
    .replace(LEGAL_SUFFIX, '')
    .replace(/^[\s,]+|[\s,]+$/g, '');
}

/** Split "Organization - Site" into its parts; site is null when there is no separator. */
function splitName(name: string): { org: string; site: string | null } {
  const parts = name.split(/\s[-–—]\s/);
  if (parts.length < 2) return { org: name, site: null };
  return { org: parts[0].trim(), site: parts.slice(1).join(' - ').trim() };
}

function words(s: string): string[] {
  return s.toLowerCase().match(/[a-zà-ÿ'.]+/g) ?? [];
}

function isDistinctiveSite(site: string, city: string): boolean {
  const cityWords = new Set(words(city));
  return words(site).some((w) => w.length > 1 && !GENERIC_WORDS.has(w) && !cityWords.has(w));
}

/** True when the name already names the city as its location ("UHS Primary Care - Vestal"). */
function nameIncludesCityAsLocation(name: string, city: string): boolean {
  const { site } = splitName(name);
  const lowerCity = city.toLowerCase();
  if (site) return site.toLowerCase().includes(lowerCity);
  return name.toLowerCase().endsWith(lowerCity);
}

/** Name forms to try, longest/most specific first. */
function nameCandidates(clinic: Clinic): string[] {
  const name = cleanName(clinic.name);
  const { org, site } = splitName(name);
  if (!site) return [name];
  const out = [`${org} ${site}`];
  if (isDistinctiveSite(site, clinic.city)) out.push(site);
  out.push(org);
  return out;
}

function withPlace(name: string, clinic: Clinic, suffix: string): string {
  const fullName = cleanName(clinic.name);
  const place =
    nameIncludesCityAsLocation(fullName, clinic.city) && name.toLowerCase().includes(clinic.city.toLowerCase())
      ? clinic.stateAbbr
      : `${clinic.city}, ${clinic.stateAbbr}`;
  return `${name} – ${place}${suffix}`;
}

function baseClinicTitle(clinic: Clinic): string {
  const candidates = nameCandidates(clinic);
  for (const name of candidates) {
    for (const suffix of TITLE_SUFFIXES) {
      const title = withPlace(name, clinic, suffix);
      if (title.length <= MAX_TITLE) return title;
    }
  }
  return withPlace(candidates[candidates.length - 1], clinic, '');
}

/** "123 Main St" from "123 Main St, Ste 200". */
function shortStreet(clinic: Clinic): string | null {
  if (!clinic.streetAddress) return null;
  return clinic.streetAddress.split(/,|\s(?:Ste|Suite|#|Unit|Bldg)\b/)[0].trim() || null;
}

/**
 * A title for a clinic whose base title collides with another clinic's: the
 * first form that fits and isn't already taken, trying each name form with
 * the place, then with the street; failing that, the shortest form.
 */
function disambiguatedTitle(clinic: Clinic, taken: Set<string>): string {
  const street = shortStreet(clinic);
  const options: string[] = [];
  for (const name of nameCandidates(clinic)) {
    options.push(withPlace(name, clinic, ''));
    if (street) options.push(`${name} – ${street}, ${clinic.city}`);
  }
  const fits = options.find((t) => t.length <= MAX_TITLE && !taken.has(t));
  return fits ?? options.reduce((a, b) => (b.length < a.length ? b : a));
}

// Built once per build: slug → title, with collisions disambiguated.
const TITLE_BY_SLUG: Map<string, string> = (() => {
  const all = getAllClinics();
  const base = new Map(all.map((c) => [c.slug, baseClinicTitle(c)]));
  const counts = new Map<string, number>();
  for (const t of base.values()) counts.set(t, (counts.get(t) ?? 0) + 1);
  const taken = new Set(base.values());
  for (const c of all) {
    if ((counts.get(base.get(c.slug)!) ?? 0) > 1) {
      const title = disambiguatedTitle(c, taken);
      base.set(c.slug, title);
      taken.add(title);
    }
  }
  return base;
})();

/** e.g. "Minnie Jones Health Center – Asheville, NC: Hours & Phone" */
export function clinicTitle(clinic: Clinic): string {
  return TITLE_BY_SLUG.get(clinic.slug) ?? baseClinicTitle(clinic);
}

/** Short, recognizable form of the clinic name (used in descriptions). */
export function clinicShortName(clinic: Clinic): string {
  const candidates = nameCandidates(clinic);
  return candidates.find((n) => n.length <= 45) ?? candidates[candidates.length - 1];
}

/** Plain-language fee line from the raw feeStructure string, or null. */
export function feeSummary(feeStructure: string | null): string | null {
  if (!feeStructure) return null;
  const fs = feeStructure.toLowerCase();
  if (fs.includes('free') || fs.includes('no fee')) return 'Free or low-cost care';
  if (fs.includes('sliding')) return 'Sliding-scale fees based on income';
  if (fs.includes('financial assistance')) return 'Financial assistance available';
  if (fs.includes('low cost')) return 'Low-cost care';
  if (fs.includes('donation')) return 'Free care, donations welcome';
  return null;
}

/** Meta description built from the clinic's own data, trimmed to <= 155 chars by dropping parts. */
export function clinicDescription(clinic: Clinic, hoursText: string): string {
  const name = clinicShortName(clinic);
  const fee = feeSummary(clinic.feeStructure);
  const parts = [
    `${name} in ${clinic.city}, ${clinic.stateAbbr}.`,
    fee ? `${fee}.` : null,
    clinic.phone ? `Call ${clinic.phone}.` : null,
    `Hours: ${hoursText}.`,
    'Services, eligibility, insurance and directions.',
  ].filter((p): p is string => Boolean(p));

  // Drop the least important parts (from the end, never the first) until it fits.
  while (parts.join(' ').length > MAX_DESCRIPTION && parts.length > 1) parts.pop();
  return parts.join(' ');
}

/** e.g. "9 Free & Low-Cost Clinics in Asheville, NC (2026)" */
export function cityTitle(cityName: string, stateAbbr: string, clinicCount: number): string {
  const year = new Date().getFullYear();
  const noun = clinicCount === 1 ? 'Clinic' : 'Clinics';
  const options = [
    `${clinicCount} Free & Low-Cost ${noun} in ${cityName}, ${stateAbbr} (${year})`,
    `${clinicCount} Free & Low-Cost ${noun} in ${cityName}, ${stateAbbr}`,
    `Free & Low-Cost Clinics in ${cityName}, ${stateAbbr}`,
  ];
  return options.find((t) => t.length <= MAX_TITLE) ?? options[options.length - 1];
}
