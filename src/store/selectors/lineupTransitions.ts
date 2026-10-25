import type { LineupPositionAssignment, TeamLineupPeriod } from '../../types';
import { applyLineupPlayerDrop } from './matchPlanningSelectors';

export function replaceLineupPeriodAssignments(
  lineup: TeamLineupPeriod[],
  periodNumber: number,
  assignments: LineupPositionAssignment[]
): TeamLineupPeriod[] {
  const otherPeriods = lineup.filter((period) => period.periodNumber !== periodNumber);
  return [...otherPeriods, { periodNumber, assignments }]
    .sort((left, right) => left.periodNumber - right.periodNumber);
}

export function assignLineupPlayer(
  lineup: TeamLineupPeriod[],
  periodNumber: number,
  slotId: string,
  playerId: string
): TeamLineupPeriod[] {
  const assignments = lineup.find((period) => period.periodNumber === periodNumber)?.assignments ?? [];
  const withoutPlayer = assignments.filter((assignment) => assignment.playerId !== playerId);
  const withoutSlot = withoutPlayer.filter((assignment) => assignment.slotId !== slotId);
  return replaceLineupPeriodAssignments(
    lineup,
    periodNumber,
    playerId ? [...withoutSlot, { slotId, playerId }] : withoutSlot
  );
}

export function dropLineupPlayer(
  lineup: TeamLineupPeriod[],
  periodNumber: number,
  playerId: string,
  targetSlotId: string | null
): TeamLineupPeriod[] {
  const assignments = lineup.find((period) => period.periodNumber === periodNumber)?.assignments ?? [];
  return replaceLineupPeriodAssignments(
    lineup,
    periodNumber,
    applyLineupPlayerDrop(assignments, playerId, targetSlotId)
  );
}

export function copyLineupPeriod(
  lineup: TeamLineupPeriod[],
  sourcePeriodNumber: number,
  targetPeriodNumber: number
): TeamLineupPeriod[] {
  if (sourcePeriodNumber < 1 || targetPeriodNumber < 1 || sourcePeriodNumber === targetPeriodNumber) return lineup;
  const source = lineup.find((period) => period.periodNumber === sourcePeriodNumber);
  if (!source) return lineup;
  const copiedAssignments = source.assignments.map((assignment) => ({ ...assignment }));
  return replaceLineupPeriodAssignments(lineup, targetPeriodNumber, copiedAssignments);
}
