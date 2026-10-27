/**
 * Formats a date string to Swiss German locale format
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "06.11.2025")
 */
export function formatDate(dateString: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return dateString;
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}

/** Formats a real ISO timestamp in the browser's local timezone. */
export function formatInstantDateTime(value: string, locale: string): string {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(instant);
}

/** Formats the time portion of an ISO timestamp in the browser's local timezone. */
export function formatInstantTime(value: string, locale: string): string {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(instant);
}

const dateTimeParts = (value: Date, timeZone: string): Record<string, string> => Object.fromEntries(
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value).map((part) => [part.type, part.value]),
);

/** Resolves midnight on a local calendar date to the corresponding UTC instant. */
export function localDateStartToUtcISOString(date: string, timeZone = 'Europe/Zurich'): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;
  const [, year, month, day] = match.map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day);
  const initialParts = dateTimeParts(new Date(localAsUtc), timeZone);
  const offset = Date.UTC(
    Number(initialParts.year),
    Number(initialParts.month) - 1,
    Number(initialParts.day),
    Number(initialParts.hour),
    Number(initialParts.minute),
    Number(initialParts.second),
  ) - localAsUtc;
  return new Date(localAsUtc - offset).toISOString();
}
