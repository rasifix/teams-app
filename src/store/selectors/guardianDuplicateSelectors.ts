import type { Guardian, Player } from '../../types';

export interface DuplicateGuardianEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userId?: string;
  playerIds: string[];
}

export interface DuplicateGuardianGroup {
  key: string;
  firstName: string;
  lastName: string;
  email: string;
  guardians: DuplicateGuardianEntry[];
  recommendedGuardianId: string;
  linkedPlayerCount: number;
}

function toComparable(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

function toNameEmailKey(firstName: string | undefined, lastName: string | undefined, email: string | undefined): string {
  return `${toComparable(firstName)}::${toComparable(lastName)}::${toComparable(email)}`;
}

function isGuardianEligible(guardian: Guardian): guardian is Guardian & { email: string } {
  return Boolean(toComparable(guardian.firstName))
    && Boolean(toComparable(guardian.lastName))
    && Boolean(toComparable(guardian.email));
}

function mergeEntry(existing: DuplicateGuardianEntry, playerId: string): DuplicateGuardianEntry {
  if (existing.playerIds.includes(playerId)) {
    return existing;
  }

  return {
    ...existing,
    playerIds: [...existing.playerIds, playerId],
  };
}

function compareByNameEmail(
  left: Pick<DuplicateGuardianGroup, 'lastName' | 'firstName' | 'email'>,
  right: Pick<DuplicateGuardianGroup, 'lastName' | 'firstName' | 'email'>
): number {
  const lastNameCompare = toComparable(left.lastName).localeCompare(toComparable(right.lastName));
  if (lastNameCompare !== 0) {
    return lastNameCompare;
  }

  const firstNameCompare = toComparable(left.firstName).localeCompare(toComparable(right.firstName));
  if (firstNameCompare !== 0) {
    return firstNameCompare;
  }

  return toComparable(left.email).localeCompare(toComparable(right.email));
}

export function selectDuplicateGuardianGroups(players: Player[]): DuplicateGuardianGroup[] {
  const grouped = new Map<string, Map<string, DuplicateGuardianEntry>>();

  players.forEach((player) => {
    (player.guardians || []).forEach((guardian) => {
      if (!isGuardianEligible(guardian)) {
        return;
      }

      const duplicateKey = toNameEmailKey(guardian.firstName, guardian.lastName, guardian.email);
      const guardianId = guardian.userId || guardian.id;
      const groupEntries = grouped.get(duplicateKey) || new Map<string, DuplicateGuardianEntry>();
      const existing = groupEntries.get(guardianId);

      if (existing) {
        groupEntries.set(guardianId, mergeEntry(existing, player.id));
      } else {
        groupEntries.set(guardianId, {
          id: guardianId,
          firstName: guardian.firstName,
          lastName: guardian.lastName,
          email: guardian.email,
          userId: guardian.userId,
          playerIds: [player.id],
        });
      }

      grouped.set(duplicateKey, groupEntries);
    });
  });

  const groups: DuplicateGuardianGroup[] = [];

  grouped.forEach((entryById, key) => {
    const guardians = Array.from(entryById.values());
    if (guardians.length < 2) {
      return;
    }

    const sortedGuardians = [...guardians].sort((left, right) => {
      if (Boolean(right.userId) !== Boolean(left.userId)) {
        return Number(Boolean(right.userId)) - Number(Boolean(left.userId));
      }

      if (right.playerIds.length !== left.playerIds.length) {
        return right.playerIds.length - left.playerIds.length;
      }

      return left.id.localeCompare(right.id);
    });

    const linkedPlayerIds = new Set<string>();
    sortedGuardians.forEach((guardian) => {
      guardian.playerIds.forEach((playerId) => linkedPlayerIds.add(playerId));
    });

    groups.push({
      key,
      firstName: sortedGuardians[0].firstName,
      lastName: sortedGuardians[0].lastName,
      email: sortedGuardians[0].email,
      guardians: sortedGuardians,
      recommendedGuardianId: sortedGuardians[0].id,
      linkedPlayerCount: linkedPlayerIds.size,
    });
  });

  return groups.sort(compareByNameEmail);
}