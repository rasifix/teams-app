import type { Formation, FormationSlot, LineupPositionAssignment, Player, PlayingMode, PositionCode, Team, TeamLineupPeriod } from '../../types';

export interface LineupSummaryPeriod {
  periodNumber: number;
  assignments: Array<{
    slotId: string;
    positionCode: PositionCode;
    displayIndex: number | null;
    playerId: string | null;
    playerName: string | null;
    playerLabel: string | null;
    pitchX: number;
    pitchY: number;
  }>;
  benchedPlayers: Array<{ playerId: string; playerName: string | null }>;
}

export const POSITION_CODES: PositionCode[] = [
  'GK',
  'LB', 'CB', 'RB', 'LWB', 'RWB',
  'CDM', 'CM', 'CAM', 'LM', 'RM',
  'LW', 'RW', 'CF', 'ST',
];

// Translated via i18n key `positions.${code}`; the code itself is language-neutral.
export function getPositionLabelKey(code: PositionCode): string {
  return `positions.${code}`;
}

export function selectDefaultPlayingMode(playingModes: PlayingMode[]): PlayingMode | null {
  return playingModes.find((mode) => mode.isDefault) ?? null;
}

export function selectPlayingModeById(playingModes: PlayingMode[], playingModeId: string | null | undefined): PlayingMode | undefined {
  if (!playingModeId) return undefined;
  return playingModes.find((mode) => mode.id === playingModeId);
}

export function selectFormationById(formations: Formation[], formationId: string | null | undefined): Formation | undefined {
  if (!formationId) return undefined;
  return formations.find((formation) => formation.id === formationId);
}

// Slots sharing the same positionCode are distinguished by a 1-based index for display (e.g. "CB 1", "CB 2").
export function selectSlotDisplayIndexes(slots: FormationSlot[]): Map<string, number | null> {
  const countByCode = new Map<PositionCode, number>();
  slots.forEach((slot) => {
    countByCode.set(slot.positionCode, (countByCode.get(slot.positionCode) ?? 0) + 1);
  });

  const seenByCode = new Map<PositionCode, number>();
  const indexes = new Map<string, number | null>();

  slots.forEach((slot) => {
    const total = countByCode.get(slot.positionCode) ?? 0;
    if (total <= 1) {
      indexes.set(slot.id, null);
      return;
    }

    const nextIndex = (seenByCode.get(slot.positionCode) ?? 0) + 1;
    seenByCode.set(slot.positionCode, nextIndex);
    indexes.set(slot.id, nextIndex);
  });

  return indexes;
}

const PITCH_POSITION_COORDINATES: Record<PositionCode, { x: number; y: number }> = {
  GK: { x: 50, y: 90 },
  LB: { x: 18, y: 72 }, CB: { x: 50, y: 72 }, RB: { x: 82, y: 72 },
  LWB: { x: 15, y: 60 }, RWB: { x: 85, y: 60 },
  CDM: { x: 50, y: 58 }, CM: { x: 50, y: 45 }, CAM: { x: 50, y: 33 },
  LM: { x: 17, y: 43 }, RM: { x: 83, y: 43 },
  LW: { x: 17, y: 20 }, RW: { x: 83, y: 20 },
  CF: { x: 50, y: 24 }, ST: { x: 50, y: 12 },
};

export function selectPitchCoordinates(slots: FormationSlot[]): Map<string, { x: number; y: number }> {
  const slotsByCode = new Map<PositionCode, FormationSlot[]>();
  slots.forEach((slot) => {
    slotsByCode.set(slot.positionCode, [...(slotsByCode.get(slot.positionCode) ?? []), slot]);
  });

  const coordinates = new Map<string, { x: number; y: number }>();
  slotsByCode.forEach((matchingSlots, positionCode) => {
    const base = PITCH_POSITION_COORDINATES[positionCode];
    matchingSlots.forEach((slot, index) => {
      const offset = (index - (matchingSlots.length - 1) / 2) * 18;
      coordinates.set(slot.id, { x: Math.max(8, Math.min(92, base.x + offset)), y: base.y });
    });
  });

  return coordinates;
}

export function selectPitchPlayerLabel(player: Player | undefined): string | null {
  if (!player) return null;
  return `${player.firstName} ${player.lastName.charAt(0)}.`;
}

export function selectAssignmentsForPeriod(team: Team, periodNumber: number): LineupPositionAssignment[] {
  return team.lineup?.find((period) => period.periodNumber === periodNumber)?.assignments ?? [];
}

