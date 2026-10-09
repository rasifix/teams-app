import type { Player, Trainer } from '../../types';

export type TeamAssigneeSource = 'player' | 'trainer';

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
  const lastNameCompare = toComparableName(left.lastName).localeCompare(toComparableName(right.lastName));
  if (lastNameCompare !== 0) return lastNameCompare;
  const firstNameCompare = toComparableName(left.firstName).localeCompare(toComparableName(right.firstName));
  return firstNameCompare;
}

export function selectTeamAssigneeOptions(trainers: Trainer[], players: Player[]): TeamAssignee[] {
  const membersById = new Map<string, TeamAssignee>();
  trainers.forEach((trainer) => membersById.set(trainer.id, {
    id: trainer.id,
    firstName: trainer.firstName,
    lastName: trainer.lastName,
    source: 'trainer',
  }));
  players.forEach((player) => {
    if (!membersById.has(player.id)) membersById.set(player.id, {
      id: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
      source: 'player',
    });
  });
  return Array.from(membersById.values()).sort(compareByName);
}

export function selectTeamAssigneeMap(trainers: Trainer[], players: Player[]): Map<string, TeamAssignee> {
  return new Map(selectTeamAssigneeOptions(trainers, players).map((member) => [member.id, member]));
}

export function selectTeamAssigneeById(
  assigneeId: string | undefined,
  trainers: Trainer[],
  players: Player[]
): TeamAssignee | null {
  return assigneeId ? selectTeamAssigneeMap(trainers, players).get(assigneeId) ?? null : null;
}

export function selectTeamResponsiblePeople(
  responsiblePersonIds: string[] | undefined,
  trainers: Trainer[],
  players: Player[]
): Array<TeamAssignee & { isLead: boolean }> {
  const members = selectTeamAssigneeMap(trainers, players);
  return (responsiblePersonIds ?? []).flatMap((id) => {
    const member = members.get(id);
    return member ? [member] : [];
  }).map((member, index) => ({ ...member, isLead: index === 0 }));
}

// Compatibility names used while older call sites are migrated.
export type TeamTrainerSource = TeamAssigneeSource;
export type TeamTrainerAssignee = TeamAssignee;
export const selectTeamTrainerOptions = selectTeamAssigneeOptions;
export const selectTeamTrainerAssigneeMap = selectTeamAssigneeMap;
export const selectTeamTrainerAssigneeById = selectTeamAssigneeById;
