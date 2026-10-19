import { describe, expect, it } from 'vitest';
import type { Squad } from '../../types';
import { selectActiveSquads, selectInitializationErrors, selectNewestSquad } from './squadSelectors';

const squad = (id: string, active?: boolean): Squad => ({ id, name: id, periods: [], active });

describe('selectActiveSquads', () => {
  it('keeps active squads and treats missing active as legacy active', () => {
    expect(selectActiveSquads([squad('legacy'), squad('active', true)]).map((item) => item.id))
      .toEqual(['legacy', 'active']);
  });

  it('omits explicitly inactive squads', () => {
    expect(selectActiveSquads([squad('active'), squad('inactive', false)]).map((item) => item.id))
      .toEqual(['active']);
  });

  it('returns an empty list when all squads are inactive', () => {
    expect(selectActiveSquads([squad('one', false), squad('two', false)])).toEqual([]);
  });

  it('selects the newest squad from valid creation or update timestamps', () => {
    const older = { ...squad('older'), createdAt: '2026-01-01T10:00:00.000Z' };
    const newer = { ...squad('newer'), updatedAt: '2026-03-01T10:00:00.000Z' };
    expect(selectNewestSquad([newer, older])).toBe(newer);
  });

  it('falls back to the final squad when timestamps are missing or invalid', () => {
    const first = squad('first');
    const final = { ...squad('final'), createdAt: 'invalid' };
    expect(selectNewestSquad([first, final])).toBe(final);
    expect(selectNewestSquad([])).toBeNull();
  });

  it('selects only populated initialization errors in domain order', () => {
    expect(selectInitializationErrors({
      players: 'Player error',
      activities: null,
      trainers: 'Trainer error',
      shirtSets: null,
    })).toEqual([
      { domain: 'players', message: 'Player error' },
      { domain: 'trainers', message: 'Trainer error' },
    ]);
    expect(selectInitializationErrors({ players: null, activities: null, trainers: null, shirtSets: null })).toEqual([]);
  });
});
