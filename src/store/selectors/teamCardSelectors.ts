import type { Activity, Player, Team, Trainer } from '../../types';
import { formatInstantDateTime } from '../../utils/dateFormatter';
import { selectTeamResponsiblePeople, type TeamAssignee } from './teamTrainerSelectors';

export interface TeamCardPlayerRow {
  playerId: string;
  player: Player | null;
  shirtNumber: number | null;
  hasInactiveFutureEvent: boolean;
}

export interface TeamCardView {
  teamId: string;
  teamName: string;
  meetingTime?: string;
  meetingLocation?: string;
  teamStrength: number;
  selectedPlayerCount: number;
  maxPlayersPerTeam: number;
  hasCapacity: boolean;
  averageLevel: number;
  responsiblePeople: TeamAssignee[];
  playerRows: TeamCardPlayerRow[];
}

export interface TeamSelectionShareLabels {
  activityTitle: string;
  responsiblePerson: string;
  meetingTime: string;
  meetingLocation: string;
  selectedPlayers: string;
  unknownPlayer: string;
}

export function selectTeamWhatsAppMessage(
  activity: Activity,
  view: TeamCardView,
  locale: string,
  labels: TeamSelectionShareLabels,
): string | null {
  const playerNames = view.playerRows.map(({ player }) => player
    ? `${player.firstName} ${player.lastName}`.trim()
    : labels.unknownPlayer);
  if (playerNames.length === 0) return null;

  const lines = [
    `⚽ *${labels.activityTitle}*`,
    '━━━━━━━━━━━━━━━━━━',
    `📅 ${formatInstantDateTime(activity.startsAt, locale)}`,
  ];
  if (activity.location) lines.push(`📍 ${activity.location}`);
  lines.push('', `👥 *${view.teamName}*`);
  if (view.meetingTime) lines.push(`🕐 ${labels.meetingTime}: ${view.meetingTime}`);
  if (view.meetingLocation) lines.push(`📍 ${labels.meetingLocation}: ${view.meetingLocation}`);
  if (view.responsiblePeople.length > 0) {
    lines.push(`👤 ${labels.responsiblePerson}: ${view.responsiblePeople.map(({ firstName, lastName }) => `${firstName} ${lastName}`).join(', ')}`);
  }
  lines.push('', `📋 *${labels.selectedPlayers}*`, ...playerNames.map((name) => `• ${name}`));
  return lines.join('\n');
}

const comparableName = (value: string): string => value.trim().toLocaleLowerCase();

export function selectTeamCardView(
  team: Team,
  players: Player[],
  trainers: Trainer[],
  inactiveFutureEventPlayerIds: Set<string>,
  maxPlayersPerTeam: number,
): TeamCardView {
  const selectedPlayerIds = team.selectedPlayers ?? [];
  const playersById = new Map(players.map((player) => [player.id, player]));
  const shirtNumbersByPlayerId = new Map((team.shirtAssignments ?? []).map((assignment) => [assignment.playerId, assignment.shirtNumber]));
  const selectedPlayers = selectedPlayerIds.flatMap((playerId) => {
    const player = playersById.get(playerId);
    return player ? [player] : [];
  });
  const playerRows = selectedPlayerIds
    .map<TeamCardPlayerRow>((playerId) => ({
      playerId,
      player: playersById.get(playerId) ?? null,
      shirtNumber: shirtNumbersByPlayerId.get(playerId) ?? null,
      hasInactiveFutureEvent: inactiveFutureEventPlayerIds.has(playerId),
    }))
    .sort((left, right) => {
      if (!left.player && !right.player) return left.playerId.localeCompare(right.playerId);
      if (!left.player) return 1;
      if (!right.player) return -1;
      return comparableName(left.player.lastName).localeCompare(comparableName(right.player.lastName))
        || comparableName(left.player.firstName).localeCompare(comparableName(right.player.firstName))
        || left.player.id.localeCompare(right.player.id);
    });

  return {
    teamId: team.id,
    teamName: team.name,
    meetingTime: team.meetingTime?.trim() || undefined,
    meetingLocation: team.meetingLocation?.trim() || undefined,
    teamStrength: team.strength || 2,
    selectedPlayerCount: selectedPlayerIds.length,
    maxPlayersPerTeam,
    hasCapacity: selectedPlayerIds.length < maxPlayersPerTeam,
    averageLevel: selectedPlayers.length > 0
      ? selectedPlayers.reduce((sum, player) => sum + player.level, 0) / selectedPlayers.length
      : 0,
    responsiblePeople: selectTeamResponsiblePeople(team.responsiblePersonId, trainers, players),
    playerRows,
  };
}
