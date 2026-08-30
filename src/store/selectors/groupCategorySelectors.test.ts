import { describe, expect, it } from 'vitest';
import type { PlayingMode } from '../../types';
import {
  GROUP_CATEGORIES,
  selectMatchingPlayingMode,
  selectOfficialPlayingModeForCategory,
} from './groupCategorySelectors';

describe('selectOfficialPlayingModeForCategory', () => {
  it.each(['D7', 'D9'] as const)('maps %s to the official 4x20 mode', (category) => {
    expect(selectOfficialPlayingModeForCategory(category)).toEqual({
      name: '4x20', numberOfPeriods: 4, periodLengthMinutes: 20,
    });
  });

  it.each(['C', 'B', 'A'] as const)('maps %s to the official 2x45 mode', (category) => {
    expect(selectOfficialPlayingModeForCategory(category)).toEqual({
      name: '2x45', numberOfPeriods: 2, periodLengthMinutes: 45,
    });
  });

  it('returns no automatic mode for categories without one unambiguous official match format', () => {
    expect(selectOfficialPlayingModeForCategory('FF14')).toBeNull();
    expect(selectOfficialPlayingModeForCategory('E')).toBeNull();
    expect(selectOfficialPlayingModeForCategory(null)).toBeNull();
  });

  it('contains every category supported by the API', () => {
    expect(GROUP_CATEGORIES).toEqual(['G', 'F', 'E', 'D7', 'D9', 'C', 'B', 'A', 'FF9', 'FF11', 'FF14', 'FF17']);
  });
});

describe('selectMatchingPlayingMode', () => {
  it('matches by period structure even when a user chose a different name', () => {
    const modes: PlayingMode[] = [
      { id: 'mode-1', name: 'Four quarters', numberOfPeriods: 4, periodLengthMinutes: 20 },
    ];

    expect(selectMatchingPlayingMode(modes, {
      name: '4x20', numberOfPeriods: 4, periodLengthMinutes: 20,
    })?.id).toBe('mode-1');
  });

  it('returns undefined when no mode has the official structure', () => {
    expect(selectMatchingPlayingMode([], {
      name: '2x45', numberOfPeriods: 2, periodLengthMinutes: 45,
    })).toBeUndefined();
  });
});
