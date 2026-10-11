import { describe, expect, it } from 'vitest';
import type { Activity, Player } from '../../types';
import type { SpondEventSnapshot, SpondMemberSnapshot } from '../../types/spond';
import {
  selectSpondDecisionSummary,
  selectSpondActionableEventRows,
  selectSpondActivityDraftsWithSelection,
  selectSpondDateRangeError,
  selectSpondEventRows,
  selectFilteredSpondEventRows,
  selectSpondGuardianRows,
  selectInitialSpondActivityDrafts,
  selectInitialSpondMemberDrafts,
  selectSpondImportPreview,
  selectSpondMemberRows,
  selectSpondMemberDraftsWithSelection,
  selectNextSpondReviewStep,
  selectSpondSyncRange,
  selectSpondWizardProgressSteps,
} from './spondSyncSelectors';

const player = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1', firstName: 'Ada', lastName: 'Lovelace', birthDate: '2014-01-02', level: 3, status: 'active', ...overrides,
});
const member = (overrides: Partial<SpondMemberSnapshot> = {}): SpondMemberSnapshot => ({
  id: 'sm1', firstName: 'Ada', lastName: 'Lovelace', birthDate: '2014-01-02', guardians: [], ...overrides,
});
const activity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 'a1', squadId: 's1', kind: 'social', name: 'Training', startsAt: '2026-10-10T10:00:00.000Z', teams: [], invitations: [], ...overrides,
});
const event = (overrides: Partial<SpondEventSnapshot> = {}): SpondEventSnapshot => ({
  id: 'se1', groupId: 'sg1', name: 'Training', startsAt: '2026-10-10T10:00:00.000Z', responses: [], ...overrides,
});

describe('Spond member selectors', () => {
  it('prefers an existing Spond link over suggestions', () => {
    const rows = selectSpondMemberRows([member()], [player({ spondId: 'sm1' })]);
    expect(rows[0].linkedPlayer?.id).toBe('p1');
    expect(rows[0].suggestedPlayers).toEqual([]);
  });

  it('suggests only compatible names and birth dates', () => {
    const rows = selectSpondMemberRows([member()], [
      player(),
      player({ id: 'wrong-date', birthDate: '2015-01-02' }),
      player({ id: 'wrong-name', firstName: 'Grace' }),
    ]);
    expect(rows[0].suggestedPlayers.map((entry) => entry.id)).toEqual(['p1']);
  });

  it('falls back to name matching when the source birth date is absent', () => {
    expect(selectSpondMemberRows([member({ birthDate: undefined })], [player()])[0].suggestedPlayers).toHaveLength(1);
  });

  it('excludes members with trainer or custom administrator roles while retaining players and role-less snapshots', () => {
    const rows = selectSpondMemberRows([
      member({ id: 'trainer', roles: ['trainer'] }),
      member({ id: 'coach', roles: ['spond-coach-role-id'] }),
      member({ id: 'player-trainer', roles: ['player', 'trainer'] }),
      member({ id: 'legacy', roles: undefined }),
    ], []);

    expect(rows.map((row) => row.source.id)).toEqual(['player-trainer', 'legacy']);
  });
});

describe('Spond wizard progress', () => {
  it('includes group selection for linking but omits it for scoped synchronization', () => {
    expect(selectSpondWizardProgressSteps(['players', 'guardians'], true)).toEqual([
      'credentials', 'group', 'types', 'players', 'guardians', 'summary',
    ]);
    expect(selectSpondWizardProgressSteps(['events'], false)).toEqual([
      'credentials', 'types', 'events', 'summary',
    ]);
  });

  it('supports a flow without review steps', () => {
    expect(selectSpondWizardProgressSteps([], false)).toEqual(['credentials', 'types', 'summary']);
  });
});

