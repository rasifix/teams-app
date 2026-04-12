import type { Guardian, Player } from '../types';
import type { User } from '../services/authService';
import type { Group } from '../types';

const DEFAULT_UNDERAGE_LIMIT = 18;

function toComparableName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function getPlayerAge(player: Pick<Player, 'birthDate' | 'birthYear'>, referenceDate: Date = new Date()): number {
  if (player.birthDate) {
    const birth = new Date(player.birthDate);
    if (Number.isNaN(birth.getTime())) {
      return referenceDate.getFullYear() - player.birthYear;
    }

    let age = referenceDate.getFullYear() - birth.getFullYear();
    const monthDiff = referenceDate.getMonth() - birth.getMonth();
    const dayDiff = referenceDate.getDate() - birth.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    return age;
  }

  return referenceDate.getFullYear() - player.birthYear;
}

export function isPlayerUnderage(player: Pick<Player, 'birthDate' | 'birthYear'>, ageLimit: number = DEFAULT_UNDERAGE_LIMIT): boolean {
  return getPlayerAge(player) < ageLimit;
}

export function hasDuplicateGuardian(existingGuardians: Guardian[] | undefined, candidate: Pick<Guardian, 'id' | 'firstName' | 'lastName' | 'email' | 'userId' | 'isDocumentedOnly'>): boolean {
  if (!existingGuardians || existingGuardians.length === 0) {
    return false;
  }

  if (candidate.userId) {
    return existingGuardians.some((guardian) => (
      guardian.userId === candidate.userId ||
      guardian.id === candidate.userId ||
      (!!candidate.email && !!guardian.email && guardian.email.toLowerCase() === candidate.email.toLowerCase())
    ));
  }

  if (candidate.isDocumentedOnly) {
    const candidateName = `${toComparableName(candidate.firstName)}::${toComparableName(candidate.lastName)}`;
    return existingGuardians.some((guardian) => {
      if (!guardian.isDocumentedOnly) {
        return false;
      }
      const guardianName = `${toComparableName(guardian.firstName)}::${toComparableName(guardian.lastName)}`;
      return guardianName === candidateName;
    });
  }

  return existingGuardians.some((guardian) => guardian.id === candidate.id);
}

export function canManageGuardians(user: User | null | undefined, group: Group | null | undefined): boolean {
  if (!user) {
    return false;
  }

  const normalizedEmail = (user.email || '').trim().toLowerCase();

  return (group?.trainers || []).some((trainer) => (
    trainer.id === user.id ||
    ((trainer.email || '').trim().toLowerCase() !== '' && (trainer.email || '').trim().toLowerCase() === normalizedEmail)
  ));
}
