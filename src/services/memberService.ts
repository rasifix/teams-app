import { apiClient } from './apiClient';
import type { Guardian, GroupRole, Player, Trainer } from '../types';

export const MEMBER_ROLE_PLAYER = 'player' as const;
export const MEMBER_ROLE_TRAINER = 'trainer' as const;
export const MEMBER_ROLE_GUARDIAN = 'guardian' as const;
export const REVOCABLE_MEMBER_ROLES: ReadonlyArray<Exclude<GroupRole, 'player'>> = ['admin', 'trainer', 'guardian'];

export interface MembersResponse {
  players: Player[];
  trainers: Trainer[];
}

type Member = Player | Trainer;
type MembersApiResponse = MembersResponse | Member[];

const normalizePlayer = (player: Player): Player => ({
  ...player,
  status: player.status || 'active',
  roles: player.roles || [],
});

const normalizeTrainer = (trainer: Trainer): Trainer => ({
  ...trainer,
  roles: trainer.roles || [],
});

const isMembersResponse = (response: MembersApiResponse): response is MembersResponse => !Array.isArray(response);

const isPlayerMember = (member: Member): member is Player => {
  if (member.roles?.includes('player')) {
    return true;
  }

  return 'birthYear' in member || 'level' in member || 'status' in member;
};

const isTrainerMember = (member: Member): member is Trainer => {
  if (member.roles?.includes('trainer')) {
    return true;
  }

  return !isPlayerMember(member) && (!member.roles || member.roles.length === 0);
};

const normalizeMembersResponse = (response: MembersApiResponse): MembersResponse => {
  if (isMembersResponse(response)) {
    return {
      ...response,
      players: response.players.map(normalizePlayer),
      trainers: response.trainers.map(normalizeTrainer),
    };
  }

  return response.reduce<MembersResponse>(
    (members, member) => {
      if (isPlayerMember(member)) {
        members.players.push(normalizePlayer(member));
      } else if (isTrainerMember(member)) {
        members.trainers.push(normalizeTrainer(member));
      }

      return members;
    },
    { players: [], trainers: [] },
  );
};

export interface MemberUpsertPayload {
  firstName: string;
  lastName: string;
  email?: string;
  birthYear?: number;
  birthDate?: string;
  level?: number;
  status?: Player['status'];
  preferredShirtNumber?: number;
  guardians?: Guardian[];
  roles: GroupRole[];
}

export async function addMember(groupId: string, memberData: MemberUpsertPayload): Promise<Player | Trainer> {
  return apiClient.request<Player | Trainer>(
    apiClient.getGroupEndpoint(groupId, '/members'),
    {
      method: 'POST',
      body: JSON.stringify(memberData)
    }
  );
}

export async function updateMember(groupId: string, id: string, memberData: Partial<MemberUpsertPayload>): Promise<Player | Trainer> {
  return apiClient.request<Player | Trainer>(
    apiClient.getGroupEndpoint(groupId, `/members/${id}`),
    {
      method: 'PUT',
      body: JSON.stringify(memberData)
    }
  );
}

