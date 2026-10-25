import { describe, expect, it } from 'vitest';
import { validateActivitySchedule } from './activityFormValidation';

const valid = {
  minPlayersPerTeam: 6,
  maxPlayersPerTeam: 9,
  minimumAllowedPlayers: 1,
  date: '2026-10-25',
  startTime: '10:00',
  endDate: '',
  endTime: '',
};

describe('validateActivitySchedule', () => {
  it('accepts a valid schedule without an end time', () => {
    expect(validateActivitySchedule(valid)).toBeNull();
  });
  it('rejects inconsistent player limits', () => {
    expect(validateActivitySchedule({ ...valid, minPlayersPerTeam: 10 })).toBe('minMax');
    expect(validateActivitySchedule({ ...valid, minimumAllowedPlayers: 10 })).toBe('minMax');
  });
  it('requires an end date and time together', () => {
    expect(validateActivitySchedule({ ...valid, endDate: '2026-10-25' })).toBe('endDateTimeTogether');
    expect(validateActivitySchedule({ ...valid, endTime: '11:00' })).toBe('endDateTimeTogether');
  });
  it('requires the end to follow the start', () => {
    expect(validateActivitySchedule({ ...valid, endDate: valid.date, endTime: '10:00' })).toBe('endAfterStart');
    expect(validateActivitySchedule({ ...valid, endDate: valid.date, endTime: '11:00' })).toBeNull();
  });
});
