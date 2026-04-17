import type { Guardian, Player } from '../../types';

export interface MemberGuardianRow {
  playerId: string;
  playerFirstName: string;
  playerLastName: string;
  guardian: Guardian;
}

export interface MemberGuardianCard {
  guardian: Guardian;
  playerRefs: Array<{
    playerId: string;
    playerFirstName: string;
    playerLastName: string;
  }>;
  primaryPlayerId: string;
  primaryPlayerFirstName: string;
  primaryPlayerLastName: string;
}

function toComparableName(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

export function selectMemberGuardians(players: Player[]): MemberGuardianRow[] {
  return players
    .flatMap((player) => (
      (player.guardians || []).map((guardian) => ({
        playerId: player.id,
        playerFirstName: player.firstName,
        playerLastName: player.lastName,
        guardian,
      }))
    ))
    .sort((left, right) => {
      const guardianLastNameCompare = toComparableName(left.guardian.lastName)
        .localeCompare(toComparableName(right.guardian.lastName));
      if (guardianLastNameCompare !== 0) {
        return guardianLastNameCompare;
      }

      const guardianFirstNameCompare = toComparableName(left.guardian.firstName)
        .localeCompare(toComparableName(right.guardian.firstName));
      if (guardianFirstNameCompare !== 0) {
        return guardianFirstNameCompare;
      }

      const playerLastNameCompare = toComparableName(left.playerLastName)
        .localeCompare(toComparableName(right.playerLastName));
      if (playerLastNameCompare !== 0) {
        return playerLastNameCompare;
      }

      return toComparableName(left.playerFirstName)
        .localeCompare(toComparableName(right.playerFirstName));
    });
}

export function selectUniqueMemberGuardians(players: Player[]): MemberGuardianCard[] {
  const grouped = new Map<string, MemberGuardianCard>();

  selectMemberGuardians(players).forEach((row) => {
    const guardianKey = row.guardian.userId || row.guardian.id;
    const existing = grouped.get(guardianKey);

    if (!existing) {
      grouped.set(guardianKey, {
        guardian: row.guardian,
        playerRefs: [{
          playerId: row.playerId,
          playerFirstName: row.playerFirstName,
          playerLastName: row.playerLastName,
        }],
        primaryPlayerId: row.playerId,
        primaryPlayerFirstName: row.playerFirstName,
        primaryPlayerLastName: row.playerLastName,
      });
      return;
    }

    const hasPlayerRef = existing.playerRefs.some((playerRef) => playerRef.playerId === row.playerId);
    if (!hasPlayerRef) {
      existing.playerRefs.push({
        playerId: row.playerId,
        playerFirstName: row.playerFirstName,
        playerLastName: row.playerLastName,
      });
    }
  });

  return Array.from(grouped.values()).map((entry) => ({
    ...entry,
    playerRefs: [...entry.playerRefs].sort((left, right) => {
      const playerLastNameCompare = toComparableName(left.playerLastName)
        .localeCompare(toComparableName(right.playerLastName));
      if (playerLastNameCompare !== 0) {
        return playerLastNameCompare;
      }

      return toComparableName(left.playerFirstName)
        .localeCompare(toComparableName(right.playerFirstName));
    }),
  }));
}
