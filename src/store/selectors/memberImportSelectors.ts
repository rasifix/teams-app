import type { Guardian, Player, PlayerStatus, Trainer } from '../../types';

export interface ParsedGuardianImportCandidate {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface ParsedPlayerImportCandidate {
  id: string;
  sourceRow: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
  guardians: ParsedGuardianImportCandidate[];
  issues: string[];
}

export interface PlannedGuardianImport {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  trainerId?: string;
}

export interface PlayerImportDiffRow {
  id: string;
  sourceRow: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
  existingPlayerId?: string;
  createPlayer?: Omit<Player, 'id'>;
  fillBirthDate?: string;
  guardiansToAdd: PlannedGuardianImport[];
  issues: string[];
  isActionable: boolean;
}

export interface PlayerImportDiffSummary {
  totalRows: number;
  actionableRows: number;
  newPlayers: number;
  existingPlayersWithChanges: number;
  birthDateFills: number;
  guardiansToAdd: number;
  invalidRows: number;
}

export interface PlayerImportDiffResult {
  rows: PlayerImportDiffRow[];
  summary: PlayerImportDiffSummary;
}

export interface ImportDefaults {
  level: number;
  status: PlayerStatus;
}

const DEFAULT_IMPORT_DEFAULTS: ImportDefaults = {
  level: 1,
  status: 'active',
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeEmail(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function hasDuplicateGuardianMatch(
  existingGuardian: Pick<Guardian, 'firstName' | 'lastName' | 'email' | 'userId' | 'id'>,
  candidateGuardian: PlannedGuardianImport
): boolean {
  const existingUserId = (existingGuardian.userId || '').trim();
  const candidateTrainerId = (candidateGuardian.trainerId || '').trim();
  if (existingUserId && candidateTrainerId && existingUserId === candidateTrainerId) {
    return true;
  }

  const existingId = (existingGuardian.id || '').trim();
  if (existingId && candidateTrainerId && existingId === candidateTrainerId) {
    return true;
  }

  const existingEmail = normalizeEmail(existingGuardian.email);
  const candidateEmail = normalizeEmail(candidateGuardian.email);
  if (existingEmail && candidateEmail && existingEmail === candidateEmail) {
    return true;
  }

  const existingName = `${normalizeName(existingGuardian.firstName)}::${normalizeName(existingGuardian.lastName)}`;
  const candidateName = `${normalizeName(candidateGuardian.firstName)}::${normalizeName(candidateGuardian.lastName)}`;
  return existingName === candidateName;
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

function buildTrainerByEmailMap(trainers: Trainer[]): Map<string, Trainer> {
  const result = new Map<string, Trainer>();

  trainers.forEach((trainer) => {
    const email = normalizeEmail(trainer.email);
    if (email && !result.has(email)) {
      result.set(email, trainer);
    }
  });

  return result;
}

function createPlannedGuardian(
  rowId: string,
  guardian: ParsedGuardianImportCandidate,
  index: number,
  trainerByEmail: Map<string, Trainer>
): PlannedGuardianImport | null {
  const firstName = guardian.firstName.trim();
  const lastName = guardian.lastName.trim();

  if (!firstName || !lastName) {
    return null;
  }

  const normalizedEmail = normalizeEmail(guardian.email);
  const matchingTrainer = normalizedEmail ? trainerByEmail.get(normalizedEmail) : undefined;

  if (matchingTrainer) {
    return {
      id: `${rowId}:guardian:${index}:trainer:${matchingTrainer.id}`,
      firstName: matchingTrainer.firstName,
      lastName: matchingTrainer.lastName,
      email: matchingTrainer.email,
      trainerId: matchingTrainer.id,
    };
  }

  return {
    id: `${rowId}:guardian:${index}`,
    firstName,
    lastName,
    email: normalizedEmail || undefined,
  };
}

function dedupePlannedGuardians(
  planned: PlannedGuardianImport[],
  existingGuardians: Guardian[] | undefined
): PlannedGuardianImport[] {
  const deduped: PlannedGuardianImport[] = [];

  planned.forEach((guardian) => {
    const duplicateInExisting = (existingGuardians || []).some((existingGuardian) => (
      hasDuplicateGuardianMatch(existingGuardian, guardian)
    ));
    const duplicateInPlanned = deduped.some((plannedGuardian) => {
      const plannedAsGuardian: Pick<Guardian, 'firstName' | 'lastName' | 'email' | 'userId' | 'id'> = {
        id: plannedGuardian.trainerId || plannedGuardian.id,
        userId: plannedGuardian.trainerId,
        firstName: plannedGuardian.firstName,
        lastName: plannedGuardian.lastName,
        email: plannedGuardian.email,
      };
      return hasDuplicateGuardianMatch(plannedAsGuardian, guardian);
    });

    if (!duplicateInExisting && !duplicateInPlanned) {
      deduped.push(guardian);
    }
  });

  return deduped;
}

export function selectPlayerImportDiff(
  candidates: ParsedPlayerImportCandidate[],
  players: Player[],
  trainers: Trainer[],
  defaults: ImportDefaults = DEFAULT_IMPORT_DEFAULTS
): PlayerImportDiffResult {
  const trainerByEmail = buildTrainerByEmailMap(trainers);

  const rows = candidates.map<PlayerImportDiffRow>((candidate) => {
    const issues = [...candidate.issues];
    const candidateFirstName = candidate.firstName.trim();
    const candidateLastName = candidate.lastName.trim();
    const candidateBirthDate = toComparableBirthDate(candidate.birthDate);

    if (!candidateFirstName || !candidateLastName) {
      issues.push('missing-player-name');
      return {
        id: candidate.id,
        sourceRow: candidate.sourceRow,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        birthDate: candidate.birthDate,
        guardiansToAdd: [],
        issues,
        isActionable: false,
      };
    }

    const sameNamePlayers = players.filter((player) => (
      normalizeName(player.firstName) === normalizeName(candidateFirstName)
      && normalizeName(player.lastName) === normalizeName(candidateLastName)
    ));

    const matchingPlayers = candidateBirthDate
      ? sameNamePlayers.filter((player) => {
          const playerBirthDate = toComparableBirthDate(player.birthDate);
          return !playerBirthDate || playerBirthDate === candidateBirthDate;
        })
      : sameNamePlayers;

    if (matchingPlayers.length > 1) {
      issues.push('ambiguous-player-match');
      return {
        id: candidate.id,
        sourceRow: candidate.sourceRow,
        firstName: candidateFirstName,
        lastName: candidateLastName,
        birthDate: candidateBirthDate || undefined,
        guardiansToAdd: [],
        issues,
        isActionable: false,
      };
    }

    const plannedGuardians = dedupePlannedGuardians(
      candidate.guardians
        .map((guardian, index) => createPlannedGuardian(candidate.id, guardian, index, trainerByEmail))
        .filter((guardian): guardian is PlannedGuardianImport => guardian !== null),
      matchingPlayers[0]?.guardians
    );

    if (matchingPlayers.length === 0) {
      if (!candidateBirthDate) {
        issues.push('missing-birth-date-for-new-player');
      }

      const createPlayer = candidateBirthDate
        ? {
            firstName: candidateFirstName,
            lastName: candidateLastName,
            birthDate: candidateBirthDate,
            birthYear: new Date(candidateBirthDate).getFullYear(),
            level: defaults.level,
            status: defaults.status,
          }
        : undefined;

      return {
        id: candidate.id,
        sourceRow: candidate.sourceRow,
        firstName: candidateFirstName,
        lastName: candidateLastName,
        birthDate: candidateBirthDate || undefined,
        createPlayer,
        guardiansToAdd: plannedGuardians,
        issues,
        isActionable: Boolean(createPlayer) || plannedGuardians.length > 0,
      };
    }

    const existingPlayer = matchingPlayers[0];
    const existingBirthDate = toComparableBirthDate(existingPlayer.birthDate);
    const fillBirthDate = !existingBirthDate && candidateBirthDate ? candidateBirthDate : undefined;

    return {
      id: candidate.id,
      sourceRow: candidate.sourceRow,
      firstName: candidateFirstName,
      lastName: candidateLastName,
      birthDate: candidateBirthDate || undefined,
      existingPlayerId: existingPlayer.id,
      fillBirthDate,
      guardiansToAdd: plannedGuardians,
      issues,
      isActionable: plannedGuardians.length > 0 || Boolean(fillBirthDate),
    };
  });

  const summary: PlayerImportDiffSummary = {
    totalRows: rows.length,
    actionableRows: rows.filter((row) => row.isActionable).length,
    newPlayers: rows.filter((row) => Boolean(row.createPlayer)).length,
    existingPlayersWithChanges: rows.filter((row) => !row.createPlayer && (row.guardiansToAdd.length > 0 || Boolean(row.fillBirthDate))).length,
    birthDateFills: rows.filter((row) => Boolean(row.fillBirthDate)).length,
    guardiansToAdd: rows.reduce((sum, row) => sum + row.guardiansToAdd.length, 0),
    invalidRows: rows.filter((row) => !row.isActionable).length,
  };

  return { rows, summary };
}
