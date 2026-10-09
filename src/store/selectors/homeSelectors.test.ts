import { describe, expect, it } from 'vitest';
import type { Activity, Player } from '../../types';
import { selectGuardianChildOpenInvitations, selectUpcomingEvents, selectUpcomingEventsWithGuardianInvitations } from './homeSelectors';

const buildEvent = (overrides: Partial<Activity>): Activity => ({
  id: 'event-default',
  squadId: 'squad-1',
  kind: 'match',
  name: 'Activity',
  startsAt: '2026-01-01T10:00:00.000Z',
  maxPlayersPerTeam: 12,
  minPlayersPerTeam: 8,
  teams: [],
  invitations: [],
  ...overrides,
});

const buildPlayer = (overrides: Partial<Player>): Player => ({
  id: 'player-default',
  firstName: 'First',
  lastName: 'Last',
  birthDate: '2014-06-15',
  level: 3,
  status: 'active',
  guardians: [],
  ...overrides,
});

describe('home selectors', () => {
  it('returns upcoming events sorted by date', () => {
    const events: Activity[] = [
      buildEvent({ id: 'e3', startsAt: '2026-06-01T10:00:00.000Z' }),
      buildEvent({ id: 'e2', startsAt: '2026-05-01T10:00:00.000Z' }),
      buildEvent({ id: 'e1', startsAt: '2026-04-10T10:00:00.000Z' }),
    ];

    const result = selectUpcomingEvents(events, new Date('2026-04-10T12:00:00Z'));

    expect(result.map((event) => event.id)).toEqual(['e1', 'e2', 'e3']);
  });

  it('excludes events before today', () => {
    const events: Activity[] = [
      buildEvent({ id: 'past', startsAt: '2026-04-09T10:00:00.000Z' }),
      buildEvent({ id: 'today', startsAt: '2026-04-10T10:00:00.000Z' }),
      buildEvent({ id: 'future', startsAt: '2026-04-11T10:00:00.000Z' }),
    ];

    const result = selectUpcomingEvents(events, new Date('2026-04-10T18:45:00Z'));

    expect(result.map((event) => event.id)).toEqual(['today', 'future']);
  });

  it('applies an optional item limit', () => {
    const events: Activity[] = [
      buildEvent({ id: 'e1', startsAt: '2026-05-01T10:00:00.000Z' }),
      buildEvent({ id: 'e2', startsAt: '2026-05-02T10:00:00.000Z' }),
      buildEvent({ id: 'e3', startsAt: '2026-05-03T10:00:00.000Z' }),
    ];

    const result = selectUpcomingEvents(events, new Date('2026-05-01T00:00:00Z'), 2);

    expect(result.map((event) => event.id)).toEqual(['e1', 'e2']);
  });

  it('returns an empty list when no upcoming events exist', () => {
    const events: Activity[] = [
      buildEvent({ id: 'e1', startsAt: '2026-03-01T10:00:00.000Z' }),
      buildEvent({ id: 'e2', startsAt: '2026-03-15T10:00:00.000Z' }),
    ];

    const result = selectUpcomingEvents(events, new Date('2026-04-01T00:00:00Z'));

    expect(result).toEqual([]);
  });

  it('returns actionable invitations for all guardian children sorted by child and event date', () => {
    const players: Player[] = [
      buildPlayer({
        id: 'p2',
        firstName: 'Ben',
        lastName: 'Meyer',
        guardians: [{ id: 'g-1', firstName: 'G', lastName: 'One', email: 'guardian@example.com' }],
      }),
      buildPlayer({
        id: 'p1',
        firstName: 'Anna',
        lastName: 'Meyer',
        guardians: [{ id: 'g-2', firstName: 'G', lastName: 'One', email: 'guardian@example.com' }],
      }),
      buildPlayer({
        id: 'p3',
        firstName: 'Chris',
        lastName: 'Other',
        guardians: [{ id: 'g-3', firstName: 'X', lastName: 'Y', email: 'other@example.com' }],
      }),
    ];

    const events: Activity[] = [
      buildEvent({
        id: 'e-later',
        name: 'Later Activity',
        startsAt: '2026-06-10T10:00:00.000Z',
        invitations: [
          { id: 'i-later', playerId: 'p1', response: 'open' },
        ],
      }),
      buildEvent({
        id: 'e-sooner-open',
        name: 'Sooner Open Activity',
        startsAt: '2026-05-10T10:00:00.000Z',
        invitations: [
          { id: 'i-sooner', playerId: 'p1', response: 'open' },
          { id: 'i-open-ben', playerId: 'p2', response: 'open' },
        ],
      }),
      buildEvent({
        id: 'e-accepted',
        name: 'Accepted Activity',
        startsAt: '2026-05-20T10:00:00.000Z',
        invitations: [
          { id: 'i-accepted', playerId: 'p2', response: 'accepted' },
        ],
      }),
      buildEvent({
        id: 'e-declined',
        name: 'Declined Activity',
        startsAt: '2026-05-25T10:00:00.000Z',
        invitations: [
          { id: 'i-declined', playerId: 'p2', response: 'declined' },
        ],
      }),
      buildEvent({
        id: 'e-injured',
        name: 'Injured Activity',
        startsAt: '2026-05-28T10:00:00.000Z',
        invitations: [
          { id: 'i-injured', playerId: 'p2', response: 'declined', declineReason: 'injured' },
        ],
      }),
      buildEvent({
        id: 'e-past',
        name: 'Past Activity',
        startsAt: '2026-04-01T10:00:00.000Z',
        invitations: [
          { id: 'i-past', playerId: 'p1', response: 'open' },
        ],
      }),
    ];

    const result = selectGuardianChildOpenInvitations(
      players,
      events,
      {
        id: 'u-guardian',
        email: 'guardian@example.com',
        firstName: 'Guardian',
        lastName: 'User',
      },
      new Date('2026-05-01T00:00:00Z')
    );

    expect(result.map((entry) => entry.playerId)).toEqual(['p1', 'p2']);
    expect(result[0].invitations.map((entry) => entry.invitationId)).toEqual(['i-sooner', 'i-later']);
    expect(result[0].invitations.map((entry) => entry.playerId)).toEqual(['p1', 'p1']);
    expect(result[0].invitations.map((entry) => entry.status)).toEqual(['open', 'open']);
    expect(result[1].invitations.map((entry) => entry.invitationId)).toEqual(['i-open-ben', 'i-accepted', 'i-declined']);
    expect(result[1].invitations.map((entry) => entry.playerId)).toEqual(['p2', 'p2', 'p2']);
    expect(result[1].invitations.map((entry) => entry.status)).toEqual(['open', 'accepted', 'declined']);
  });

  it('matches a guardian by member id even when the email differs', () => {
    const players: Player[] = [
      buildPlayer({
        id: 'p1',
        guardians: [{ id: 'u-guardian', firstName: 'Guardian', lastName: 'Member', email: 'other@example.com' }],
      }),
    ];
    const events: Activity[] = [
      buildEvent({
        id: 'e1',
        startsAt: '2026-05-10T10:00:00.000Z',
        invitations: [{ id: 'i1', playerId: 'p1', response: 'open' }],
      }),
    ];

    const result = selectGuardianChildOpenInvitations(
      players, events, { id: 'u-guardian', email: 'guardian@example.com', firstName: 'Guardian', lastName: 'User' }, new Date('2026-05-01T00:00:00Z')
    );

    expect(result.map((entry) => entry.playerId)).toEqual(['p1']);
  });

  it('returns empty when user has no guardian-linked children', () => {
    const players: Player[] = [
      buildPlayer({
        id: 'p1',
        guardians: [{ id: 'g-1', firstName: 'G', lastName: 'One', email: 'someone-else@example.com' }],
      }),
    ];

    const result = selectGuardianChildOpenInvitations(
      players,
      [],
      {
        id: 'u-guardian',
        email: 'guardian@example.com',
        firstName: 'Guardian',
        lastName: 'User',
      },
      new Date('2026-05-01T00:00:00Z')
    );

    expect(result).toEqual([]);
  });

  it('matches guardian-child relationships by guardian email when ids do not match auth user id', () => {
    const players: Player[] = [
      buildPlayer({
        id: 'p1',
        firstName: 'Lea',
        lastName: 'Meyer',
        guardians: [{ id: 'guardian-record-1', firstName: 'Simon', lastName: 'Raess', email: 'raess.simon@gmail.com' }],
      }),
    ];

    const events: Activity[] = [
      buildEvent({
        id: 'e1',
        name: 'Saturday Match',
        startsAt: '2026-05-10T10:00:00.000Z',
        invitations: [{ id: 'i1', playerId: 'p1', response: 'open' }],
      }),
    ];

    const result = selectGuardianChildOpenInvitations(
      players,
      events,
      {
        id: '1',
        email: 'raess.simon@gmail.com',
        firstName: 'Simon',
        lastName: 'Raess',
      },
      new Date('2026-05-01T00:00:00Z')
    );

    expect(result.map((entry) => entry.playerId)).toEqual(['p1']);
    expect(result[0].invitations.map((entry) => entry.invitationId)).toEqual(['i1']);
    expect(result[0].invitations.map((entry) => entry.playerId)).toEqual(['p1']);
  });

  it('enriches upcoming events with guardian invitation actions per child', () => {
    const players: Player[] = [
      buildPlayer({
        id: 'p1',
        firstName: 'Anna',
        lastName: 'Meyer',
        guardians: [{ id: 'g1', firstName: 'Simon', lastName: 'Raess', email: 'guardian@example.com' }],
      }),
      buildPlayer({
        id: 'p2',
        firstName: 'Ben',
        lastName: 'Meyer',
        guardians: [{ id: 'g2', firstName: 'Simon', lastName: 'Raess', email: 'guardian@example.com' }],
      }),
    ];

    const events: Activity[] = [
      buildEvent({
        id: 'e2',
        name: 'Future B',
        startsAt: '2026-05-10T10:00:00.000Z',
        invitations: [{ id: 'i2', playerId: 'p2', response: 'open' }],
      }),
      buildEvent({
        id: 'e1',
        name: 'Future A',
        startsAt: '2026-05-05T10:00:00.000Z',
        invitations: [{ id: 'i1', playerId: 'p1', response: 'open' }],
      }),
      buildEvent({
        id: 'past',
        name: 'Past',
        startsAt: '2026-04-01T10:00:00.000Z',
        invitations: [{ id: 'ip', playerId: 'p1', response: 'open' }],
      }),
    ];

    const result = selectUpcomingEventsWithGuardianInvitations(
      events,
      players,
      {
        id: 'u-guardian',
        email: 'guardian@example.com',
        firstName: 'Guardian',
        lastName: 'User',
      },
      new Date('2026-05-01T00:00:00Z')
    );

    expect(result.map((entry) => entry.id)).toEqual(['e1', 'e2']);
    expect(result[0].guardianInvitations.map((entry) => entry.invitationId)).toEqual(['i1']);
    expect(result[0].guardianInvitations.map((entry) => entry.playerId)).toEqual(['p1']);
    expect(result[0].guardianInvitations.map((entry) => entry.status)).toEqual(['open']);
    expect(result[1].guardianInvitations.map((entry) => entry.invitationId)).toEqual(['i2']);
    expect(result[1].guardianInvitations.map((entry) => entry.playerId)).toEqual(['p2']);
    expect(result[1].guardianInvitations.map((entry) => entry.status)).toEqual(['open']);
  });

  it('keeps invitation events visible even when they are beyond the plain upcoming limit', () => {
    const players: Player[] = [
      buildPlayer({
        id: 'p3',
        firstName: 'Lea',
        lastName: 'Meyer',
        guardians: [{ id: 'g3', firstName: 'Simon', lastName: 'Raess', email: 'guardian@example.com' }],
      }),
    ];

    const events: Activity[] = [
      buildEvent({ id: 'e1', startsAt: '2026-05-01T10:00:00.000Z', invitations: [] }),
      buildEvent({ id: 'e2', startsAt: '2026-05-02T10:00:00.000Z', invitations: [] }),
      buildEvent({
        id: 'e3',
        startsAt: '2026-05-03T10:00:00.000Z',
        invitations: [{ id: 'i3', playerId: 'p3', response: 'open' }],
      }),
    ];

    const result = selectUpcomingEventsWithGuardianInvitations(
      events,
      players,
      {
        id: 'u-guardian',
        email: 'guardian@example.com',
        firstName: 'Guardian',
        lastName: 'User',
      },
      new Date('2026-05-01T00:00:00Z'),
      2
    );

    expect(result.map((entry) => entry.id)).toEqual(['e3', 'e1']);
    expect(result[0].guardianInvitations.map((entry) => entry.invitationId)).toEqual(['i3']);
  });
});