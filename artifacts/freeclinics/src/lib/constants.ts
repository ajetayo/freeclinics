// ---------------------------------------------------------------------------
// US_STATES — slug → { abbr, name }
// ---------------------------------------------------------------------------
// Covers all 50 states, DC, and the five territories present in the clinic
// dataset (Puerto Rico, Guam, US Virgin Islands, American Samoa, Northern
// Mariana Islands). Slugs are lowercase with hyphens — they match the
// `[state]` URL segment.

export interface StateInfo {
  abbr: string;
  name: string;
}

export const US_STATES: Record<string, StateInfo> = {
  alabama:                       { abbr: 'AL', name: 'Alabama' },
  alaska:                        { abbr: 'AK', name: 'Alaska' },
  arizona:                       { abbr: 'AZ', name: 'Arizona' },
  arkansas:                      { abbr: 'AR', name: 'Arkansas' },
  california:                    { abbr: 'CA', name: 'California' },
  colorado:                      { abbr: 'CO', name: 'Colorado' },
  connecticut:                   { abbr: 'CT', name: 'Connecticut' },
  delaware:                      { abbr: 'DE', name: 'Delaware' },
  florida:                       { abbr: 'FL', name: 'Florida' },
  georgia:                       { abbr: 'GA', name: 'Georgia' },
  hawaii:                        { abbr: 'HI', name: 'Hawaii' },
  idaho:                         { abbr: 'ID', name: 'Idaho' },
  illinois:                      { abbr: 'IL', name: 'Illinois' },
  indiana:                       { abbr: 'IN', name: 'Indiana' },
  iowa:                          { abbr: 'IA', name: 'Iowa' },
  kansas:                        { abbr: 'KS', name: 'Kansas' },
  kentucky:                      { abbr: 'KY', name: 'Kentucky' },
  louisiana:                     { abbr: 'LA', name: 'Louisiana' },
  maine:                         { abbr: 'ME', name: 'Maine' },
  maryland:                      { abbr: 'MD', name: 'Maryland' },
  massachusetts:                 { abbr: 'MA', name: 'Massachusetts' },
  michigan:                      { abbr: 'MI', name: 'Michigan' },
  minnesota:                     { abbr: 'MN', name: 'Minnesota' },
  mississippi:                   { abbr: 'MS', name: 'Mississippi' },
  missouri:                      { abbr: 'MO', name: 'Missouri' },
  montana:                       { abbr: 'MT', name: 'Montana' },
  nebraska:                      { abbr: 'NE', name: 'Nebraska' },
  nevada:                        { abbr: 'NV', name: 'Nevada' },
  'new-hampshire':               { abbr: 'NH', name: 'New Hampshire' },
  'new-jersey':                  { abbr: 'NJ', name: 'New Jersey' },
  'new-mexico':                  { abbr: 'NM', name: 'New Mexico' },
  'new-york':                    { abbr: 'NY', name: 'New York' },
  'north-carolina':              { abbr: 'NC', name: 'North Carolina' },
  'north-dakota':                { abbr: 'ND', name: 'North Dakota' },
  ohio:                          { abbr: 'OH', name: 'Ohio' },
  oklahoma:                      { abbr: 'OK', name: 'Oklahoma' },
  oregon:                        { abbr: 'OR', name: 'Oregon' },
  pennsylvania:                  { abbr: 'PA', name: 'Pennsylvania' },
  'rhode-island':                { abbr: 'RI', name: 'Rhode Island' },
  'south-carolina':              { abbr: 'SC', name: 'South Carolina' },
  'south-dakota':                { abbr: 'SD', name: 'South Dakota' },
  tennessee:                     { abbr: 'TN', name: 'Tennessee' },
  texas:                         { abbr: 'TX', name: 'Texas' },
  utah:                          { abbr: 'UT', name: 'Utah' },
  vermont:                       { abbr: 'VT', name: 'Vermont' },
  virginia:                      { abbr: 'VA', name: 'Virginia' },
  washington:                    { abbr: 'WA', name: 'Washington' },
  'west-virginia':               { abbr: 'WV', name: 'West Virginia' },
  wisconsin:                     { abbr: 'WI', name: 'Wisconsin' },
  wyoming:                       { abbr: 'WY', name: 'Wyoming' },
  'district-of-columbia':        { abbr: 'DC', name: 'District of Columbia' },
  'puerto-rico':                 { abbr: 'PR', name: 'Puerto Rico' },
  guam:                          { abbr: 'GU', name: 'Guam' },
  'us-virgin-islands':           { abbr: 'VI', name: 'US Virgin Islands' },
  'american-samoa':              { abbr: 'AS', name: 'American Samoa' },
  'northern-mariana-islands':    { abbr: 'MP', name: 'Northern Mariana Islands' },
};

// ---------------------------------------------------------------------------
// SERVICE_NAMES — slug → display name
// ---------------------------------------------------------------------------
// Slugs match the `[service]` URL segment. Display names are what we render
// in headings, intro copy, and meta descriptions. Includes the explicit list
// in the spec and a handful of common adjacent services likely to appear
// in the dataset.

export const SERVICE_NAMES: Record<string, string> = {
  'womens-health':                "Women's Health",
  'ob-gyn':                       'OB-GYN',
  'blood-pressure-screening':     'Blood Pressure Screening',
  'x-ray':                        'X-Ray',
  'std-testing':                  'STD Testing',
  'covid-19-testing':             'COVID-19 Testing',
  medical:                        'Medical',
  pregnancy:                      'Pregnancy',
  immunizations:                  'Immunizations',
  'cholesterol-screening':        'Cholesterol Screening',
  'hepatitis-c-testing':          'Hepatitis C Testing',
  'family-planning':              'Family Planning',
  'diabetes-screening':           'Diabetes Screening',
  'mental-health':                'Mental Health',
  'substance-abuse':              'Substance Abuse Treatment',
  dental:                         'Dental',
  'eye-care':                     'Eye Care',
  'hiv-testing':                  'HIV Testing',
  'prenatal-care':                'Prenatal Care',
  pediatrics:                     'Pediatrics',
  'urgent-care':                  'Urgent Care',
  pharmacy:                       'Pharmacy',
  'cancer-screening':             'Cancer Screening',
  'flu-shots':                    'Flu Shots',
  vaccinations:                   'Vaccinations',
  mammograms:                     'Mammograms',
  'pap-smears':                   'Pap Smears',
  'birth-control':                'Birth Control',
  'tb-testing':                   'TB Testing',
  'hepatitis-b-testing':          'Hepatitis B Testing',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Title-case a slug ("city-name" → "City Name"). Use for things not in a constants map (e.g. city names). */
export function toTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Look up a state by slug. Returns null if unknown. */
export function getState(slug: string): StateInfo | null {
  return US_STATES[slug] ?? null;
}

/** Look up a service display name by slug. Falls back to title-casing the slug. */
export function getServiceDisplayName(slug: string): string {
  return SERVICE_NAMES[slug] ?? toTitleCase(slug);
}
