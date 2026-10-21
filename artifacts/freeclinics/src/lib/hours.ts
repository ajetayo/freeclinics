// Helpers for the clinic `hours` field.
//
// The dataset has only a handful of distinct hours values: most are day ranges
// without times ("Monday - Friday"), "Call for hours", or "By appointment
// only"; ~3,100 have a time range ("Monday-Friday 8:00AM-5:00PM"). Times are
// never invented here — schema.org opening hours are emitted only when the
// source string contains an explicit day range and time range.

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

/** Display text for the hours field, normalized ("Call for Hours" → "Call for hours"). */
export function hoursLabel(hours: string | null): string {
  if (!hours || !hours.trim()) return 'Call for hours';
  return hours
    .trim()
    .replace(/\bCall for Hours\b/g, 'Call for hours')
    .replace(/\s*-\s*/g, ' – ')
    .replace(/(\d)\s*(AM|PM)\b/gi, (_, d: string, ap: string) => `${d} ${ap.toUpperCase()}`);
}

/** True when the hours string includes clock times. */
export function hasTimes(hours: string | null): boolean {
  return !!hours && /\d{1,2}(:\d{2})?\s*(AM|PM)/i.test(hours);
}

function to24h(time: string): string | null {
  const m = time.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${m[2] ?? '00'}`;
}

/**
 * schema.org OpeningHoursSpecification for strings like
 * "Monday-Friday 8:00AM-5:00PM"; null for anything less specific.
 */
export function openingHoursSpecification(hours: string | null): Record<string, unknown> | null {
  if (!hours) return null;
  const m = hours.trim().match(/^(\w+)\s*-\s*(\w+)\s+(\d{1,2}(?::\d{2})?\s*[AP]M)\s*-\s*(\d{1,2}(?::\d{2})?\s*[AP]M)$/i);
  if (!m) return null;
  const from = DAYS.findIndex((d) => d.toLowerCase() === m[1].toLowerCase());
  const to = DAYS.findIndex((d) => d.toLowerCase() === m[2].toLowerCase());
  const opens = to24h(m[3].replace(/\s+/g, ''));
  const closes = to24h(m[4].replace(/\s+/g, ''));
  if (from < 0 || to < from || !opens || !closes) return null;
  return {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: DAYS.slice(from, to + 1).map((d) => `https://schema.org/${d}`),
    opens,
    closes,
  };
}
