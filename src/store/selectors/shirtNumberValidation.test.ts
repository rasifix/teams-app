import { describe, expect, it } from 'vitest';
import { validateShirtNumber } from './shirtNumberValidation';

describe('validateShirtNumber', () => {
  it('accepts an available number in range', () => {
    expect(validateShirtNumber('12', [1, 3])).toBeNull();
  });
  it('rejects missing, nonnumeric, and out of range values', () => {
    expect(validateShirtNumber('', [])).toBe('invalid');
    expect(validateShirtNumber('abc', [])).toBe('invalid');
    expect(validateShirtNumber('100', [])).toBe('invalid');
  });
  it('rejects a duplicate except when it is the current shirt number', () => {
    expect(validateShirtNumber('7', [7])).toBe('exists');
    expect(validateShirtNumber('7', [7], 7)).toBeNull();
  });
});
