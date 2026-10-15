import { describe, expect, it } from 'vitest';
import type { Squad } from '../../types';
import { selectActiveSquads } from './squadSelectors';

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
});
