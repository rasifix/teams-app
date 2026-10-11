/**
 * Formats a date string to Swiss German locale format
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "06.11.2025")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/** Formats the API's UTC-shaped local wall-clock convention without applying another timezone conversion. */
export function formatWallClockDateTime(value: string, locale: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  const wallClock = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(wallClock);
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

/** Converts a real instant into the API's UTC-shaped local wall-clock convention. */
export function instantToWallClockISOString(value: string, timeZone = 'Europe/Zurich'): string {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return value;
  const parts = dateTimeParts(instant, timeZone);
  const milliseconds = String(instant.getUTCMilliseconds()).padStart(3, '0');
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}Z`;
}

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
