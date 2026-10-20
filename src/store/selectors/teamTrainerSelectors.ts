import type { Player, Trainer } from '../../types';

export type TeamAssigneeSource = 'trainer' | 'guardian';

export interface TeamAssignee {
  id: string;
  firstName: string;
  lastName: string;
  source: TeamAssigneeSource;
}

interface AuthenticatedTrainerIdentity {
  id: string;
  email?: string;
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

// Only trainers and guardians can be responsible for a team; players never are.
// A person that is both trainer and guardian is listed once, as trainer.
export function selectTeamAssigneeOptions(trainers: Trainer[], players: Player[] = []): TeamAssignee[] {
  const byId = new Map<string, TeamAssignee>();
  trainers.forEach((trainer) => byId.set(trainer.id, {
    id: trainer.id,
    firstName: trainer.firstName,
    lastName: trainer.lastName,
    source: 'trainer',
  }));
  players.forEach((player) => (player.guardians ?? []).forEach((guardian) => {
    if (!byId.has(guardian.id)) byId.set(guardian.id, {
      id: guardian.id,
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      source: 'guardian',
    });
  }));
  return Array.from(byId.values()).sort(compareByName);
}

export function filterTeamAssignees(options: TeamAssignee[], query: string): TeamAssignee[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return options;
  return options.filter((option) => {
    const name = `${option.firstName} ${option.lastName}`.toLowerCase();
    return terms.every((term) => name.includes(term));
  });
}

export function selectTeamAssigneeMap(trainers: Trainer[], players: Player[] = []): Map<string, TeamAssignee> {
  return new Map(selectTeamAssigneeOptions(trainers, players).map((member) => [member.id, member]));
}

export function selectTeamAssigneeById(
  assigneeId: string | undefined,
  trainers: Trainer[],
  players: Player[] = []
): TeamAssignee | null {
  return assigneeId ? selectTeamAssigneeMap(trainers, players).get(assigneeId) ?? null : null;
}

export function selectTeamResponsiblePeople(
  responsiblePersonIds: string[] | undefined,
  trainers: Trainer[],
  players: Player[] = []
): TeamAssignee[] {
  const members = selectTeamAssigneeMap(trainers, players);
  return (responsiblePersonIds ?? []).flatMap((id) => {
    const member = members.get(id);
    return member ? [member] : [];
  }).slice(0, 1);
}

export function selectTrainerForUser(
  user: AuthenticatedTrainerIdentity | null | undefined,
  trainers: Trainer[],
): Trainer | null {
  if (!user) return null;

  const idMatch = trainers.find((trainer) => trainer.id === user.id);
  if (idMatch) return idMatch;

  const email = toComparableName(user.email);
  return email
    ? trainers.find((trainer) => toComparableName(trainer.email) === email) ?? null
    : null;
}

// Compatibility names used while older call sites are migrated.
export type TeamTrainerSource = TeamAssigneeSource;
export type TeamTrainerAssignee = TeamAssignee;
export const selectTeamTrainerOptions = selectTeamAssigneeOptions;
export const selectTeamTrainerAssigneeMap = selectTeamAssigneeMap;
export const selectTeamTrainerAssigneeById = selectTeamAssigneeById;
