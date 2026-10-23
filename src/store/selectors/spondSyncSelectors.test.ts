import { describe, expect, it } from 'vitest';
import type { Activity, Player } from '../../types';
import type { SpondEventSnapshot, SpondMemberSnapshot, SpondGroupSnapshot } from '../../types/spond';
import {
  selectSpondDecisionSummary,
  selectSpondActionableEventRows,
  selectSpondActivityDraftsWithSelection,
  selectSpondDateRangeError,
  selectSpondEventRows,
  selectFilteredSpondEventRows,
  selectSpondGuardianRows,
  selectSpondActionableGuardianRows,
  selectSpondActionableMemberRows,
  selectInitialSpondActivityDrafts,
  selectInitialSpondGuardianSelection,
  selectInitialSpondMemberDrafts,
  selectSpondActivityDecisions,
  selectSpondImportPreview,
  selectSpondActivityChanges,
  selectSpondMemberRows,
  selectSpondMemberDecisions,
  selectSpondMemberDraftsWithSelection,
  selectNextSpondReviewStep,
  selectSpondSyncRange,
  selectCurrentSpondPeriodId,
  selectSpondWizardProgressSteps,
  selectSpondLinkedGroup,
  selectSpondReviewSteps,
} from './spondSyncSelectors';

const player = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1', firstName: 'Ada', lastName: 'Lovelace', birthDate: '2014-01-02', level: 3, status: 'active', ...overrides,
});
const member = (overrides: Partial<SpondMemberSnapshot> = {}): SpondMemberSnapshot => ({
  id: 'sm1', firstName: 'Ada', lastName: 'Lovelace', birthDate: '2014-01-02', guardians: [], ...overrides,
});
const activity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 'a1', squadId: 's1', kind: 'match', status: 'active', name: 'Activity', startsAt: '2026-10-10T10:00:00.000Z', teams: [], invitations: [], ...overrides,
});
const event = (overrides: Partial<SpondEventSnapshot> = {}): SpondEventSnapshot => ({
  id: 'se1', groupId: 'sg1', name: 'Activity', type: 'event', status: 'active', startsAt: '2026-10-10T10:00:00.000Z', responses: [], ...overrides,
});

