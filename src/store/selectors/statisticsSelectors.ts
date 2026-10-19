import type { Activity, Period, Player } from '../../types';
import { getActivityDate, getInvitationStatus, isTeamActivity } from './activitySelectors';
import { filterEventsByStatisticsPeriod } from '../../utils/statisticsPeriod';

export interface PlayerActivityStatistics {
  player: Player;
  invitedCount: number;
  acceptedCount: number;
  selectedCount: number;
  acceptanceRate: number;
  selectionRate: number;
}

export type PlayerStatisticsSortField = 'name' | 'invited' | 'accepted' | 'selected' | 'acceptanceRate' | 'selectionRate';
export type SortDirection = 'asc' | 'desc';

export interface StatisticsSummary {
  totalPlayers: number;
  totalEvents: number;
  averageAcceptances: number;
  averageSelections: number;
}

export interface StatisticsViewData {
  filteredEvents: Activity[];
  statisticsPlayers: Player[];
  playerStatistics: PlayerActivityStatistics[];
  summary: StatisticsSummary;
}

export interface EventParticipationRow {
  player: Player;
  attendance: Array<{ status: string; event: Activity }>;
}

export type TeamSelectionMode = 'strength' | 'teamName';

export interface SelectionEventDetail {
  eventId: string;
  eventName: string;
  eventDate: string;
  teamId: string;
  teamName: string;
}

export interface TeamSelectionMatrixColumn {
  key: string;
  label: string;
  strength?: number;
}

export interface TeamSelectionMatrixCell {
  columnKey: string;
  count: number;
  events: SelectionEventDetail[];
}

export interface TeamSelectionMatrixRow {
  player: Player;
  selectedCount: number;
  acceptedCount: number;
  cells: TeamSelectionMatrixCell[];
}

const comparableName = (value: string): string => value.trim().toLocaleLowerCase();
const comparePlayers = (left: Player, right: Player): number =>
  comparableName(left.lastName).localeCompare(comparableName(right.lastName)) ||
  comparableName(left.firstName).localeCompare(comparableName(right.firstName)) ||
  left.id.localeCompare(right.id);

export function selectPlayerActivityStatistics(activities: Activity[], players: Player[]): PlayerActivityStatistics[] {
  const teamActivities = activities.filter(isTeamActivity);
  return players.map((player) => {
    const invitedCount = teamActivities.filter((activity) =>
      activity.invitations.some((invitation) => invitation.playerId === player.id)
    ).length;
    const acceptedCount = teamActivities.filter((activity) =>
      activity.invitations.some((invitation) => invitation.playerId === player.id && invitation.response === 'accepted')
    ).length;
    const selectedCount = teamActivities.filter((activity) =>
      activity.teams.some((team) => (team.selectedPlayers ?? []).includes(player.id))
    ).length;
    return {
      player,
      invitedCount,
      acceptedCount,
      selectedCount,
      acceptanceRate: invitedCount > 0 ? (acceptedCount / invitedCount) * 100 : 0,
      selectionRate: acceptedCount > 0 ? (selectedCount / acceptedCount) * 100 : 0,
    };
  }).sort((left, right) => comparePlayers(left.player, right.player));
}

export function selectStatisticsViewData(
  activities: Activity[],
  players: Player[],
  period: Period | null,
): StatisticsViewData {
  const statisticsPlayers = players.filter((player) => player.status !== 'trial');
  const filteredEvents = filterEventsByStatisticsPeriod(activities.filter(isTeamActivity), period);
  const playerStatistics = selectPlayerActivityStatistics(filteredEvents, statisticsPlayers);
  const totalPlayers = playerStatistics.length;

  return {
    filteredEvents,
    statisticsPlayers,
    playerStatistics,
    summary: {
      totalPlayers,
      totalEvents: filteredEvents.length,
      averageAcceptances: totalPlayers > 0
        ? playerStatistics.reduce((sum, statistic) => sum + statistic.acceptedCount, 0) / totalPlayers
        : 0,
      averageSelections: totalPlayers > 0
        ? playerStatistics.reduce((sum, statistic) => sum + statistic.selectedCount, 0) / totalPlayers
        : 0,
    },
  };
}

