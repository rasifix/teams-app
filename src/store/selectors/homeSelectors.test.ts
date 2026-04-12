import { describe, expect, it } from 'vitest';
import type { Event, Player } from '../../types';
import { selectGuardianChildOpenInvitations, selectUpcomingEvents, selectUpcomingEventsWithGuardianInvitations } from './homeSelectors';

const buildEvent = (overrides: Partial<Event>): Event => ({
  id: 'event-default',
  name: 'Event',
  date: '2026-01-01',
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
  birthYear: 2014,
  level: 3,
  status: 'active',
  guardians: [],
  ...overrides,
});

describe('home selectors', () => {
  it('returns upcoming events sorted by date', () => {
    const events: Event[] = [
      buildEvent({ id: 'e3', date: '2026-06-01' }),
      buildEvent({ id: 'e2', date: '2026-05-01' }),
      buildEvent({ id: 'e1', date: '2026-04-10' }),
    ];

    const result = selectUpcomingEvents(events, new Date('2026-04-10T12:00:00Z'));

    expect(result.map((event) => event.id)).toEqual(['e1', 'e2', 'e3']);
  });

  it('excludes events before today', () => {
    const events: Event[] = [
      buildEvent({ id: 'past', date: '2026-04-09' }),
      buildEvent({ id: 'today', date: '2026-04-10' }),
      buildEvent({ id: 'future', date: '2026-04-11' }),
    ];

    const result = selectUpcomingEvents(events, new Date('2026-04-10T18:45:00Z'));

    expect(result.map((event) => event.id)).toEqual(['today', 'future']);
  });

  it('applies an optional item limit', () => {
    const events: Event[] = [
      buildEvent({ id: 'e1', date: '2026-05-01' }),
      buildEvent({ id: 'e2', date: '2026-05-02' }),
      buildEvent({ id: 'e3', date: '2026-05-03' }),
    ];

    const result = selectUpcomingEvents(events, new Date('2026-05-01T00:00:00Z'), 2);

    expect(result.map((event) => event.id)).toEqual(['e1', 'e2']);
  });

  it('returns an empty list when no upcoming events exist', () => {
    const events: Event[] = [
      buildEvent({ id: 'e1', date: '2026-03-01' }),
      buildEvent({ id: 'e2', date: '2026-03-15' }),
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
        guardians: [{ id: 'g-1', firstName: 'G', lastName: 'One', userId: 'u-guardian' }],
      }),
      buildPlayer({
        id: 'p1',
        firstName: 'Anna',
        lastName: 'Meyer',
        guardians: [{ id: 'g-2', firstName: 'G', lastName: 'One', userId: 'u-guardian' }],
      }),
      buildPlayer({
        id: 'p3',
        firstName: 'Chris',
        lastName: 'Other',
        guardians: [{ id: 'g-3', firstName: 'X', lastName: 'Y', userId: 'u-other' }],
      }),
    ];

    const events: Event[] = [
      buildEvent({
        id: 'e-later',
        name: 'Later Event',
        date: '2026-06-10',
        invitations: [
          { id: 'i-later', playerId: 'p1', status: 'open' },
        ],
      }),
      buildEvent({
        id: 'e-sooner-open',
        name: 'Sooner Open Event',
        date: '2026-05-10',
        invitations: [
          { id: 'i-sooner', playerId: 'p1', status: 'open' },
          { id: 'i-open-ben', playerId: 'p2', status: 'open' },
        ],
      }),
      buildEvent({
        id: 'e-accepted',
        name: 'Accepted Event',
        date: '2026-05-20',
        invitations: [
          { id: 'i-accepted', playerId: 'p2', status: 'accepted' },
        ],
      }),
      buildEvent({
        id: 'e-declined',
        name: 'Declined Event',
        date: '2026-05-25',
        invitations: [
          { id: 'i-declined', playerId: 'p2', status: 'declined' },
        ],
      }),
      buildEvent({
        id: 'e-injured',
        name: 'Injured Event',
        date: '2026-05-28',
        invitations: [
          { id: 'i-injured', playerId: 'p2', status: 'injured' },
        ],
      }),
      buildEvent({
        id: 'e-past',
        name: 'Past Event',
        date: '2026-04-01',
        invitations: [
          { id: 'i-past', playerId: 'p1', status: 'open' },
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

  it('returns empty when user has no guardian-linked children', () => {
    const players: Player[] = [
      buildPlayer({
        id: 'p1',
        guardians: [{ id: 'g-1', firstName: 'G', lastName: 'One', userId: 'u-someone-else' }],
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

    const events: Event[] = [
      buildEvent({
        id: 'e1',
        name: 'Saturday Match',
        date: '2026-05-10',
        invitations: [{ id: 'i1', playerId: 'p1', status: 'open' }],
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
        guardians: [{ id: 'g1', firstName: 'Simon', lastName: 'Raess', userId: 'u-guardian' }],
      }),
      buildPlayer({
        id: 'p2',
        firstName: 'Ben',
        lastName: 'Meyer',
        guardians: [{ id: 'g2', firstName: 'Simon', lastName: 'Raess', userId: 'u-guardian' }],
      }),
    ];

    const events: Event[] = [
      buildEvent({
        id: 'e2',
        name: 'Future B',
        date: '2026-05-10',
        invitations: [{ id: 'i2', playerId: 'p2', status: 'open' }],
      }),
      buildEvent({
        id: 'e1',
        name: 'Future A',
        date: '2026-05-05',
        invitations: [{ id: 'i1', playerId: 'p1', status: 'open' }],
      }),
      buildEvent({
        id: 'past',
        name: 'Past',
        date: '2026-04-01',
        invitations: [{ id: 'ip', playerId: 'p1', status: 'open' }],
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
        guardians: [{ id: 'g3', firstName: 'Simon', lastName: 'Raess', userId: 'u-guardian' }],
      }),
    ];

    const events: Event[] = [
      buildEvent({ id: 'e1', date: '2026-05-01', invitations: [] }),
      buildEvent({ id: 'e2', date: '2026-05-02', invitations: [] }),
      buildEvent({
        id: 'e3',
        date: '2026-05-03',
        invitations: [{ id: 'i3', playerId: 'p3', status: 'open' }],
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