describe('Spond linked group selector', () => {
  const groups: SpondGroupSnapshot[] = [{
    id: 'parent', name: 'U12', members: [], subGroups: [{ id: 'sub-1', name: 'Team orange' }],
  }];

  it('resolves a linked subgroup to its parent and subgroup ID', () => {
    expect(selectSpondLinkedGroup(groups, 'sub-1')).toEqual({ groupId: 'parent', subGroupId: 'sub-1' });
  });

  it('keeps a top-level linked group at group scope', () => {
    expect(selectSpondLinkedGroup(groups, 'parent')).toEqual({ groupId: 'parent' });
  });

  it('returns null when the linked ID is inaccessible', () => {
    expect(selectSpondLinkedGroup(groups, 'missing')).toBeNull();
  });
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

  it('hides unchanged linked members while retaining new and changed members', () => {
    const linked = selectSpondMemberRows([member()], [player({ spondId: 'sm1' })]);
    const changed = selectSpondMemberRows([member({ id: 'changed', birthDate: '2015-01-02' })], [player({ spondId: 'changed' })]);
    const missing = selectSpondMemberRows([member({ id: 'new' })], []);
    expect(selectSpondActionableMemberRows([...linked, ...changed, ...missing]).map((row) => row.source.id)).toEqual(['changed', 'new']);
  });

  it('retains an unchanged linked member when a source guardian is not linked to that player', () => {
    const linked = selectSpondMemberRows([
      member({ guardians: [{ id: 'sg1', firstName: 'Grace', lastName: 'Lovelace' }] }),
    ], [player({ spondId: 'sm1', guardians: [] })]);

    expect(selectSpondActionableMemberRows(linked).map((row) => row.source.id)).toEqual(['sm1']);
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
  it('keeps guardians only when player import is selected', () => {
    expect(selectSpondReviewSteps(['players', 'guardians', 'events'])).toEqual(['players', 'guardians', 'events']);
    expect(selectSpondReviewSteps(['guardians', 'events'])).toEqual(['events']);
    expect(selectSpondReviewSteps([])).toEqual([]);
  });

  it('uses a separate link flow and a three-step scoped sync flow', () => {
    expect(selectSpondWizardProgressSteps('link')).toEqual(['credentials', 'group', 'linked']);
    expect(selectSpondWizardProgressSteps('players')).toEqual(['credentials', 'diff', 'results']);
    expect(selectSpondWizardProgressSteps('events')).toEqual(['credentials', 'diff', 'results']);
  });
});

describe('Spond event selectors', () => {
  it('resolves links and otherwise suggests activities on the same day', () => {
    expect(selectSpondEventRows([event()], [activity({ spondId: 'se1' })])[0].linkedActivity?.id).toBe('a1');
    expect(selectSpondEventRows([event({ id: ' se1 ' })], [activity({ spondId: 'se1' })])[0].linkedActivity?.id).toBe('a1');
    expect(selectSpondEventRows([event()], [activity()])[0].linkedActivity?.id).toBe('a1');
    expect(selectSpondEventRows([event()], [activity({ startsAt: '2026-10-10T18:00:00.000Z' })])[0].suggestedActivities).toHaveLength(1);
    expect(selectSpondEventRows([event()], [activity({ startsAt: '2026-10-11T10:00:00.000Z' })])[0].suggestedActivities).toEqual([]);
  });

  it('recognizes a unique exact activity as a prior link when its external ID is missing', () => {
    const rows = selectSpondEventRows([event({ type: 'match' })], [activity({ kind: 'match' })]);
    expect(rows[0].linkedActivity?.id).toBe('a1');
    expect(rows[0].needsSync).toBe(false);
    expect(selectSpondActionableEventRows(rows)).toEqual([]);
  });

  it('does not infer a prior link when exact fallback matching is ambiguous', () => {
    const rows = selectSpondEventRows([event({ type: 'match' })], [
      activity({ id: 'a1', kind: 'match' }),
      activity({ id: 'a2', kind: 'match' }),
    ]);
    expect(rows[0].linkedActivity).toBeUndefined();
    expect(rows[0].suggestedActivities).toHaveLength(2);
  });

  it('defaults a unique same-day match to link and a missing event to create', () => {
    const linked = selectInitialSpondActivityDrafts(selectSpondEventRows([event()], [activity()]));
    const missing = selectInitialSpondActivityDrafts(selectSpondEventRows([event()], []));
    expect(linked.se1).toMatchObject({ action: 'link', activityId: 'a1' });
    expect(missing.se1).toMatchObject({ action: 'create', activityId: '' });
  });

  it('defaults new activities to match until the user assigns a kind', () => {
    const drafts = selectInitialSpondActivityDrafts(selectSpondEventRows([
      event({ id: 'tournament', name: 'Cup fixture', type: 'event' }),
    ], []));

    expect(drafts.tournament.kind).toBe('match');
  });

  it('filters training names case-insensitively before review', () => {
    const rows = selectSpondEventRows([
      event({ id: 'training-lower', name: 'Tuesday training' }),
      event({ id: 'training-upper', name: 'TRAINING camp' }),
      event({ id: 'match', name: 'Cup event' }),
    ], []);
    expect(rows.map((row) => row.source.id)).toEqual(['match']);
  });

  it('hides a linked event when its synchronized fields and responses are unchanged', () => {
    const linkedActivity = activity({
      spondId: 'se1', name: 'Activity',
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

  it('filters match rows and supports selecting or clearing all visible rows', () => {
    const rows = selectSpondEventRows([
      event({ id: 'tournament-1', type: 'event', name: 'Tuesday Activity' }),
      event({ id: 'match', type: 'match', name: 'Cup MATCHday' }),
      event({ id: 'tournament-2', type: 'event', name: 'Team tournament' }),
    ], []);
    const drafts = selectInitialSpondActivityDrafts(rows);
    drafts['tournament-1'].kind = 'tournament';
    drafts['tournament-2'].kind = 'tournament';
    const matchRows = selectFilteredSpondEventRows(rows, drafts, 'match');

    expect(matchRows.map((row) => row.source.id)).toEqual(['match']);
    expect(drafts['tournament-1'].kind).toBe('tournament');
    expect(selectSpondActivityDraftsWithSelection(drafts, matchRows, false).match.action).toBe('skip');
    expect(selectFilteredSpondEventRows(rows, drafts, 'all')).toBe(rows);
    expect(selectFilteredSpondEventRows(rows, drafts, 'tournament').map((row) => row.source.id)).toEqual(['tournament-1', 'tournament-2']);
  });

  it('marks a linked activity for deletion when Spond reports it deleted', () => {
    const rows = selectSpondEventRows([event({ status: 'deleted' })], [activity({ spondId: 'se1' })]);
    expect(selectSpondActivityDecisions(rows, selectInitialSpondActivityDrafts(rows), true)).toEqual([
      { action: 'delete', spondEventId: 'se1' },
    ]);
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

  it('hides guardians that are already linked', () => {
    const rows = selectSpondGuardianRows([member({ guardians: [{ id: 'sg1', firstName: 'Grace', lastName: 'Lovelace' }] })], [
      player({ guardians: [{ id: 'g1', spondId: 'sg1', firstName: 'Grace', lastName: 'Lovelace' }] }),
    ]);
    expect(selectSpondActionableGuardianRows(rows)).toEqual([]);
  });

  it('initially selects unlinked guardians and excludes linked guardians', () => {
    const source = { id: 'sg1', firstName: 'Grace', lastName: 'Lovelace' };
    const unlinked = selectSpondGuardianRows([member({ guardians: [source] })], []);
    const linked = selectSpondGuardianRows([member({ guardians: [source] })], [
      player({ guardians: [{ id: 'g1', spondId: 'sg1', firstName: 'Grace', lastName: 'Lovelace' }] }),
    ]);
    expect(selectInitialSpondGuardianSelection(unlinked)).toEqual({ sg1: true });
    expect(selectInitialSpondGuardianSelection(linked)).toEqual({ sg1: false });
    expect(selectInitialSpondGuardianSelection([])).toEqual({});
  });

  it('builds player link, creation, and fallback skip decisions', () => {
    const source = member({ guardians: [{ id: 'sg1', firstName: 'Grace', lastName: 'Lovelace' }] });
    const rows = selectSpondMemberRows([source], []);
    const createDrafts = selectInitialSpondMemberDrafts(rows);
    expect(selectSpondMemberDecisions(rows, createDrafts, true, true, { sg1: true })).toEqual([{
      action: 'create-player', spondMemberId: 'sm1', birthDate: '2014-01-02', level: 1, status: 'active', guardianIds: ['sg1'],
    }]);
    expect(selectSpondMemberDecisions(rows, createDrafts, true, false, { sg1: true })[0]).toMatchObject({ guardianIds: [] });
    expect(selectSpondMemberDecisions(rows, {}, true, true, {})).toEqual([{ action: 'skip', spondMemberId: 'sm1' }]);
    expect(selectSpondMemberDecisions(rows, createDrafts, false, true, {})).toEqual([{ action: 'skip', spondMemberId: 'sm1' }]);

    const linkDrafts = { sm1: { ...createDrafts.sm1, action: 'link' as const, memberId: 'p1' } };
    expect(selectSpondMemberDecisions(rows, linkDrafts, true, false, {})).toEqual([
      { action: 'link', spondMemberId: 'sm1', memberId: 'p1', guardianIds: [] },
    ]);
  });

  it('builds event link, creation, unchanged, and fallback skip decisions', () => {
    const createRows = selectSpondEventRows([event()], []);
    const createDrafts = selectInitialSpondActivityDrafts(createRows);
    createDrafts.se1 = { ...createDrafts.se1, kind: 'match', teamName: ' First ' };
    expect(selectSpondActivityDecisions(createRows, createDrafts, true)).toEqual([{
      action: 'create', spondEventId: 'se1', kind: 'match',
      teams: [{ name: 'First', strength: 2, selectedPlayers: [] }],
    }]);
    expect(selectSpondActivityDecisions(createRows, {}, true)).toEqual([{ action: 'skip', spondEventId: 'se1' }]);
    expect(selectSpondActivityDecisions(createRows, createDrafts, false)).toEqual([{ action: 'skip', spondEventId: 'se1' }]);

    const linkedActivity = activity({ spondId: 'se1', name: 'Activity' });
    const unchangedRows = selectSpondEventRows([event()], [linkedActivity]);
    expect(selectSpondActivityDecisions(unchangedRows, {}, true)).toEqual([{ action: 'skip', spondEventId: 'se1' }]);
    const changedRows = selectSpondEventRows([event({ location: 'New pitch' })], [linkedActivity]);
    const linkDrafts = selectInitialSpondActivityDrafts(changedRows);
    expect(selectSpondActivityDecisions(changedRows, linkDrafts, true)).toEqual([
      { action: 'link', spondEventId: 'se1', activityId: 'a1' },
    ]);
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
      { id: 'event:se1', kind: 'event', action: 'link', sourceName: 'Activity', targetName: 'Activity' },
    ]);
  });

  it('previews guardians linked to an existing player', () => {
    const sourceMember = member({ guardians: [{ id: 'sg1', firstName: 'Grace', lastName: 'Lovelace' }] });
    const existingPlayer = player({ spondId: 'sm1', guardians: [] });
    const memberRows = selectSpondMemberRows([sourceMember], [existingPlayer]);
    const guardianRows = selectSpondGuardianRows([sourceMember], [existingPlayer]);

    expect(selectSpondImportPreview(memberRows, guardianRows, [], [{
      action: 'link', spondMemberId: 'sm1', memberId: 'p1', guardianIds: ['sg1'],
    }], [])).toEqual([
      { id: 'guardian:sg1:sm1', kind: 'guardian', action: 'create', sourceName: 'Grace Lovelace', targetName: 'Ada Lovelace' },
    ]);
  });

  it('previews changed linked activity fields and deletions', () => {
    const linkedActivity = activity({ spondId: 'se1', location: 'Old pitch' });
    const changedRows = selectSpondEventRows([event({ location: 'New pitch' })], [linkedActivity]);
    expect(selectSpondImportPreview([], [], changedRows, [], [
      { action: 'link', spondEventId: 'se1', activityId: 'a1' },
    ])).toEqual([{
      id: 'event:se1', kind: 'event', action: 'update', sourceName: 'Activity', targetName: 'Activity', changes: ['location'],
    }]);

    const deletedRows = selectSpondEventRows([event({ status: 'deleted' })], [activity({ spondId: 'se1' })]);
    expect(selectSpondImportPreview([], [], deletedRows, [], [
      { action: 'delete', spondEventId: 'se1' },
    ])).toEqual([{
      id: 'event:se1', kind: 'event', action: 'delete', sourceName: 'Activity',
    }]);
  });

  it('previews fields for a same-day activity selected as a fallback link', () => {
    const existing = activity({ name: 'Old name', location: 'Old pitch' });
    const rows = selectSpondEventRows([event({ name: 'New name', location: 'New pitch' })], [existing]);
    expect(selectSpondActivityChanges(rows[0].source, existing)).toEqual(['name', 'location']);
    expect(selectSpondImportPreview([], [], rows, [], [
      { action: 'link', spondEventId: 'se1', activityId: 'a1' },
    ])).toEqual([expect.objectContaining({
      action: 'link', changes: ['name', 'location'],
    })]);
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
      { action: 'link', spondMemberId: 'sm1', memberId: 'p1', guardianIds: [] },
    ], [])).toEqual([]);

    const changedRows = selectSpondMemberRows([member({ birthDate: '2015-03-04' })], [linkedPlayer]);
    expect(selectSpondImportPreview(changedRows, [], [], [
      { action: 'link', spondMemberId: 'sm1', memberId: 'p1', guardianIds: [] },
    ], [])).toEqual([expect.objectContaining({
      kind: 'player', action: 'update', changes: ['birthDate'],
    })]);
  });

  it('treats apostrophe variants and encoded apostrophes as the same name', () => {
    const linkedPlayer = player({ firstName: 'Eliah', lastName: "D'Amico", spondId: 'sm1' });

    for (const lastName of ['D’Amico', 'DʼAmico', 'D&apos;Amico', 'D&#39;Amico']) {
      const rows = selectSpondMemberRows([member({ firstName: 'Eliah', lastName })], [linkedPlayer]);
      expect(selectSpondImportPreview(rows, [], [], [
        { action: 'link', spondMemberId: 'sm1', memberId: 'p1', guardianIds: [] },
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
      { action: 'create', spondEventId: 'se1', kind: 'tournament', teams: [{ name: 'Team 1', strength: 2, selectedPlayers: [] }] },
    ])).toMatchObject({ createdMembers: 1, createdActivities: 1, isReady: true });
  });

  it('rejects a team activity without a team and accepts explicit skips', () => {
    const memberRows = selectSpondMemberRows([member()], []);
    const eventRows = selectSpondEventRows([event()], []);
    expect(selectSpondDecisionSummary(memberRows, eventRows,
      [{ action: 'skip', spondMemberId: 'sm1' }],
      [{ action: 'create', spondEventId: 'se1', kind: 'match' }],
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
        { action: 'link', spondMemberId: 'sm1', memberId: '', guardianIds: [] },
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
  it('proposes the first period containing today', () => {
    const periods = [
      { id: 'current-a', name: 'Current A', startDate: '2026-01-01', endDate: '2026-12-31' },
      { id: 'current-b', name: 'Current B', startDate: '2026-06-01', endDate: '2026-11-30' },
    ];
    expect(selectCurrentSpondPeriodId(periods, new Date(2026, 9, 23))).toBe('current-a');
  });

  it('returns no proposed period when today is outside all periods', () => {
    expect(selectCurrentSpondPeriodId([
      { id: 'past', name: 'Past', startDate: '2026-01-01', endDate: '2026-06-30' },
    ], new Date(2026, 9, 23))).toBe('');
  });

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