describe('Spond event selectors', () => {
  it('resolves links and otherwise suggests activities on the same day', () => {
    expect(selectSpondEventRows([event()], [activity({ spondId: 'se1' })])[0].linkedActivity?.id).toBe('a1');
    expect(selectSpondEventRows([event()], [activity()])[0].suggestedActivities).toHaveLength(1);
    expect(selectSpondEventRows([event()], [activity({ startsAt: '2026-10-10T18:00:00.000Z' })])[0].suggestedActivities).toHaveLength(1);
    expect(selectSpondEventRows([event()], [activity({ startsAt: '2026-10-11T10:00:00.000Z' })])[0].suggestedActivities).toEqual([]);
  });

  it('defaults a unique same-day match to link and a missing event to create', () => {
    const linked = selectInitialSpondActivityDrafts(selectSpondEventRows([event()], [activity()]));
    const missing = selectInitialSpondActivityDrafts(selectSpondEventRows([event()], []));
    expect(linked.se1).toMatchObject({ action: 'link', activityId: 'a1' });
    expect(missing.se1).toMatchObject({ action: 'create', activityId: '' });
  });

  it('infers training from any occurrence in the event name and match otherwise', () => {
    const drafts = selectInitialSpondActivityDrafts(selectSpondEventRows([
      event({ id: 'training', name: 'Goalkeeper TRAININGsession' }),
      event({ id: 'match', name: 'Cup fixture' }),
    ], []));

    expect(drafts.training.kind).toBe('training');
    expect(drafts.match.kind).toBe('match');
  });

  it('hides a linked event when its synchronized fields and responses are unchanged', () => {
    const linkedActivity = activity({
      spondId: 'se1',
      invitations: [{ id: 'i1', playerId: 'p1', response: 'accepted' }],
    });
    const rows = selectSpondEventRows(
      [event({ responses: [{ spondMemberId: 'sm1', response: 'accepted' }] })],
      [linkedActivity],
      [player({ spondId: 'sm1' })],
    );

    expect(rows[0].needsSync).toBe(false);
    expect(selectSpondActionableEventRows(rows)).toEqual([]);
  });

  it('keeps linked events with field or response changes and all unlinked events actionable', () => {
    const linkedActivity = activity({ spondId: 'se1', location: 'Old pitch' });
    const changed = selectSpondEventRows([event({ location: 'New pitch' })], [linkedActivity]);
    const unlinked = selectSpondEventRows([event()], []);

    expect(selectSpondActionableEventRows(changed)).toHaveLength(1);
    expect(selectSpondActionableEventRows(unlinked)).toHaveLength(1);
  });

  it('filters training rows and supports selecting or clearing all visible rows', () => {
    const rows = selectSpondEventRows([
      event({ id: 'training', name: 'Tuesday Training' }),
      event({ id: 'match', name: 'Cup MATCHday' }),
      event({ id: 'social', name: 'Team dinner' }),
    ], []);
    const drafts = selectInitialSpondActivityDrafts(rows);
    const trainingRows = selectFilteredSpondEventRows(rows, drafts, 'training');
    const matchRows = selectFilteredSpondEventRows(rows, drafts, 'match');

    expect(trainingRows.map((row) => row.source.id)).toEqual(['training']);
    expect(matchRows.map((row) => row.source.id)).toEqual(['match']);
    expect(drafts.training.kind).toBe('training');
    expect(selectSpondActivityDraftsWithSelection(drafts, trainingRows, false).training.action).toBe('skip');
    expect(selectSpondActivityDraftsWithSelection(
      selectSpondActivityDraftsWithSelection(drafts, trainingRows, false),
      trainingRows,
      true,
    ).training.action).toBe('create');
    expect(selectFilteredSpondEventRows(rows, drafts, 'all')).toBe(rows);
  });
});