export async function getMemberById(groupId: string, id: string): Promise<Player | Trainer | null> {
  try {
    const member = await apiClient.request<Player | Trainer>(
      apiClient.getGroupEndpoint(groupId, `/members/${id}`)
    );

    const roles = member.roles || [];
    if (roles.includes('player')) {
      return normalizePlayer(member as Player);
    }

    return normalizeTrainer(member as Trainer);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export async function deleteMember(groupId: string, id: string): Promise<void> {
  return apiClient.request<void>(
    apiClient.getGroupEndpoint(groupId, `/members/${id}`),
    { method: 'DELETE' }
  );
}

export async function revokeMemberRole(
  groupId: string,
  id: string,
  role: Exclude<GroupRole, 'player'>
): Promise<Player | Trainer> {
  return apiClient.request<Player | Trainer>(
    apiClient.getGroupEndpoint(groupId, `/members/${id}/roles/${role}`),
    { method: 'DELETE' }
  );
}

// Get all members (players and trainers) in one call
export async function getAllMembers(groupId: string): Promise<MembersResponse> {
  const response = await apiClient.request<MembersApiResponse>(
    apiClient.getGroupEndpoint(groupId, '/members')
  );

  return normalizeMembersResponse(response);
}

// Player-specific operations
export async function getPlayers(groupId: string): Promise<Player[]> {
  const members = await getAllMembers(groupId);

  return members.players;
}

export async function addPlayer(groupId: string, playerData: Omit<Player, 'id'>): Promise<Player> {
  const member = await addMember(groupId, {
    ...playerData,
    roles: Array.from(new Set([...(playerData.roles || []), 'player'])),
    firstName: playerData.firstName,
    lastName: playerData.lastName,
    level: playerData.level,
    status: playerData.status,
    birthYear: playerData.birthYear,
    birthDate: playerData.birthDate,
    preferredShirtNumber: playerData.preferredShirtNumber,
    guardians: playerData.guardians,
    email: undefined,
  }
  );

  return normalizePlayer(member as Player);
}

export async function updatePlayer(groupId: string, id: string, playerData: Partial<Player>): Promise<Player> {
  const member = await updateMember(groupId, id, {
    ...playerData,
    roles: playerData.roles,
  });

  return normalizePlayer(member as Player);
}

export async function deletePlayer(groupId: string, id: string): Promise<void> {
  return deleteMember(groupId, id);
}

export async function getPlayerById(groupId: string, id: string): Promise<Player | null> {
  try {
    const player = await apiClient.request<Player>(
      apiClient.getGroupEndpoint(groupId, `/members/${id}`)
    );

    return normalizePlayer(player);
  } catch (error) {
    // If player not found, return null
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export interface CreateGuardianPayload {
  guardianId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userId?: string;
  trainerId?: string;
}

export async function addGuardianToPlayer(groupId: string, playerId: string, guardianData: CreateGuardianPayload): Promise<Player> {
  const guardianId = guardianData.guardianId || guardianData.userId || guardianData.trainerId;
  if (!guardianId) {
    throw new Error('guardianId is required to link guardian to player');
  }

  return apiClient.request<Player>(
    apiClient.getGroupEndpoint(groupId, `/members/${playerId}/guardians`),
    {
      method: 'POST',
      body: JSON.stringify({ guardianId }),
    }
  );
}

export async function deleteGuardianFromPlayer(groupId: string, playerId: string, guardianId: string): Promise<Player> {
  return apiClient.request<Player>(
    apiClient.getGroupEndpoint(groupId, `/members/${playerId}/guardians/${guardianId}`),
    {
      method: 'DELETE',
    }
  );
}

// Trainer-specific operations
export async function getTrainers(groupId: string): Promise<Trainer[]> {
  const members = await getAllMembers(groupId);

  return members.trainers;
}

export async function addTrainer(groupId: string, trainerData: Omit<Trainer, 'id'>): Promise<Trainer> {
  const member = await addMember(groupId, {
    ...trainerData,
    roles: Array.from(new Set([...(trainerData.roles || []), 'trainer'])),
    firstName: trainerData.firstName,
    lastName: trainerData.lastName,
  });

  return normalizeTrainer(member as Trainer);
}

export async function updateTrainer(groupId: string, id: string, trainerData: Partial<Trainer>): Promise<Trainer> {
  const member = await updateMember(groupId, id, {
    ...trainerData,
    roles: trainerData.roles,
  });

  return normalizeTrainer(member as Trainer);
}

export async function deleteTrainer(groupId: string, id: string): Promise<void> {
  return deleteMember(groupId, id);
}

export async function getTrainerById(groupId: string, id: string): Promise<Trainer | null> {
  try {
    const trainer = await apiClient.request<Trainer>(
      apiClient.getGroupEndpoint(groupId, `/members/${id}`)
    );

    return normalizeTrainer(trainer);
  } catch (error) {
    // If trainer not found, return null
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}