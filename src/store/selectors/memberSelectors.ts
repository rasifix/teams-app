import type { Player, Trainer } from '../../types';

export type SquadMember = Player | Trainer;

function toComparableName(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

function compareByName(left: Pick<SquadMember, 'firstName' | 'lastName'>, right: Pick<SquadMember, 'firstName' | 'lastName'>): number {
  const lastNameCompare = toComparableName(left.lastName)
    .localeCompare(toComparableName(right.lastName));
  if (lastNameCompare !== 0) {
    return lastNameCompare;
  }

  return toComparableName(left.firstName)
    .localeCompare(toComparableName(right.firstName));
}

function mergeRoles(left: string[] | undefined, right: string[] | undefined): Array<'admin' | 'trainer' | 'guardian' | 'player'> {
  const merged = new Set([...(left || []), ...(right || [])]);
  return Array.from(merged) as Array<'admin' | 'trainer' | 'guardian' | 'player'>;
}

function isPlayerMember(member: SquadMember): member is Player {
  if (member.roles?.includes('player')) {
    return true;
  }

  return 'birthDate' in member || 'level' in member || 'status' in member;
}

function isTrainerMember(member: SquadMember): member is Trainer {
  if (member.roles?.includes('trainer')) {
    return true;
  }

  return !isPlayerMember(member) && (!member.roles || member.roles.length === 0);
}

function normalizePlayer(player: Player): Player {
  return {
    ...player,
    status: player.status || 'active',
    roles: player.roles || [],
  };
}

function normalizeTrainer(trainer: Trainer): Trainer {
  return {
    ...trainer,
    roles: trainer.roles || [],
  };
}

export function selectPlayersFromMembers(members: SquadMember[]): Player[] {
  return members
    .filter(isPlayerMember)
    .map(normalizePlayer)
    .sort(compareByName);
}

export function selectTrainersFromMembers(members: SquadMember[]): Trainer[] {
  return members
    .filter(isTrainerMember)
    .map(normalizeTrainer)
    .sort(compareByName);
}

export function mergeMembersFromCollections(players: Player[], trainers: Trainer[]): SquadMember[] {
  const membersById = new Map<string, SquadMember>();

  trainers.forEach((trainer) => {
    membersById.set(trainer.id, normalizeTrainer(trainer));
  });

  players.forEach((player) => {
    const normalizedPlayer = normalizePlayer(player);
    const existing = membersById.get(normalizedPlayer.id);

    if (!existing) {
      membersById.set(normalizedPlayer.id, normalizedPlayer);
      return;
    }

    // If one record appears in both collections, preserve player-specific fields.
    membersById.set(normalizedPlayer.id, {
      ...existing,
      ...normalizedPlayer,
      roles: mergeRoles(existing.roles, normalizedPlayer.roles),
    });
  });

  return Array.from(membersById.values()).sort(compareByName);
}