describe('Spond import defaults', () => {
  it('links a player by name and selects a missing player for creation', () => {
    const linked = selectInitialSpondMemberDrafts(selectSpondMemberRows([member()], [player()]));
    const missing = selectInitialSpondMemberDrafts(selectSpondMemberRows([member()], []));
    expect(linked.sm1).toMatchObject({ action: 'link', memberId: 'p1' });
    expect(missing.sm1).toMatchObject({ action: 'create-player', birthDate: '2014-01-02' });
  });

  it('selects or clears all player decisions while preserving link and create defaults', () => {
    const rows = selectSpondMemberRows([
      member({ id: 'linked' }),
      member({ id: 'missing', firstName: 'Grace' }),
    ], [player()]);
    const drafts = selectInitialSpondMemberDrafts(rows);
    const cleared = selectSpondMemberDraftsWithSelection(drafts, rows, false);
    const selected = selectSpondMemberDraftsWithSelection(cleared, rows, true);

    expect(cleared.linked.action).toBe('skip');
    expect(cleared.missing.action).toBe('skip');
    expect(selected.linked).toMatchObject({ action: 'link', memberId: 'p1' });
    expect(selected.missing).toMatchObject({ action: 'create-player', memberId: '' });
  });

  it('creates a complete fallback draft when bulk-selecting a row without one', () => {
    const rows = selectSpondMemberRows([member()], []);
    expect(selectSpondMemberDraftsWithSelection({}, rows, true).sm1).toMatchObject({
      action: 'create-player',
      birthDate: '2014-01-02',
      level: 1,
    });
  });

  it('matches guardians by name, deduplicates them, and retains their player relationships', () => {
    const guardian = { id: 'sg1', firstName: 'Grace', lastName: 'Lovelace' };
    const rows = selectSpondGuardianRows([
      member({ id: 'sm1', guardians: [guardian] }),
      member({ id: 'sm2', firstName: 'Katherine', lastName: 'Johnson', guardians: [guardian] }),
    ], [player({ guardians: [{ id: 'g1', firstName: 'Grace', lastName: 'Lovelace' }] })]);
    expect(rows).toHaveLength(1);
    expect(rows[0].linkedGuardian?.id).toBe('g1');
    expect(rows[0].spondMemberIds).toEqual(['sm1', 'sm2']);
    expect(rows[0].childNames).toEqual(['Ada Lovelace', 'Katherine Johnson']);
    expect(selectSpondGuardianRows([], [])).toEqual([]);
  });

  it('previews concrete actions and excludes guardians absent from final player decisions', () => {
    const sourceMember = member({ guardians: [{ id: 'sg1', firstName: 'Grace', lastName: 'Lovelace' }] });
    const memberRows = selectSpondMemberRows([sourceMember], []);
    const guardianRows = selectSpondGuardianRows([sourceMember], []);
    const eventRows = selectSpondEventRows([event()], [activity()]);

    expect(selectSpondImportPreview(memberRows, guardianRows, eventRows, [{
      action: 'create-player', spondMemberId: 'sm1', birthDate: '2014-01-02', level: 1, status: 'active', guardianIds: [],
    }], [{ action: 'link', spondEventId: 'se1', activityId: 'a1' }])).toEqual([
      { id: 'player:sm1', kind: 'player', action: 'create', sourceName: 'Ada Lovelace' },
      { id: 'event:se1', kind: 'event', action: 'link', sourceName: 'Training', targetName: 'Training' },
    ]);
  });

  it('includes only guardians present in a create-player decision', () => {
    const sourceMember = member({ guardians: [{ id: 'sg1', firstName: 'Grace', lastName: 'Lovelace' }] });
    const preview = selectSpondImportPreview(
      selectSpondMemberRows([sourceMember], []), selectSpondGuardianRows([sourceMember], []), [],
      [{ action: 'create-player', spondMemberId: 'sm1', birthDate: '2014-01-02', level: 1, status: 'active', guardianIds: ['sg1'] }], [],
    );
    expect(preview[1]).toMatchObject({ kind: 'guardian', action: 'create', sourceName: 'Grace Lovelace', targetName: 'Ada Lovelace' });
  });

  it('omits unchanged linked players and previews changed source fields as updates', () => {
    const linkedPlayer = player({ spondId: 'sm1' });
    const unchangedRows = selectSpondMemberRows([member()], [linkedPlayer]);
    expect(selectSpondImportPreview(unchangedRows, [], [], [
      { action: 'link', spondMemberId: 'sm1', memberId: 'p1' },
    ], [])).toEqual([]);

    const changedRows = selectSpondMemberRows([member({ birthDate: '2015-03-04' })], [linkedPlayer]);
    expect(selectSpondImportPreview(changedRows, [], [], [
      { action: 'link', spondMemberId: 'sm1', memberId: 'p1' },
    ], [])).toEqual([expect.objectContaining({
      kind: 'player', action: 'update', changes: ['birthDate'],
    })]);
  });

  it('treats apostrophe variants and encoded apostrophes as the same name', () => {
    const linkedPlayer = player({ firstName: 'Eliah', lastName: "D'Amico", spondId: 'sm1' });

    for (const lastName of ['D’Amico', 'DʼAmico', 'D&apos;Amico', 'D&#39;Amico']) {
      const rows = selectSpondMemberRows([member({ firstName: 'Eliah', lastName })], [linkedPlayer]);
      expect(selectSpondImportPreview(rows, [], [], [
        { action: 'link', spondMemberId: 'sm1', memberId: 'p1' },
      ], [])).toEqual([]);
    }
  });
});

