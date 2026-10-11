import { describe, expect, it } from 'vitest';
import {
  formatWallClockDateTime,
  instantToWallClockISOString,
  localDateStartToUtcISOString,
} from './dateFormatter';

describe('formatWallClockDateTime', () => {
  it('preserves the encoded wall-clock hour instead of applying a timezone offset', () => {
    const formatted = formatWallClockDateTime('2026-07-10T18:30:00.000Z', 'de-CH');
    expect(formatted).toContain('18:30');
  });

  it('returns invalid values unchanged', () => {
    expect(formatWallClockDateTime('invalid', 'en')).toBe('invalid');
  });
});

describe('Spond timezone conversion', () => {
  it('converts UTC instants to Zurich wall-clock values with daylight saving time', () => {
    expect(instantToWallClockISOString('2026-07-10T16:30:00.000Z')).toBe('2026-07-10T18:30:00.000Z');
    expect(instantToWallClockISOString('2026-01-10T17:30:00.000Z')).toBe('2026-01-10T18:30:00.000Z');
  });

  it('converts Zurich date boundaries to their actual UTC instants', () => {
    expect(localDateStartToUtcISOString('2026-07-10')).toBe('2026-07-09T22:00:00.000Z');
    expect(localDateStartToUtcISOString('2026-01-10')).toBe('2026-01-09T23:00:00.000Z');
  });

  it('leaves invalid values unchanged', () => {
    expect(instantToWallClockISOString('invalid')).toBe('invalid');
    expect(localDateStartToUtcISOString('invalid')).toBe('invalid');
  });
});
