import { describe, expect, it } from 'vitest';
import {
  formatInstantDateTime,
  localDateStartToUtcISOString,
} from './dateFormatter';

describe('formatInstantDateTime', () => {
  it('formats real timestamps in the local timezone and returns invalid values unchanged', () => {
    const value = '2026-07-10T16:30:00.000Z';
    expect(formatInstantDateTime(value, 'de-CH')).toBe(
      new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)),
    );
    expect(formatInstantDateTime('invalid', 'en')).toBe('invalid');
  });
});

describe('timezone-aware date helpers', () => {
  it('converts Zurich date boundaries to their actual UTC instants', () => {
    expect(localDateStartToUtcISOString('2026-07-10')).toBe('2026-07-09T22:00:00.000Z');
    expect(localDateStartToUtcISOString('2026-01-10')).toBe('2026-01-09T23:00:00.000Z');
  });

  it('returns invalid values unchanged', () => {
    expect(localDateStartToUtcISOString('invalid')).toBe('invalid');
  });
});
