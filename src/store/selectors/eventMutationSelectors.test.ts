import { describe, expect, it } from 'vitest';
import type { Event } from '../../types';
import { selectEventMutationResult } from './eventMutationSelectors';

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-1',
    name: 'Match',
    date: '2026-09-01',
    maxPlayersPerTeam: 9,
    minPlayersPerTeam: 6,
    teams: [],
    invitations: [],
    ...overrides,
  };
}

describe('selectEventMutationResult', () => {
  it('preserves a submitted playing mode when a create response omits it', () => {
    const result = selectEventMutationResult(event(), { playingModeId: 'mode-1' });

    expect(result.playingModeId).toBe('mode-1');
  });

  it('preserves a submitted playing mode when an update response omits it', () => {
    const current = event({ name: 'Old name', playingModeId: null });
    const response = event({ name: 'New name' });
    const result = selectEventMutationResult(response, { name: 'New name', playingModeId: 'mode-2' }, current);

    expect(result).toMatchObject({ name: 'New name', playingModeId: 'mode-2' });
  });

  it('preserves an explicit null submitted to clear the playing mode', () => {
    const result = selectEventMutationResult(event(), { playingModeId: null }, event({ playingModeId: 'mode-1' }));

    expect(result.playingModeId).toBeNull();
  });

  it('uses the authoritative response value when the API includes the field', () => {
    const result = selectEventMutationResult(
      event({ playingModeId: 'server-mode' }),
      { playingModeId: 'submitted-mode' },
      event({ playingModeId: null })
    );

    expect(result.playingModeId).toBe('server-mode');
  });

  it('keeps the current value when an unrelated update omits the field', () => {
    const result = selectEventMutationResult(
      event({ name: 'New name' }),
      { name: 'New name' },
      event({ name: 'Old name', playingModeId: 'mode-1' })
    );

    expect(result.playingModeId).toBe('mode-1');
  });
});
