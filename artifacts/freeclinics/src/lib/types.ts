// Shared domain types for the freeclinics.us site.
//
// `Clinic` mirrors the shape of records in `src/data/clinics.json` exactly.
// Fields documented as nullable in the source dataset are typed as `T | null`
// (not `T | undefined`) so we don't silently lose the distinction between
// "not present" and "explicitly missing" when reading from JSON.

export interface Clinic {
  slug: string;
  name: string;
  streetAddress: string | null;
  city: string;
  stateAbbr: string;
  stateSlug: string;
  citySlug: string;
  postalCode: string | null;
  phone: string | null;
  website: string | null;
  insuranceAccepted: string[];
  languages: string[];
  /** Raw source strings — not normalized. */
  services: string[];
  feeStructure: string | null;
  incomeEligibility: string | null;
  hours: string | null;
  serviceArea: string | null;
  lat: number | null;
  long: number | null;
}

export interface FAQ {
  question: string;
  answer: string;
}
