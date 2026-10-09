import { describe, expect, it } from 'vitest';
import { getBirthYear } from './birthDate';

describe('getBirthYear', () => {
  it('returns the year for a valid ISO date', () => {
    expect(getBirthYear('2015-06-01')).toBe(2015);
  });

  it('returns undefined when birthDate is undefined', () => {
    expect(getBirthYear(undefined)).toBeUndefined();
  });

  it('returns undefined for an invalid string', () => {
    expect(getBirthYear('not-a-date')).toBeUndefined();
  });
});
