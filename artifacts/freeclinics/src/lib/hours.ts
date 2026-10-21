// Helpers for the clinic `hours` field.
//
// Most dataset values are day ranges without times ("Monday - Friday"),
// "Call for hours", or "By appointment only". Values with times use the
// format "Monday-Friday 8:00AM-5:00PM", with several segments separated by
// "; " (e.g. "Monday-Thursday 8:00AM-7:00PM; Friday 8:00AM-5:00PM"). Times are
// never invented here — schema.org opening hours are emitted only when every
// segment has an explicit day (range) and time range.

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const SEGMENT = /^(\w+)(?:\s*-\s*(\w+))?\s+(\d{1,2}(?::\d{2})?\s*[AP]M)\s*-\s*(\d{1,2}(?::\d{2})?\s*[AP]M)$/i;

/** Tidy one display segment ("Monday-Friday 8:00AM-5:00PM" → "Monday – Friday 8:00 AM – 5:00 PM"). */
function tidy(segment: string): string {
  return segment
    .trim()
    .replace(/\bCall for Hours\b/g, 'Call for hours')
    .replace(/\s*-\s*(?=(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|\d))/gi, ' – ')
    .replace(/(\d)\s*(AM|PM)\b/gi, (_, d: string, ap: string) => `${d} ${ap.toUpperCase()}`);
}

/** Display lines for the hours field, one per segment. */
export function hoursLines(hours: string | null): string[] {
  if (!hours || !hours.trim()) return ['Call for hours'];
  return hours.split(';').map(tidy).filter(Boolean);
}

/** Single-line display text (used in meta descriptions). */
export function hoursLabel(hours: string | null): string {
  return hoursLines(hours).join('; ');
}

/** True when the hours string includes clock times. */
export function hasTimes(hours: string | null): boolean {
  return !!hours && /\d{1,2}(:\d{2})?\s*(AM|PM)/i.test(hours);
}

function to24h(time: string): string | null {
  const m = time.replace(/\s+/g, '').match(/^(\d{1,2})(?::(\d{2}))?(AM|PM)$/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${m[2] ?? '00'}`;
}

/**
 * schema.org OpeningHoursSpecification entries, one per segment; null unless
 * every segment parses (a partly-parsed schedule would misstate the hours).
 */
export function openingHoursSpecification(hours: string | null): Record<string, unknown>[] | null {
  if (!hours) return null;
  const specs: Record<string, unknown>[] = [];
  for (const segment of hours.split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = segment.match(SEGMENT);
    if (!m) return null;
    const from = DAYS.findIndex((d) => d.toLowerCase() === m[1].toLowerCase());
    const to = m[2] ? DAYS.findIndex((d) => d.toLowerCase() === m[2].toLowerCase()) : from;
    const opens = to24h(m[3]);
    const closes = to24h(m[4]);
    if (from < 0 || to < from || !opens || !closes) return null;
    specs.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAYS.slice(from, to + 1).map((d) => `https://schema.org/${d}`),
      opens,
      closes,
    });
  }
  return specs.length > 0 ? specs : null;
}
