import { describe, expect, it } from 'vitest';
import type { Shirt } from '../../types';
import { selectSortedShirts } from './shirtSetSelectors';

const shirt = (number: number): Shirt => ({
  number,
  size: 'M',
  isGoalkeeper: false,
  status: 'available',
});

describe('selectSortedShirts', () => {
  it('sorts shirts by number without mutating the source array', () => {
    const source = [shirt(3), shirt(1), shirt(2)];

    expect(selectSortedShirts(source).map((item) => item.number)).toEqual([1, 2, 3]);
    expect(source.map((item) => item.number)).toEqual([3, 1, 2]);
  });

  it('keeps duplicate numbers available for validation and editing', () => {
    const source = [shirt(7), shirt(7)];

    expect(selectSortedShirts(source)).toHaveLength(2);
  });

  it('falls back to an empty list when shirts are missing', () => {
    expect(selectSortedShirts(undefined)).toEqual([]);
    expect(selectSortedShirts(null)).toEqual([]);
  });
});
