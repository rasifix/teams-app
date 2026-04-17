import type { Guardian, Player, Trainer } from '../../types';

export interface ExistingGuardianUserOption {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  source: 'trainer' | 'guardian';
}

function toComparableName(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

function isLinkedGuardianUser(guardian: Guardian): boolean {
  if (guardian.userId) {
    return true;
  }

  return !guardian.isDocumentedOnly;
}

export function selectExistingGuardianUsers(players: Player[], trainers: Trainer[]): ExistingGuardianUserOption[] {
  const byId = new Map<string, ExistingGuardianUserOption>();

  trainers.forEach((trainer) => {
    byId.set(trainer.id, {
      id: trainer.id,
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      source: 'trainer',
    });
  });

  players.forEach((player) => {
    (player.guardians || []).forEach((guardian) => {
      if (!isLinkedGuardianUser(guardian)) {
        return;
      }

      const id = guardian.userId || guardian.id;
      const existing = byId.get(id);

      if (existing) {
        if (!existing.email && guardian.email) {
          byId.set(id, {
            ...existing,
            email: guardian.email,
          });
        }
        return;
      }

      byId.set(id, {
        id,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        email: guardian.email,
        source: 'guardian',
      });
    });
  });

  return Array.from(byId.values()).sort((left, right) => {
    const lastNameCompare = toComparableName(left.lastName).localeCompare(toComparableName(right.lastName));
    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }

    const firstNameCompare = toComparableName(left.firstName).localeCompare(toComparableName(right.firstName));
    if (firstNameCompare !== 0) {
      return firstNameCompare;
    }

    return left.id.localeCompare(right.id);
  });
}