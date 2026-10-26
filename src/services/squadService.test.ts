import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import {
  addSquadMatchFormat,
  createBirthdayCalendarSubscription,
  deactivateSquad,
  getBirthdayCalendarSubscription,
  linkSquadToSpond,
  revokeBirthdayCalendarSubscription,
  unlinkSquadFromSpond,
  updateSquadCategory,
} from './squadService';

describe('squadService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes the current squad name when updating the category', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
      id: 'squad-1',
      name: 'Juniors',
      category: 'D7',
      periods: [],
    });

    await updateSquadCategory('squad-1', 'Juniors', 'D7');

    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Juniors', category: 'D7' }),
    });
  });

  it('includes the current squad name when clearing the category', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
      id: 'squad-1',
      name: 'Juniors',
      category: null,
      periods: [],
    });

    await updateSquadCategory('squad-1', 'Juniors', null);

    const [, options] = requestSpy.mock.calls[0] as [string, { body?: string }?];
    expect(JSON.parse(options?.body ?? '{}')).toEqual({ name: 'Juniors', category: null });
  });

  it('deactivates a squad without deleting it', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
      id: 'squad-1',
      name: 'Juniors',
      active: false,
      periods: [],
    });

    await deactivateSquad('squad-1');

    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1', {
      method: 'PUT',
      body: JSON.stringify({ active: false }),
    });
  });

  it('unlinks Spond while preserving the required squad name', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
      id: 'squad-1',
      name: 'Juniors',
      spondId: null,
      periods: [],
    });

    await unlinkSquadFromSpond('squad-1', 'Juniors');

    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Juniors', spondId: null }),
    });
  });

  it('rejects an unlink response that still contains the Spond link', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      id: 'squad-1', name: 'Juniors', spondId: 'group-1', periods: [],
    });

    await expect(unlinkSquadFromSpond('squad-1', 'Juniors')).rejects.toThrow('Spond link was not cleared');
  });

  it('links Spond without importing any records', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
      id: 'squad-1',
      name: 'Juniors',
      spondId: 'group-1',
      periods: [],
    });

    await linkSquadToSpond('squad-1', 'Juniors', 'group-1');

    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Juniors', spondId: 'group-1' }),
    });
  });

  it('persists the minimum periods per player with a playing mode', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
      id: 'mode-1',
      name: '4x20',
      numberOfPeriods: 4,
      periodLengthMinutes: 20,
      minimumPeriodsPerPlayer: 2,
    });

    await addSquadMatchFormat('squad-1', {
      name: '4x20',
      numberOfPeriods: 4,
      periodLengthMinutes: 20,
      minimumPeriodsPerPlayer: 2,
    });

    const [, options] = requestSpy.mock.calls[0] as [string, { body?: string }?];
    expect(JSON.parse(options?.body ?? '{}')).toMatchObject({ minimumPeriodsPerPlayer: 2 });
  });

  it('loads, creates, and revokes a birthday calendar subscription', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({ subscriptionUrl: null });

    await getBirthdayCalendarSubscription('squad-1');
    await createBirthdayCalendarSubscription('squad-1');
    await revokeBirthdayCalendarSubscription('squad-1');

    expect(requestSpy).toHaveBeenNthCalledWith(1, '/api/squads/squad-1/birthday-calendar');
    expect(requestSpy).toHaveBeenNthCalledWith(2, '/api/squads/squad-1/birthday-calendar', { method: 'POST' });
    expect(requestSpy).toHaveBeenNthCalledWith(3, '/api/squads/squad-1/birthday-calendar', { method: 'DELETE' });
  });
});
