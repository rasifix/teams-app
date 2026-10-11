import type { User } from '../services/authService';
import type { Trainer } from '../types';
import type { Squad } from '../types';

const ELEVATED_GROUP_ROLES = new Set(['admin', 'trainer', 'group_manager', 'coach']);

function logPermissionDebug(payload: {
  check: 'restricted-management';
  user: User | null | undefined;
  squad: Squad | null | undefined;
  trainers: Array<Pick<Trainer, 'id' | 'email'>>;
  trainerMatches: Array<{ by: 'id' | 'email'; value: string }>;
  allowed: boolean;
}): void {
  const {
    check,
    user,
    squad,
    trainers,
    trainerMatches,
    allowed,
  } = payload;

  console.info('[permissions]', {
    check,
    allowed,
    userId: user?.id,
    email: user?.email,
    squadId: squad?.id,
    squadTrainerIds: (squad?.trainers || []).map((trainer) => trainer.id),
    squadTrainerEmails: (squad?.trainers || []).map((trainer) => trainer.email).filter(Boolean),
    loadedTrainerIds: trainers.map((trainer) => trainer.id),
    loadedTrainerEmails: trainers.map((trainer) => trainer.email).filter(Boolean),
    squadMembers: (squad?.members || []).map((member) => ({
      id: member.id,
      email: member.email,
      roles: member.roles || [],
    })),
    trainerMatches,
  });
}

function normalizeEmail(email: string | undefined): string {
  return (email || '').trim().toLowerCase();
}

function normalizeRole(role: string | undefined): string {
  return (role || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function hasEntries<T>(value: T[] | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

export function withResolvedSquadPermissions(
  squad: Squad | null | undefined,
  fallbacks: Array<Squad | null | undefined>,
): Squad | null | undefined {
  if (!squad) {
    return squad;
  }

  const fallbackWithTrainers = fallbacks.find((candidate) => hasEntries(candidate?.trainers));
  const fallbackWithMembers = fallbacks.find((candidate) => hasEntries(candidate?.members));

  const trainers = hasEntries(squad.trainers)
    ? squad.trainers
    : fallbackWithTrainers?.trainers ?? squad.trainers;
  const members = hasEntries(squad.members)
    ? squad.members
    : fallbackWithMembers?.members ?? squad.members;

  if (trainers === squad.trainers && members === squad.members) {
    return squad;
  }

  return {
    ...squad,
    trainers,
    members,
  };
}

function getTrainerMatches(
  user: User,
  trainers: Array<Pick<Trainer, 'id' | 'email'>>,
): Array<{ by: 'id' | 'email'; value: string }> {
  if (!trainers.length) {
    return [];
  }

  const normalizedEmail = normalizeEmail(user.email);

  return trainers.flatMap((trainer) => {
    const matches: Array<{ by: 'id' | 'email'; value: string }> = [];

    if (trainer.id === user.id) {
      matches.push({ by: 'id', value: trainer.id });
    }

    if (normalizedEmail && normalizeEmail(trainer.email) === normalizedEmail) {
      matches.push({ by: 'email', value: normalizedEmail });
    }

    return matches;
  });
}

function getMemberRoleMatches(user: User, squad: Squad | null | undefined): Array<{ by: 'id' | 'email'; value: string; role: string }> {
  if (!squad?.members?.length) {
    return [];
  }

  const normalizedEmail = normalizeEmail(user.email);

  return squad.members.flatMap((member) => {
    const normalizedRoles = (member.roles || []).map(normalizeRole);
    const elevatedRoles = normalizedRoles.filter((role) => ELEVATED_GROUP_ROLES.has(role));
    if (elevatedRoles.length === 0) {
      return [];
    }

    const matches: Array<{ by: 'id' | 'email'; value: string; role: string }> = [];

    if (member.id === user.id) {
      elevatedRoles.forEach((role) => {
        matches.push({ by: 'id', value: member.id, role });
      });
    }

    if (normalizedEmail && normalizeEmail(member.email) === normalizedEmail) {
      elevatedRoles.forEach((role) => {
        matches.push({ by: 'email', value: normalizedEmail, role });
      });
    }

    return matches;
  });
}

export function canAccessRestrictedManagement(
  user: User | null | undefined,
  options: {
    squad?: Squad | null;
    trainers?: Array<Pick<Trainer, 'id' | 'email'>>;
  },
): boolean {
  const { squad, trainers = [] } = options;

  if (!user) {
    logPermissionDebug({
      check: 'restricted-management',
      user,
      squad,
      trainers,
      trainerMatches: [],
      allowed: false,
    });
    return false;
  }

  const trainerMatches = [
    ...getTrainerMatches(user, trainers),
    ...getTrainerMatches(user, squad?.trainers || []),
  ];
  const memberRoleMatches = getMemberRoleMatches(user, squad);
  const allowed = trainerMatches.length > 0 || memberRoleMatches.length > 0;

  logPermissionDebug({
    check: 'restricted-management',
    user,
    squad,
    trainers,
    trainerMatches: [
      ...trainerMatches,
      ...memberRoleMatches.map((match) => ({ by: match.by, value: `${match.value}:${match.role}` })),
    ],
    allowed,
  });

  return allowed;
}