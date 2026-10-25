import type { Player, Team, Trainer } from '../../types';
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
  teamStrength: number;
  selectedPlayerCount: number;
  maxPlayersPerTeam: number;
  hasCapacity: boolean;
  averageLevel: number;
  responsiblePeople: TeamAssignee[];
  playerRows: TeamCardPlayerRow[];
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
