import type { Player, Trainer } from '../../types';

export type ImportMemberRole = 'player' | 'trainer';

export interface GroupImportCandidate {
  id: string;
  role: ImportMemberRole;
  firstName: string;
  lastName: string;
  email?: string;
  birthDate?: string;
  birthYear?: number;
  level?: number;
  status?: Player['status'];
  guardians?: Player['guardians'];
}

function toComparableBirthDate(value: string | undefined): string {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function selectSourceMemberBirthYears(players: Player[]): number[] {
  return Array.from(new Set(
    players
      .map((player) => toComparableBirthDate(player.birthDate))
      .filter((birthDate) => Boolean(birthDate))
      .map((birthDate) => new Date(birthDate).getFullYear())
  )).sort((left, right) => left - right);
}

function normalizeName(value: string | undefined): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeEmail(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

function compareByName(left: Pick<GroupImportCandidate, 'firstName' | 'lastName'>, right: Pick<GroupImportCandidate, 'firstName' | 'lastName'>): number {
  const lastNameCompare = normalizeName(left.lastName).localeCompare(normalizeName(right.lastName));
  if (lastNameCompare !== 0) {
    return lastNameCompare;
  }

  return normalizeName(left.firstName).localeCompare(normalizeName(right.firstName));
}

function isDuplicatePlayer(candidate: GroupImportCandidate, targetPlayers: Player[]): boolean {
  const candidateBirthDate = toComparableBirthDate(candidate.birthDate);
  const candidateBirthYear = candidate.birthYear || (candidateBirthDate ? new Date(candidateBirthDate).getFullYear() : undefined);

  return targetPlayers.some((targetPlayer) => {
    if (
      normalizeName(targetPlayer.firstName) !== normalizeName(candidate.firstName)
      || normalizeName(targetPlayer.lastName) !== normalizeName(candidate.lastName)
    ) {
      return false;
    }

    const targetBirthDate = toComparableBirthDate(targetPlayer.birthDate);
    if (candidateBirthDate && targetBirthDate) {
      return candidateBirthDate === targetBirthDate;
    }

    return candidateBirthYear === targetPlayer.birthYear;
  });
}

function isDuplicateTrainer(candidate: GroupImportCandidate, targetTrainers: Trainer[]): boolean {
  const candidateEmail = normalizeEmail(candidate.email);

  return targetTrainers.some((targetTrainer) => {
    if (
      normalizeName(targetTrainer.firstName) !== normalizeName(candidate.firstName)
      || normalizeName(targetTrainer.lastName) !== normalizeName(candidate.lastName)
    ) {
      return false;
    }

    const targetEmail = normalizeEmail(targetTrainer.email);

    if (!candidateEmail && !targetEmail) {
      return true;
    }

    if (!candidateEmail || !targetEmail) {
      return false;
    }

    return candidateEmail === targetEmail;
  });
}

export function selectSourceGroupCandidates(players: Player[], trainers: Trainer[]): GroupImportCandidate[] {
  const playerCandidates: GroupImportCandidate[] = players.map((player) => ({
    id: player.id,
    role: 'player',
    firstName: player.firstName,
    lastName: player.lastName,
    birthDate: player.birthDate,
    birthYear: player.birthYear,
    level: player.level,
    status: player.status,
    guardians: player.guardians,
  }));

  const trainerCandidates: GroupImportCandidate[] = trainers.map((trainer) => ({
    id: trainer.id,
    role: 'trainer',
    firstName: trainer.firstName,
    lastName: trainer.lastName,
    email: trainer.email,
  }));

  return [...playerCandidates, ...trainerCandidates].sort((left, right) => {
    const byName = compareByName(left, right);
    if (byName !== 0) {
      return byName;
    }

    if (left.role === right.role) {
      return left.id.localeCompare(right.id);
    }

    return left.role === 'player' ? -1 : 1;
  });
}

export function isDuplicateTargetMember(
  candidate: GroupImportCandidate,
  targetPlayers: Player[],
  targetTrainers: Trainer[]
): boolean {
  if (candidate.role === 'player') {
    return isDuplicatePlayer(candidate, targetPlayers);
  }

  return isDuplicateTrainer(candidate, targetTrainers);
}

export function selectImportableGroupMembers(
  sourcePlayers: Player[],
  sourceTrainers: Trainer[],
  targetPlayers: Player[],
  targetTrainers: Trainer[],
  selectedBirthYears: number[] = []
): GroupImportCandidate[] {
  const selectedBirthYearSet = new Set(selectedBirthYears.filter((birthYear) => Number.isInteger(birthYear)));

  return selectSourceGroupCandidates(sourcePlayers, sourceTrainers).filter((candidate) => {
    if (candidate.role === 'player' && candidate.status === 'inactive') {
      return false;
    }

    const candidateBirthYear = candidate.birthDate
      ? new Date(toComparableBirthDate(candidate.birthDate)).getFullYear()
      : candidate.birthYear;

    const matchesBirthYear =
      selectedBirthYearSet.size === 0
      || candidate.role === 'trainer'
      || (candidateBirthYear ? selectedBirthYearSet.has(candidateBirthYear) : false);

    return matchesBirthYear && !isDuplicateTargetMember(candidate, targetPlayers, targetTrainers);
  });
}