export function selectLineupWithCopiedPeriod(
  lineup: TeamLineupPeriod[],
  sourcePeriodNumber: number,
  targetPeriodNumber: number
): TeamLineupPeriod[] {
  if (sourcePeriodNumber < 1 || targetPeriodNumber < 1 || sourcePeriodNumber === targetPeriodNumber) {
    return lineup;
  }

  const sourceAssignments = lineup
    .find((period) => period.periodNumber === sourcePeriodNumber)
    ?.assignments.map((assignment) => ({ ...assignment })) ?? [];
  const otherPeriods = lineup.filter((period) => period.periodNumber !== targetPeriodNumber);

  return [...otherPeriods, { periodNumber: targetPeriodNumber, assignments: sourceAssignments }]
    .sort((left, right) => left.periodNumber - right.periodNumber);
}

// Selected players absent from a period's assignments are implicitly benched.
export function selectBenchedPlayerIds(team: Team, periodNumber: number): string[] {
  const assignments = selectAssignmentsForPeriod(team, periodNumber);
  const assignedPlayerIds = new Set(assignments.map((assignment) => assignment.playerId));
  return (team.selectedPlayers || []).filter((playerId) => !assignedPlayerIds.has(playerId));
}

export function selectAssignablePlayersForSlot(
  team: Team,
  players: Player[],
  periodNumber: number,
  slotId: string
): Player[] {
  const selectedPlayerIds = new Set(team.selectedPlayers || []);
  const assignments = selectAssignmentsForPeriod(team, periodNumber);
  const currentPlayerId = assignments.find((assignment) => assignment.slotId === slotId)?.playerId;
  const assignedElsewhere = new Set(
    assignments
      .filter((assignment) => assignment.slotId !== slotId)
      .map((assignment) => assignment.playerId)
  );

  return players.filter((player) => (
    selectedPlayerIds.has(player.id) &&
    (player.id === currentPlayerId || !assignedElsewhere.has(player.id))
  ));
}

// Number of distinct periods in which each selected player has a field assignment.
export function selectPlannedPeriodCounts(team: Team): Map<string, number> {
  const selectedPlayerIds = new Set(team.selectedPlayers || []);
  const plannedPeriodsByPlayer = new Map<string, Set<number>>();

  selectedPlayerIds.forEach((playerId) => plannedPeriodsByPlayer.set(playerId, new Set()));
  (team.lineup || []).forEach((period) => {
    period.assignments.forEach((assignment) => {
      plannedPeriodsByPlayer.get(assignment.playerId)?.add(period.periodNumber);
    });
  });

  return new Map(
    [...plannedPeriodsByPlayer].map(([playerId, periodNumbers]) => [playerId, periodNumbers.size])
  );
}

export function selectLineupSummary(
  team: Team,
  formation: Formation,
  players: Player[],
  numberOfPeriods: number
): LineupSummaryPeriod[] {
  const playersById = new Map(players.map((player) => [player.id, player]));
  const slotDisplayIndexes = selectSlotDisplayIndexes(formation.slots);
  const pitchCoordinates = selectPitchCoordinates(formation.slots);
  const playerName = (playerId: string): string | null => {
    const player = playersById.get(playerId);
    return player ? `${player.firstName} ${player.lastName}` : null;
  };

  return Array.from({ length: Math.max(0, numberOfPeriods) }, (_, index) => {
    const periodNumber = index + 1;
    const assignmentsBySlotId = new Map(
      selectAssignmentsForPeriod(team, periodNumber).map((assignment) => [assignment.slotId, assignment])
    );

    return {
      periodNumber,
      assignments: formation.slots.map((slot) => {
        const assignment = assignmentsBySlotId.get(slot.id);
        const player = assignment ? playersById.get(assignment.playerId) : undefined;
        const coordinates = pitchCoordinates.get(slot.id) ?? { x: 50, y: 50 };
        return {
          slotId: slot.id,
          positionCode: slot.positionCode,
          displayIndex: slotDisplayIndexes.get(slot.id) ?? null,
          playerId: assignment?.playerId ?? null,
          playerName: assignment ? playerName(assignment.playerId) : null,
          playerLabel: selectPitchPlayerLabel(player),
          pitchX: coordinates.x,
          pitchY: coordinates.y,
        };
      }),
      benchedPlayers: selectBenchedPlayerIds(team, periodNumber).map((playerId) => ({
        playerId,
        playerName: playerName(playerId),
      })),
    };
  });
}

// Assignments referencing a player no longer on the team roster (e.g. after a late roster change).
export function selectStaleAssignmentsForPeriod(team: Team, periodNumber: number): LineupPositionAssignment[] {
  const selectedPlayerIds = new Set(team.selectedPlayers || []);
  return selectAssignmentsForPeriod(team, periodNumber).filter((assignment) => !selectedPlayerIds.has(assignment.playerId));
}

// Non-blocking warning: true when a period has assignments for players no longer selected on the team.
export function hasLineupRosterMismatch(team: Team, periodNumber: number): boolean {
  return selectStaleAssignmentsForPeriod(team, periodNumber).length > 0;
}
