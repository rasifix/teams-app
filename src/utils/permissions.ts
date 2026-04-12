import type { User } from '../services/authService';
import type { Trainer } from '../types';
import type { Group } from '../types';

const ELEVATED_GROUP_ROLES = new Set(['admin', 'trainer', 'group_manager', 'coach']);

function logPermissionDebug(payload: {
  check: 'restricted-management';
  user: User | null | undefined;
  group: Group | null | undefined;
  trainers: Array<Pick<Trainer, 'id' | 'email'>>;
  trainerMatches: Array<{ by: 'id' | 'email'; value: string }>;
  allowed: boolean;
}): void {
  const {
    check,
    user,
    group,
    trainers,
    trainerMatches,
    allowed,
  } = payload;

  console.info('[permissions]', {
    check,
    allowed,
    userId: user?.id,
    email: user?.email,
    groupId: group?.id,
    groupTrainerIds: (group?.trainers || []).map((trainer) => trainer.id),
    groupTrainerEmails: (group?.trainers || []).map((trainer) => trainer.email).filter(Boolean),
    loadedTrainerIds: trainers.map((trainer) => trainer.id),
    loadedTrainerEmails: trainers.map((trainer) => trainer.email).filter(Boolean),
    groupMembers: (group?.members || []).map((member) => ({
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

function getMemberRoleMatches(user: User, group: Group | null | undefined): Array<{ by: 'id' | 'email'; value: string; role: string }> {
  if (!group?.members?.length) {
    return [];
  }

  const normalizedEmail = normalizeEmail(user.email);

  return group.members.flatMap((member) => {
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
    group?: Group | null;
    trainers?: Array<Pick<Trainer, 'id' | 'email'>>;
  },
): boolean {
  const { group, trainers = [] } = options;

  if (!user) {
    logPermissionDebug({
      check: 'restricted-management',
      user,
      group,
      trainers,
      trainerMatches: [],
      allowed: false,
    });
    return false;
  }

  const trainerMatches = [
    ...getTrainerMatches(user, trainers),
    ...getTrainerMatches(user, group?.trainers || []),
  ];
  const memberRoleMatches = getMemberRoleMatches(user, group);
  const allowed = trainerMatches.length > 0 || memberRoleMatches.length > 0;

  logPermissionDebug({
    check: 'restricted-management',
    user,
    group,
    trainers,
    trainerMatches: [
      ...trainerMatches,
      ...memberRoleMatches.map((match) => ({ by: match.by, value: `${match.value}:${match.role}` })),
    ],
    allowed,
  });

  return allowed;
}