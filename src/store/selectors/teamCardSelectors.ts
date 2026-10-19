import type { Activity, Player, ShirtSet, Team, Trainer } from '../../types';
import { getPlayerStats, type PlayerStats } from '../../utils/playerStats';
import { getActivityTime } from './activitySelectors';
import { selectTeamResponsiblePeople, type TeamAssignee } from './teamTrainerSelectors';

export interface TeamCardPlayerRow {
  playerId: string;
  player: Player | null;
  shirtNumber: number | null;
  statistics: PlayerStats;
  hasInactiveFutureEvent: boolean;
}

export interface TeamCardView {
  selectedPlayerCount: number;
  hasCapacity: boolean;
  averageLevel: number;
  displayLocation: string | undefined;
  displayTime: string;
  responsiblePeople: Array<TeamAssignee & { isLead: boolean }>;
  shirtSet: ShirtSet | null;
  playerRows: TeamCardPlayerRow[];
}

const comparableName = (value: string): string => value.trim().toLocaleLowerCase();

export function selectTeamCardView(
  team: Team,
  activity: Activity,
  players: Player[],
  trainers: Trainer[],
  shirtSets: ShirtSet[],
  activities: Activity[],
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
      statistics: getPlayerStats(playerId, activities),
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
    selectedPlayerCount: selectedPlayerIds.length,
    hasCapacity: selectedPlayerIds.length < maxPlayersPerTeam,
    averageLevel: selectedPlayers.length > 0
      ? selectedPlayers.reduce((sum, player) => sum + player.level, 0) / selectedPlayers.length
      : 0,
    displayLocation: activity.kind === 'match' ? activity.location : team.location || activity.location,
    displayTime: activity.kind === 'match' ? getActivityTime(activity) : team.startTime || getActivityTime(activity),
    responsiblePeople: selectTeamResponsiblePeople(team.responsiblePersonIds, trainers, players),
    shirtSet: team.shirtSetId ? shirtSets.find((shirtSet) => shirtSet.id === team.shirtSetId) ?? null : null,
    playerRows,
  };
}
