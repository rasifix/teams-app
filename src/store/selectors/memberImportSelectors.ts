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

export function selectVisiblePlayerImportRows(rows: PlayerImportDiffRow[]): PlayerImportDiffRow[] {
  return rows.filter((row) => {
    const isUnchangedExistingPlayer = Boolean(row.existingPlayerId)
      && !row.createPlayer
      && !row.fillBirthDate
      && row.guardiansToAdd.length === 0
      && row.issues.length === 0;

    return !isUnchangedExistingPlayer;
  });
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

function toGuardianIdentityKey(firstName: string | undefined, lastName: string | undefined, email: string | undefined): string {
  return `${normalizeName(firstName || '')}::${normalizeName(lastName || '')}::${normalizeEmail(email)}`;
}

function hasCompleteGuardianIdentity(firstName: string | undefined, lastName: string | undefined, email: string | undefined): boolean {
  return Boolean(normalizeName(firstName || ''))
    && Boolean(normalizeName(lastName || ''))
    && Boolean(normalizeEmail(email));
}

function hasDuplicateGuardianMatch(
  existingGuardian: Pick<Guardian, 'firstName' | 'lastName' | 'email' | 'userId' | 'id'>,
  candidateGuardian: PlannedGuardianImport
): boolean {
  if (!hasCompleteGuardianIdentity(existingGuardian.firstName, existingGuardian.lastName, existingGuardian.email)) {
    return false;
  }

  if (!hasCompleteGuardianIdentity(candidateGuardian.firstName, candidateGuardian.lastName, candidateGuardian.email)) {
    return false;
  }

  return toGuardianIdentityKey(existingGuardian.firstName, existingGuardian.lastName, existingGuardian.email)
    === toGuardianIdentityKey(candidateGuardian.firstName, candidateGuardian.lastName, candidateGuardian.email);
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

interface ExistingGuardianMember {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface ExistingGuardianLookup {
  byIdentity: Map<string, ExistingGuardianMember>;
}

function buildExistingGuardianLookup(players: Player[], trainers: Trainer[]): ExistingGuardianLookup {
  const byIdentity = new Map<string, ExistingGuardianMember>();

  const addMember = (member: ExistingGuardianMember) => {
    if (!hasCompleteGuardianIdentity(member.firstName, member.lastName, member.email)) {
      return;
    }

    const identityKey = toGuardianIdentityKey(member.firstName, member.lastName, member.email);
    const existing = byIdentity.get(identityKey);
    if (!existing || Boolean(member.id)) {
      byIdentity.set(identityKey, member);
    }
  };

  trainers.forEach((trainer) => {
    addMember({
      id: trainer.id,
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
    });
  });

  players.forEach((player) => {
    (player.guardians || []).forEach((guardian) => {
      if (guardian.isDocumentedOnly && !guardian.userId) {
        return;
      }

      const id = guardian.userId || guardian.id;
      if (!id) {
        return;
      }

      addMember({
        id,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        email: guardian.email,
      });
    });
  });

  return { byIdentity };
}

function createPlannedGuardian(
  rowId: string,
  guardian: ParsedGuardianImportCandidate,
  index: number,
  existingGuardianLookup: ExistingGuardianLookup
): PlannedGuardianImport | null {
  const firstName = guardian.firstName.trim();
  const lastName = guardian.lastName.trim();

  if (!firstName || !lastName) {
    return null;
  }

  const normalizedEmail = normalizeEmail(guardian.email);
  const matchingGuardianMember = hasCompleteGuardianIdentity(firstName, lastName, normalizedEmail)
    ? existingGuardianLookup.byIdentity.get(toGuardianIdentityKey(firstName, lastName, normalizedEmail))
    : undefined;

  if (matchingGuardianMember) {
    return {
      id: `${rowId}:guardian:${index}:member:${matchingGuardianMember.id}`,
      firstName: matchingGuardianMember.firstName,
      lastName: matchingGuardianMember.lastName,
      email: matchingGuardianMember.email,
      trainerId: matchingGuardianMember.id,
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

function dedupeGuardiansAcrossRows(rows: PlayerImportDiffRow[]): PlayerImportDiffRow[] {
  const plannedByExistingPlayer = new Map<string, PlannedGuardianImport[]>();

  return rows.map((row) => {
    if (!row.existingPlayerId || row.guardiansToAdd.length === 0) {
      return row;
    }

    const alreadyPlanned = plannedByExistingPlayer.get(row.existingPlayerId) || [];
    const guardiansToAdd = row.guardiansToAdd.filter((guardian) => {
      return !alreadyPlanned.some((plannedGuardian) => {
        const plannedAsGuardian: Pick<Guardian, 'firstName' | 'lastName' | 'email' | 'userId' | 'id'> = {
          id: plannedGuardian.trainerId || plannedGuardian.id,
          userId: plannedGuardian.trainerId,
          firstName: plannedGuardian.firstName,
          lastName: plannedGuardian.lastName,
          email: plannedGuardian.email,
        };
        return hasDuplicateGuardianMatch(plannedAsGuardian, guardian);
      });
    });

    plannedByExistingPlayer.set(row.existingPlayerId, [...alreadyPlanned, ...guardiansToAdd]);

    return {
      ...row,
      guardiansToAdd,
      isActionable: guardiansToAdd.length > 0 || Boolean(row.fillBirthDate),
    };
  });
}

export function selectPlayerImportDiff(
  candidates: ParsedPlayerImportCandidate[],
  players: Player[],
  trainers: Trainer[],
  defaults: ImportDefaults = DEFAULT_IMPORT_DEFAULTS
): PlayerImportDiffResult {
  const existingGuardianLookup = buildExistingGuardianLookup(players, trainers);

  const preliminaryRows = candidates.map<PlayerImportDiffRow>((candidate) => {
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

    const matchingPlayers = sameNamePlayers.length === 1
      ? sameNamePlayers
      : candidateBirthDate
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
        .map((guardian, index) => createPlannedGuardian(candidate.id, guardian, index, existingGuardianLookup))
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
    const fillBirthDate = candidateBirthDate && existingBirthDate !== candidateBirthDate
      ? candidateBirthDate
      : undefined;

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

  const rows = dedupeGuardiansAcrossRows(preliminaryRows);

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
