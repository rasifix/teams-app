import type { Guardian, Player, Trainer } from '../../types';

export type TeamAssigneeSource = 'trainer' | 'guardian';

export interface TeamAssignee {
  id: string;
  firstName: string;
  lastName: string;
  source: TeamAssigneeSource;
}

function toComparableName(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

function compareByName(left: Pick<TeamAssignee, 'firstName' | 'lastName'>, right: Pick<TeamAssignee, 'firstName' | 'lastName'>): number {
  const lastNameCompare = toComparableName(left.lastName)
    .localeCompare(toComparableName(right.lastName));
  if (lastNameCompare !== 0) {
    return lastNameCompare;
  }

  return toComparableName(left.firstName)
    .localeCompare(toComparableName(right.firstName));
}

function createGuardianAssignee(guardian: Guardian): TeamAssignee {
  return {
    id: guardian.id,
    firstName: guardian.firstName,
    lastName: guardian.lastName,
    source: 'guardian',
  };
}

function buildAssigneeMap(trainers: Trainer[], players: Player[]): Map<string, TeamAssignee> {
  const assigneesById = new Map<string, TeamAssignee>();

  trainers.forEach((trainer) => {
    assigneesById.set(trainer.id, {
      id: trainer.id,
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      source: 'trainer',
    });
  });

  players.forEach((player) => {
    (player.guardians || []).forEach((guardian) => {
      if (!assigneesById.has(guardian.id)) {
        assigneesById.set(guardian.id, createGuardianAssignee(guardian));
      }
    });
  });

  return assigneesById;
}

export function selectTeamAssigneeOptions(trainers: Trainer[], players: Player[]): TeamAssignee[] {
  return Array.from(buildAssigneeMap(trainers, players).values()).sort(compareByName);
}

export function selectTeamAssigneeMap(trainers: Trainer[], players: Player[]): Map<string, TeamAssignee> {
  return buildAssigneeMap(trainers, players);
}

export function selectTeamAssigneeById(
  assigneeId: string | undefined,
  trainers: Trainer[],
  players: Player[]
): TeamAssignee | null {
  if (!assigneeId) {
    return null;
  }

  return selectTeamAssigneeMap(trainers, players).get(assigneeId) || null;
}

// Backward-compatible aliases; keep temporarily during migration.
export type TeamTrainerSource = TeamAssigneeSource;
export type TeamTrainerAssignee = TeamAssignee;

export const selectTeamTrainerOptions = selectTeamAssigneeOptions;
export const selectTeamTrainerAssigneeMap = selectTeamAssigneeMap;
export const selectTeamTrainerAssigneeById = selectTeamAssigneeById;
