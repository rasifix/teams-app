import { describe, expect, it } from 'vitest';
import { selectActivityPhase, selectActivityPhaseSections } from './activityLifecycleSelectors';

const startsAt = '2026-10-10T14:00:00.000Z';
const start = new Date(startsAt);
const before = new Date(start.getTime() - 60_000);
const atStart = start;

describe('activity lifecycle selectors', () => {
  it('is planning before the selection is sent', () => {
    expect(selectActivityPhase({ startsAt }, before)).toBe('planning');
  });

  it('is selectionSent once the selection was sent and before the start', () => {
    expect(selectActivityPhase({ startsAt, selectionSentAt: '2026-10-08T10:00:00Z' }, before)).toBe('selectionSent');
  });

  it('is started from the start time on, even without a sent selection', () => {
    expect(selectActivityPhase({ startsAt }, atStart)).toBe('started');
    expect(selectActivityPhase({ startsAt, selectionSentAt: '2026-10-08T10:00:00Z', attendance: [] }, atStart)).toBe('started');
  });

  it('is recorded as soon as attendance exists, regardless of time', () => {
    const attendance = [{ personId: 'p-1', status: 'present' as const }];
    expect(selectActivityPhase({ startsAt, attendance }, before)).toBe('recorded');
    expect(selectActivityPhase({ startsAt, attendance }, atStart)).toBe('recorded');
  });

  it('maps phases to relevant sections', () => {
    expect(selectActivityPhaseSections('planning')).toEqual({ invitations: true, attendance: false });
    expect(selectActivityPhaseSections('selectionSent')).toEqual({ invitations: true, attendance: false });
    expect(selectActivityPhaseSections('started')).toEqual({ invitations: true, attendance: true });
    expect(selectActivityPhaseSections('recorded')).toEqual({ invitations: true, attendance: true });
  });
});
