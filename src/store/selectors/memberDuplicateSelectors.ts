import type { Activity, Guardian, Player, Trainer } from '../../types';

export interface DuplicateTrainerEntry {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  assignedTeamCount: number;
}

export interface DuplicateGuardianEntry {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  isDocumentedOnly?: boolean;
  playerIds: string[];
}

export interface DuplicateMemberGroup {
  key: string;
  firstName: string;
  lastName: string;
  trainers: DuplicateTrainerEntry[];
  guardians: DuplicateGuardianEntry[];
  recommendedTrainerId: string;
}

function toComparableName(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

function toKey(firstName: string | undefined, lastName: string | undefined): string {
  return `${toComparableName(firstName)}::${toComparableName(lastName)}`;
}

function compareByName(left: { firstName: string; lastName: string }, right: { firstName: string; lastName: string }): number {
  const lastNameCompare = toComparableName(left.lastName).localeCompare(toComparableName(right.lastName));
  return lastNameCompare || toComparableName(left.firstName).localeCompare(toComparableName(right.firstName));
}

function isValidName(firstName: string | undefined, lastName: string | undefined): boolean {
  return Boolean(toComparableName(firstName)) && Boolean(toComparableName(lastName));
}

function trainerAssignmentCounts(trainers: Trainer[], activities: Activity[]): Map<string, number> {
  const counts = new Map<string, number>();
  trainers.forEach((trainer) => counts.set(trainer.id, 0));

  activities.forEach((activity) => {
    activity.teams.forEach((team) => {
      (team.responsiblePersonIds || []).forEach((personId) => {
        if (counts.has(personId)) counts.set(personId, (counts.get(personId) || 0) + 1);
      });
    });
  });

  return counts;
}

function mergeGuardianEntries(existing: DuplicateGuardianEntry, guardian: Guardian, playerId: string): DuplicateGuardianEntry {
  const playerIds = existing.playerIds.includes(playerId) ? existing.playerIds : [...existing.playerIds, playerId];
  return {
    ...existing,
    email: existing.email || guardian.email,
    isDocumentedOnly: Boolean(existing.isDocumentedOnly && guardian.isDocumentedOnly),
    playerIds,
  };
}

export function selectDuplicateTrainerGuardianGroups(players: Player[], trainers: Trainer[], activities: Activity[]): DuplicateMemberGroup[] {
  const groupedTrainers = new Map<string, DuplicateTrainerEntry[]>();
  const groupedGuardians = new Map<string, DuplicateGuardianEntry[]>();
  const assignmentsByTrainerId = trainerAssignmentCounts(trainers, activities);

  trainers.forEach((trainer) => {
    if (!isValidName(trainer.firstName, trainer.lastName)) return;
    const key = toKey(trainer.firstName, trainer.lastName);
    const current = groupedTrainers.get(key) || [];
    current.push({
      id: trainer.id,
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      assignedTeamCount: assignmentsByTrainerId.get(trainer.id) || 0,
    });
    groupedTrainers.set(key, current);
  });

  players.forEach((player) => {
    (player.guardians || []).forEach((guardian) => {
      if (!isValidName(guardian.firstName, guardian.lastName)) return;
      const key = toKey(guardian.firstName, guardian.lastName);
      const current = groupedGuardians.get(key) || [];
      const existing = current.find((entry) => entry.id === guardian.id);
      if (existing) {
        const merged = mergeGuardianEntries(existing, guardian, player.id);
        groupedGuardians.set(key, current.map((entry) => (entry.id === existing.id ? merged : entry)));
        return;
      }
      current.push({
        id: guardian.id,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        email: guardian.email,
        isDocumentedOnly: guardian.isDocumentedOnly,
        playerIds: [player.id],
      });
      groupedGuardians.set(key, current);
    });
  });

  const duplicateGroups: DuplicateMemberGroup[] = [];
  groupedTrainers.forEach((trainerEntries, key) => {
    const trainerIds = new Set(trainerEntries.map((trainer) => trainer.id));
    const guardianEntries = (groupedGuardians.get(key) || []).filter((guardian) => !trainerIds.has(guardian.id));
    if (trainerEntries.length === 0 || guardianEntries.length === 0) return;

    const byAssignmentThenName = (left: DuplicateTrainerEntry, right: DuplicateTrainerEntry) =>
      right.assignedTeamCount - left.assignedTeamCount || compareByName(left, right);
    const [recommendedTrainer] = [...trainerEntries].sort(byAssignmentThenName);
    duplicateGroups.push({
      key,
      firstName: trainerEntries[0].firstName,
      lastName: trainerEntries[0].lastName,
      trainers: [...trainerEntries].sort(byAssignmentThenName),
      guardians: [...guardianEntries].sort(compareByName),
      recommendedTrainerId: recommendedTrainer.id,
    });
  });

  return duplicateGroups.sort(compareByName);
}