export function selectVisiblePlayerStatistics(
  playerStatistics: PlayerActivityStatistics[],
  levelRange: [number, number],
  sortField: PlayerStatisticsSortField,
  sortDirection: SortDirection,
): PlayerActivityStatistics[] {
  const comparisonFor = (left: PlayerActivityStatistics, right: PlayerActivityStatistics): number => {
    switch (sortField) {
      case 'invited': return left.invitedCount - right.invitedCount;
      case 'accepted': return left.acceptedCount - right.acceptedCount;
      case 'selected': return left.selectedCount - right.selectedCount;
      case 'acceptanceRate': return left.acceptanceRate - right.acceptanceRate;
      case 'selectionRate': return left.selectionRate - right.selectionRate;
      case 'name': return comparePlayers(left.player, right.player);
    }
  };

  return playerStatistics
    .filter(({ player }) => player.level >= levelRange[0] && player.level <= levelRange[1])
    .sort((left, right) => {
      const primary = comparisonFor(left, right);
      const comparison = primary === 0 && sortField !== 'name'
        ? comparePlayers(left.player, right.player)
        : primary;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
}

export function selectNextUpcomingEventIndex(events: Activity[], now: Date): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return events.findIndex((event) => {
    const eventDate = new Date(getActivityDate(event));
    if (Number.isNaN(eventDate.getTime())) return false;
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });
}

export function selectEventParticipationRows(
  players: Player[],
  activities: Activity[],
  levelRange: [number, number]
): EventParticipationRow[] {
  const teamActivities = activities.filter(isTeamActivity);
  return players
    .filter((player) => player.level >= levelRange[0] && player.level <= levelRange[1])
    .sort(comparePlayers)
    .map((player) => ({
      player,
      attendance: teamActivities.map((event) => {
        const invitation = event.invitations.find((entry) => entry.playerId === player.id);
        const isSelected = event.teams.some((team) => (team.selectedPlayers ?? []).includes(player.id));
        if (!invitation) return { status: 'not-invited', event };
        if (isSelected) return { status: 'selected', event };
        return { status: getInvitationStatus(invitation), event };
      }),
    }));
}

const teamColumnKey = (teamName: string): string => teamName.trim().toLocaleLowerCase();
const displayTeamName = (teamName: string, fallbackIndex: number, fallbackLabel: string): string =>
  teamName.trim() || `${fallbackLabel} ${fallbackIndex + 1}`;

export function selectTeamSelectionMatrixData(
  players: Player[],
  activities: Activity[],
  levelRange: [number, number],
  mode: TeamSelectionMode,
  strengthLabel: (strength: number) => string,
  fallbackTeamLabel: string
): { columns: TeamSelectionMatrixColumn[]; rows: TeamSelectionMatrixRow[] } {
  const teamActivities = activities.filter(isTeamActivity);
  const columnsByKey = new Map<string, TeamSelectionMatrixColumn>();
  teamActivities.forEach((activity) => activity.teams.forEach((team, index) => {
    if (mode === 'strength') {
      const key = `strength-${team.strength}`;
      if (!columnsByKey.has(key)) columnsByKey.set(key, { key, label: strengthLabel(team.strength), strength: team.strength });
      return;
    }
    const name = displayTeamName(team.name, index, fallbackTeamLabel);
    const key = teamColumnKey(name);
    if (!columnsByKey.has(key)) columnsByKey.set(key, { key, label: name });
  }));

  const columns = Array.from(columnsByKey.values()).sort((left, right) => mode === 'strength'
    ? (left.strength ?? Number.MAX_SAFE_INTEGER) - (right.strength ?? Number.MAX_SAFE_INTEGER)
    : left.label.localeCompare(right.label, undefined, { numeric: true, sensitivity: 'base' }));

  const rows = players
    .filter((player) => player.level >= levelRange[0] && player.level <= levelRange[1])
    .sort(comparePlayers)
    .map<TeamSelectionMatrixRow>((player) => {
      const selectedCount = teamActivities.filter((activity) =>
        activity.teams.some((team) => (team.selectedPlayers ?? []).includes(player.id))
      ).length;
      const acceptedCount = teamActivities.filter((activity) =>
        activity.invitations.some((invitation) => invitation.playerId === player.id && getInvitationStatus(invitation) === 'accepted')
      ).length;
      const cells = columns.map<TeamSelectionMatrixCell>((column) => {
        const selectedEvents = teamActivities.flatMap((activity) => activity.teams.flatMap((team, index) => {
          const teamName = displayTeamName(team.name, index, fallbackTeamLabel);
          const matches = mode === 'strength'
            ? team.strength === column.strength
            : teamColumnKey(teamName) === column.key;
          if (!matches || !(team.selectedPlayers ?? []).includes(player.id)) return [];
          return [{ eventId: activity.id, eventName: activity.name, eventDate: getActivityDate(activity), teamId: team.id, teamName }];
        }));
        return { columnKey: column.key, count: selectedEvents.length, events: selectedEvents };
      });
      return { player, selectedCount, acceptedCount, cells };
    });

  return { columns, rows };
}
