import { describe, expect, it } from 'vitest';
import type { SfvCategoryCatalog } from '../../types';
import {
  selectDefaultActivityLimits,
  selectDefaultActivityLimitsForCategory,
  selectIsOfficialMatchFormat,
  selectIsTournamentOnlyCategory,
  selectOfficialMatchFormatForCategory,
  selectSfvCategoryOption,
  selectSfvCategoryOptions,
} from './sfvCatalogSelectors';

const catalog: SfvCategoryCatalog = {
  version: '1',
  source: 'test',
  categories: {
    D7: {
      activityType: 'match',
      matchFormat: {
        name: '4x20',
        numberOfPeriods: 4,
        periodLengthMinutes: 20,
        minimumPeriodsPerPlayer: 0,
        playersOnField: 7,
        minPlayersPerTeam: 7,
        maxPlayersPerTeam: 12,
      },
    },
    F: { activityType: 'tournament' },
  },
};

describe('sfvCatalogSelectors', () => {
  it('lists all categories with catalog info', () => {
    const options = selectSfvCategoryOptions(catalog);
    expect(options.map((option) => option.code)).toContain('D7');
    expect(options.find((option) => option.code === 'D7')?.matchFormat?.playersOnField).toBe(7);
    expect(options.find((option) => option.code === 'F')?.activityType).toBe('tournament');
  });

  it('keeps categories missing from the catalog selectable without info', () => {
    const option = selectSfvCategoryOption(catalog, 'FF11');
    expect(option).toEqual({ code: 'FF11', activityType: null, matchFormat: null });
  });

  it('detects tournament-only categories', () => {
    expect(selectIsTournamentOnlyCategory(catalog, 'F')).toBe(true);
    expect(selectIsTournamentOnlyCategory(catalog, 'D7')).toBe(false);
    expect(selectIsTournamentOnlyCategory(catalog, null)).toBe(false);
  });

  it('returns null for unknown or empty category codes', () => {
    expect(selectSfvCategoryOption(catalog, null)).toBeNull();
    expect(selectSfvCategoryOption(catalog, 'ZZ' as never)).toBeNull();
    expect(selectOfficialMatchFormatForCategory(catalog, undefined)).toBeNull();
  });

  it('falls back to the built-in formats when the catalog is missing', () => {
    expect(selectOfficialMatchFormatForCategory(null, 'D9')).toMatchObject({ name: '4x20', numberOfPeriods: 4 });
    expect(selectOfficialMatchFormatForCategory(null, 'F')).toBeNull();
    expect(selectIsTournamentOnlyCategory(null, 'F')).toBe(false);
  });

  it('flags official formats by origin', () => {
    expect(selectIsOfficialMatchFormat({ origin: 'SFV' })).toBe(true);
    expect(selectIsOfficialMatchFormat({})).toBe(false);
  });

  describe('selectDefaultActivityLimits', () => {
    it('returns the format limits', () => {
      expect(selectDefaultActivityLimits({ minPlayersPerTeam: 7, maxPlayersPerTeam: 12 })).toEqual({
        minPlayersPerTeam: 7,
        maxPlayersPerTeam: 12,
      });
    });

    it('returns null for legacy formats or no format', () => {
      expect(selectDefaultActivityLimits({})).toBeNull();
      expect(selectDefaultActivityLimits(null)).toBeNull();
      expect(selectDefaultActivityLimits(undefined)).toBeNull();
    });

    it('mirrors a single provided limit and orders inverted limits', () => {
      expect(selectDefaultActivityLimits({ maxPlayersPerTeam: 10 })).toEqual({ minPlayersPerTeam: 10, maxPlayersPerTeam: 10 });
      expect(selectDefaultActivityLimits({ minPlayersPerTeam: 12, maxPlayersPerTeam: 8 })).toEqual({
        minPlayersPerTeam: 8,
        maxPlayersPerTeam: 12,
      });
    });
  });

  it('uses category-level limits when no match format is provided', () => {
    expect(selectDefaultActivityLimitsForCategory({
      version: '1', source: 'test', categories: {
        E: { activityType: 'match', minPlayersPerTeam: 5, maxPlayersPerTeam: 8 },
      },
    }, 'E')).toEqual({ minPlayersPerTeam: 5, maxPlayersPerTeam: 8 });
  });
});