describe('Spond decision summary', () => {
  it('requires decisions for every unlinked row and validates create fallbacks', () => {
    const memberRows = selectSpondMemberRows([member()], []);
    const eventRows = selectSpondEventRows([event()], []);
    const missing = selectSpondDecisionSummary(memberRows, eventRows, [], []);
    expect(missing.isReady).toBe(false);
    expect(missing.memberIssues.sm1).toEqual(['selection']);
    expect(missing.activityIssues.se1).toEqual(['selection']);
    expect(selectSpondDecisionSummary(memberRows, eventRows, [
      { action: 'create-player', spondMemberId: 'sm1', birthDate: '2014-01-02', level: 3, status: 'active', guardianIds: [] },
    ], [
      { action: 'create', spondEventId: 'se1', kind: 'social' },
    ])).toMatchObject({ createdMembers: 1, createdActivities: 1, isReady: true });
  });

  it('rejects a training without trainers and accepts explicit skips', () => {
    const memberRows = selectSpondMemberRows([member()], []);
    const eventRows = selectSpondEventRows([event()], []);
    expect(selectSpondDecisionSummary(memberRows, eventRows,
      [{ action: 'skip', spondMemberId: 'sm1' }],
      [{ action: 'create', spondEventId: 'se1', kind: 'training' }],
    ).isReady).toBe(false);
    expect(selectSpondDecisionSummary(memberRows, eventRows,
      [{ action: 'skip', spondMemberId: 'sm1' }],
      [{ action: 'skip', spondEventId: 'se1' }],
    ).isReady).toBe(true);
  });

  it('reports every missing mandatory link and creation field', () => {
    const memberRows = selectSpondMemberRows([member()], []);
    const eventRows = selectSpondEventRows([event()], []);
    const missingLinks = selectSpondDecisionSummary(memberRows, eventRows, [
      { action: 'link', spondMemberId: 'sm1', memberId: '' },
    ], [
      { action: 'link', spondEventId: 'se1', activityId: '' },
    ]);
    expect(missingLinks.memberIssues.sm1).toEqual(['member']);
    expect(missingLinks.activityIssues.se1).toEqual(['activity']);

    const invalidCreates = selectSpondDecisionSummary(memberRows, eventRows, [
      { action: 'create-player', spondMemberId: 'sm1', birthDate: '', level: 0, status: 'active', guardianIds: [] },
    ], [
      { action: 'create', spondEventId: 'se1', kind: 'match' },
    ]);
    expect(invalidCreates.memberIssues.sm1).toEqual(['birthDate', 'level']);
    expect(invalidCreates.activityIssues.se1).toEqual(['team']);
    expect(invalidCreates.isReady).toBe(false);
  });
});

describe('Spond date range selector', () => {
  it('accepts a valid range and covers missing, reversed, and oversized ranges', () => {
    expect(selectSpondDateRangeError('2026-01-01', '2026-12-31')).toBeNull();
    expect(selectSpondDateRangeError('', '2026-12-31')).toBe('missing');
    expect(selectSpondDateRangeError('2026-02-01', '2026-01-01')).toBe('order');
    expect(selectSpondDateRangeError('2026-01-01', '2027-01-02')).toBe('too-long');
  });

  it('uses a selected period as the sync range', () => {
    expect(selectSpondSyncRange([
      { id: 'spring', name: 'Spring', startDate: '2026-01-15', endDate: '2026-06-30' },
    ], 'spring', { from: '2026-01-01', to: '2026-12-31' })).toEqual({
      from: '2026-01-15',
      to: '2026-06-30',
    });
  });

  it('keeps the fallback range when no period is selected or found', () => {
    const fallback = { from: '2026-01-01', to: '2026-12-31' };
    expect(selectSpondSyncRange([], '', fallback)).toBe(fallback);
    expect(selectSpondSyncRange([
      { id: 'spring', name: 'Spring', startDate: '2026-01-15', endDate: '2026-06-30' },
    ], 'missing', fallback)).toBe(fallback);
  });
});

describe('Spond wizard navigation', () => {
  it('continues from an events-only review to the summary', () => {
    expect(selectNextSpondReviewStep(['events'], 'events')).toBe('summary');
  });

  it('continues through each selected review step in order', () => {
    expect(selectNextSpondReviewStep(['players', 'guardians', 'events'], 'players')).toBe('guardians');
    expect(selectNextSpondReviewStep(['players', 'guardians', 'events'], 'guardians')).toBe('events');
  });
});
