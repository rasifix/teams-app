import type { Guardian, Player, Trainer } from '../../types';

export type TeamTrainerSource = 'trainer' | 'guardian';

export interface TeamTrainerAssignee {
  id: string;
  firstName: string;
  lastName: string;
  source: TeamTrainerSource;
}

function toComparableName(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

function compareByName(left: Pick<TeamTrainerAssignee, 'firstName' | 'lastName'>, right: Pick<TeamTrainerAssignee, 'firstName' | 'lastName'>): number {
  const lastNameCompare = toComparableName(left.lastName)
    .localeCompare(toComparableName(right.lastName));
  if (lastNameCompare !== 0) {
    return lastNameCompare;
  }

  return toComparableName(left.firstName)
    .localeCompare(toComparableName(right.firstName));
}

function createGuardianAssignee(guardian: Guardian): TeamTrainerAssignee {
  return {
    id: guardian.id,
    firstName: guardian.firstName,
    lastName: guardian.lastName,
    source: 'guardian',
  };
}

export function selectTeamTrainerOptions(trainers: Trainer[], players: Player[]): TeamTrainerAssignee[] {
  const trainerAssignees = trainers.map((trainer) => ({
    id: trainer.id,
    firstName: trainer.firstName,
    lastName: trainer.lastName,
    source: 'trainer' as const,
  }));

  const assigneesById = new Map<string, TeamTrainerAssignee>();
  trainerAssignees.forEach((trainer) => {
    assigneesById.set(trainer.id, trainer);
  });

  players.forEach((player) => {
    (player.guardians || []).forEach((guardian) => {
      if (!assigneesById.has(guardian.id)) {
        assigneesById.set(guardian.id, createGuardianAssignee(guardian));
      }
    });
  });

  return Array.from(assigneesById.values()).sort(compareByName);
}

export function selectTeamTrainerAssigneeMap(trainers: Trainer[], players: Player[]): Map<string, TeamTrainerAssignee> {
  const map = new Map<string, TeamTrainerAssignee>();

  for (const t of trainers) {
    map.set(t.id, { id: t.id, firstName: t.firstName, lastName: t.lastName, source: 'trainer' });
  }

  for (const player of players) {
    for (const guardian of player.guardians || []) {
      if (!map.has(guardian.id)) {
        map.set(guardian.id, createGuardianAssignee(guardian));
      }
    }
  }

  return map;
}

export function selectTeamTrainerAssigneeById(
  trainerId: string | undefined,
  trainers: Trainer[],
  players: Player[]
): TeamTrainerAssignee | null {
  if (!trainerId) {
    return null;
  }

  const matchingTrainer = trainers.find((trainer) => trainer.id === trainerId);
  if (matchingTrainer) {
    return {
      id: matchingTrainer.id,
      firstName: matchingTrainer.firstName,
      lastName: matchingTrainer.lastName,
      source: 'trainer',
    };
  }

  for (const player of players) {
    const matchingGuardian = (player.guardians || []).find((guardian) => guardian.id === trainerId);
    if (matchingGuardian) {
      return createGuardianAssignee(matchingGuardian);
    }
  }

  return null;
}
