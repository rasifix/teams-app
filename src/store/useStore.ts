
import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Player, Event, Trainer, ShirtSet, Team, Group, Period, CreateGroupRequest, GroupRole } from '../types';
import { getPlayerStats } from '../utils/playerStats';
import {
  getAllMembers,
  getMemberById as getMemberByIdService,
  addMember as addMemberService,
  updateMember as updateMemberService,
  deleteMember as deleteMemberService,
  revokeMemberRole as revokeMemberRoleService,
  addGuardianToPlayer as addGuardianToPlayerService,
  deleteGuardianFromPlayer as deleteGuardianFromPlayerService,
  MEMBER_ROLE_PLAYER,
  MEMBER_ROLE_GUARDIAN,
  MEMBER_ROLE_TRAINER,
} from '../services/memberService';
import { getEvents, addEvent as addEventService, updateEvent as updateEventService, deleteEvent as deleteEventService, updatePlayerInvitationStatus as updatePlayerInvitationStatusService } from '../services/eventService';
import { getShirtSets, addShirtSet as addShirtSetService, updateShirtSet as updateShirtSetService, deleteShirtSet as deleteShirtSetService, addShirtToSet as addShirtToSetService, removeShirtFromSet as removeShirtFromSetService, updateShirt as updateShirtService } from '../services/shirtService';
import { getGroups, getGroup, createGroup as createGroupService, addGroupPeriod as addGroupPeriodService, updateGroupPeriod as updateGroupPeriodService, deleteGroupPeriod as deleteGroupPeriodService } from '../services/groupService';
import { authService } from '../services/authService';
import { setSelectedGroupId, clearSelectedGroupId, setSelectedStatisticsPeriodId, clearSelectedStatisticsPeriodId, getSelectedStatisticsPeriodId } from '../utils/localStorage';
import { canAccessRestrictedManagement, withResolvedGroupPermissions } from '../utils/permissions';
import { mergeMembersFromCollections, selectPlayersFromMembers, selectTrainersFromMembers, type GroupMember } from './selectors/memberSelectors';

// Helper function to sort members alphabetically by lastName + firstName
const sortMembers = (members: GroupMember[]): GroupMember[] => {
  return [...members].sort((a, b) => {
    const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
    const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

// Helper function to sort events by date (earliest first)
const sortEvents = (events: Event[]): Event[] => {
  return [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

function toMembers(players: Player[], trainers: Trainer[]): GroupMember[] {
  return sortMembers(mergeMembersFromCollections(players, trainers));
}

function playersFromMembers(members: GroupMember[]): Player[] {
  return selectPlayersFromMembers(members);
}

function trainersFromMembers(members: GroupMember[]): Trainer[] {
  return selectTrainersFromMembers(members);
}

function upsertMember(members: GroupMember[], member: GroupMember): GroupMember[] {
  const withoutMember = members.filter((entry) => entry.id !== member.id);
  const nextPlayers = playersFromMembers(withoutMember);
  const nextTrainers = trainersFromMembers(withoutMember);

  if ('birthYear' in member || member.roles?.includes('player')) {
    nextPlayers.push(member as Player);
  }

  if (!('birthYear' in member) || member.roles?.includes('trainer')) {
    nextTrainers.push(member as Trainer);
  }

  return toMembers(nextPlayers, nextTrainers);
};

// Helper function to sort shirt sets by sponsor, then by color
const sortShirtSets = (shirtSets: ShirtSet[]): ShirtSet[] => {
  return [...shirtSets].sort((a, b) => {
    // First sort by sponsor (ascending - alphabetical)
    const sponsorCompare = a.sponsor.toLowerCase().localeCompare(b.sponsor.toLowerCase());
    if (sponsorCompare !== 0) {
      return sponsorCompare;
    }
    // Then sort by color (ascending - alphabetical)
    return a.color.toLowerCase().localeCompare(b.color.toLowerCase());
  });
};

const sortPeriods = (periods: Period[]): Period[] => {
  return [...periods].sort((a, b) => {
    const startDateCompare = a.startDate.localeCompare(b.startDate);
    if (startDateCompare !== 0) {
      return startDateCompare;
    }

    const endDateCompare = a.endDate.localeCompare(b.endDate);
    if (endDateCompare !== 0) {
      return endDateCompare;
    }

    return a.name.localeCompare(b.name);
  });
};

const sortGroups = (groups: Group[]): Group[] => {
  return [...groups].sort((a, b) => a.name.localeCompare(b.name));
};

const EMPTY_PERIODS: Period[] = [];

function dedupeGuardians(guardians: import('../types').Guardian[]): import('../types').Guardian[] {
  const seenKeys = new Set<string>();

  return guardians.filter((guardian) => {
    const key = guardian.userId || guardian.id || `${(guardian.email || '').toLowerCase()}::${(guardian.firstName || '').toLowerCase()}::${(guardian.lastName || '').toLowerCase()}`;
    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function isMatchingGuardian(guardian: import('../types').Guardian, guardianId: string): boolean {
  return guardian.id === guardianId || guardian.userId === guardianId;
}

function mergeGroupMember(group: Group | null, member: GroupMember | null): Group | null {
  if (!group || !member) {
    return group;
  }

  const nextMember = {
    id: member.id,
    email: 'email' in member ? member.email : undefined,
    roles: member.roles || [],
  };

  return {
    ...group,
    members: [
      ...(group.members || []).filter((existingMember) => existingMember.id !== member.id),
      nextMember,
    ],
  };
}

const PLAYER_DELETE_ROLE_CONSTRAINT = 'PLAYER_DELETE_ROLE_CONSTRAINT';
export const PLAYER_DELETE_ROLE_CONSTRAINT_ERROR_MESSAGE = PLAYER_DELETE_ROLE_CONSTRAINT;

function getUniqueRoles(roles: GroupRole[] | undefined): GroupRole[] {
  return Array.from(new Set(roles || []));
}

interface AppState {
  // Data
  group: Group | null;
  groups: Group[];
  selectedStatisticsPeriodId: string | null;
  members: GroupMember[];
  events: Event[];
  shirtSets: ShirtSet[];
  
  // Loading states
  loading: {
    group: boolean;
    groups: boolean;
    players: boolean;
    events: boolean;
    trainers: boolean;
    shirtSets: boolean;
  };
  
  // Error states
  errors: {
    group: string | null;
    groups: string | null;
    players: string | null;
    events: string | null;
    trainers: string | null;
    shirtSets: string | null;
  };
  
  // Initialization tracking
  isInitialized: boolean;
  
  // Actions
  loadGroups: () => Promise<void>;
  addGroup: (groupData: CreateGroupRequest) => Promise<Group | null>;
  selectGroup: (groupId: string) => Promise<void>;
  selectStatisticsPeriod: (periodId: string | null) => void;
  initializeApp: () => Promise<void>;
  clearAuthenticatedData: () => void;
  setMembers: (members: GroupMember[]) => void;
  setEvents: (events: Event[]) => void;
  setShirtSets: (shirtSets: ShirtSet[]) => void;
  
  // Player mutations
  addPlayer: (playerData: Omit<Player, 'id'>) => Promise<boolean>;
  updatePlayer: (id: string, playerData: Partial<Player>) => Promise<boolean>;
  deletePlayer: (id: string) => Promise<boolean>;
  addGuardianToPlayer: (playerId: string, guardianData: import('../services/memberService').CreateGuardianPayload) => Promise<boolean>;
  deleteGuardianFromPlayer: (playerId: string, guardianId: string) => Promise<boolean>;
  editGuardianForPlayer: (
    playerId: string,
    guardianId: string,
    guardianData: Pick<import('../types').Guardian, 'firstName' | 'lastName' | 'email'>,
    previousGuardianData: Pick<import('../types').Guardian, 'firstName' | 'lastName' | 'email'>
  ) => Promise<boolean>;
  mergeGuardianDuplicates: (sourceGuardianId: string, targetGuardianId: string) => Promise<boolean>;
  
  // Event mutations
  addEvent: (eventData: Omit<Event, 'id'>) => Promise<boolean>;
  updateEvent: (id: string, eventData: Partial<Event>) => Promise<boolean>;
  updateInvitationStatus: (eventId: string, playerId: string, status: import('../types').InvitationStatus) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  
  // Trainer mutations
  addTrainer: (trainerData: Omit<Trainer, 'id'>) => Promise<boolean>;
  updateTrainer: (id: string, trainerData: Partial<Trainer>) => Promise<boolean>;
  deleteTrainer: (id: string) => Promise<boolean>;
  assignTrainerRole: (id: string) => Promise<boolean>;
  mergeGuardianIntoTrainer: (guardianId: string, trainerId: string) => Promise<boolean>;
  
  // Shirt set mutations
  addShirtSet: (shirtSetData: Omit<ShirtSet, 'id'>) => Promise<ShirtSet | null>;
  updateShirtSet: (id: string, shirtSetData: Partial<ShirtSet>) => Promise<boolean>;
  deleteShirtSet: (id: string) => Promise<boolean>;
  addShirtToSet: (shirtSetId: string, shirtData: import('../types').Shirt) => Promise<import('../types').Shirt | null>;
  removeShirtFromSet: (shirtSetId: string, shirtNumber: number) => Promise<boolean>;
  updateShirt: (shirtSetId: string, updatedShirt: import('../types').Shirt) => Promise<boolean>;

  // Group period mutations
  addGroupPeriod: (periodData: Omit<Period, 'id'>) => Promise<Period | null>;
  updateGroupPeriod: (periodId: string, periodData: Omit<Period, 'id'>) => Promise<boolean>;
  deleteGroupPeriod: (periodId: string) => Promise<boolean>;
  
  // Selectors (computed values)
  getPlayerById: (id: string) => Player | undefined;
  getEventById: (id: string) => Event | undefined;
  getTrainerById: (id: string) => Trainer | undefined;
  getShirtSetById: (id: string) => ShirtSet | undefined;
  getPlayerStats: (playerId: string, excludeEventId?: string) => ReturnType<typeof getPlayerStats>;
  getTrainerEventHistory: (trainerId: string) => Array<{
    eventId: string;
    eventName: string;
    eventDate: string;
    startTime?: string;
    location?: string;
    teamName?: string;
    teamStrength: number;
  }>;
  getTeamAverageLevel: (team: Team) => number;
}

export const useStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      group: null,
      groups: [],
      selectedStatisticsPeriodId: null,
      members: [],
      events: [],
      shirtSets: [],
      isInitialized: false,
      loading: {
        group: false,
        groups: false,
        players: false,
        events: false,
        trainers: false,
        shirtSets: false,
      },
      errors: {
        group: null,
        groups: null,
        players: null,
        events: null,
        trainers: null,
        shirtSets: null,
      },
      
      // Actions
      initializeApp: async () => {
        const state = get();
        const selectedGroup = get().group;

        if (!selectedGroup) {
          throw new Error('No group selected');
        }

        const currentGroup = selectedGroup;

        let currentUser: import('../services/authService').User | null = null;
        try {
          currentUser = await authService.getCurrentUser();
        } catch (error) {
          console.warn('Failed to resolve current user for app initialization:', error);
        }
        
        // Set all loading states
        set({
          loading: {
            group: true,
            groups: true,
            players: true,
            events: true,
            trainers: true,
            shirtSets: false,
          },
          errors: {
            group: null,
            groups: null,
            players: null,
            events: null,
            trainers: null,
            shirtSets: null,
          },
        });
        
        // Load all data in parallel
        const loadData = async () => {
          const results = await Promise.allSettled([
            getGroup(currentGroup.id).then((group) => ({ type: 'group' as const, data: group })),
            getAllMembers(currentGroup.id).then((members) => ({ type: 'members' as const, data: members })),
            getEvents(currentGroup.id).then((events: Event[]) => ({ type: 'events' as const, data: events })),
          ]);
          
          const newState: {
            loading: AppState['loading'];
            errors: AppState['errors'];
            group: Group | null;
            groups: Group[];
            selectedStatisticsPeriodId: string | null;
            members: GroupMember[];
            events: Event[];
            shirtSets: ShirtSet[];
          } = {
            loading: {
              group: false,
              groups: false,
              players: false,
              events: false,
              trainers: false,
              shirtSets: false,
            },
            errors: {
              group: null,
              groups: null,
              players: null,
              events: null,
              trainers: null,
              shirtSets: null,
            },
            group: state.group,
            groups: state.groups,
            selectedStatisticsPeriodId: state.selectedStatisticsPeriodId,
            members: state.members,
            events: state.events,
            shirtSets: state.shirtSets,
          };
          
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              const { type } = result.value;
              if (type === 'group') {
                const resolvedGroup = withResolvedGroupPermissions(result.value.data, [get().group, newState.group]) || result.value.data;
                newState.group = {
                  ...resolvedGroup,
                  periods: sortPeriods(resolvedGroup?.periods ?? []),
                };
              } else if (type === 'members') {
                const membersData = result.value.data as { players: Player[], trainers: Trainer[] };
                newState.members = toMembers(membersData.players, membersData.trainers);
              } else if (type === 'events') {
                newState.events = sortEvents(result.value.data);
              }
            } else {
              // Map index to appropriate error handling
              if (index === 0) {
                // Group call failed - log warning but don't treat as fatal error
                console.warn('Failed to load group:', result.reason?.message || 'Unknown error');
                newState.errors.group = result.reason?.message || 'Failed to load group';
              } else if (index === 1) {
                // Members call failed - set error for both players and trainers
                newState.errors.players = result.reason?.message || 'Failed to load members';
                newState.errors.trainers = result.reason?.message || 'Failed to load members';
              } else if (index === 2) {
                // Events call failed
                newState.errors.events = result.reason?.message || 'Failed to load events';
              }
            }
          });

          if (currentUser && newState.group) {
            try {
              const currentUserMember = await getMemberByIdService(newState.group.id, currentUser.id);
              newState.group = mergeGroupMember(newState.group, currentUserMember);
            } catch (error) {
              console.warn('Failed to load current user member for permissions:', error);
            }
          }

          const shouldLoadShirtSets = canAccessRestrictedManagement(currentUser, {
            group: newState.group,
            trainers: trainersFromMembers(newState.members),
          });

          if (shouldLoadShirtSets) {
            set({
              loading: {
                ...get().loading,
                shirtSets: true,
              },
            });

            try {
              const shirtSets = await getShirtSets(currentGroup.id);
              newState.shirtSets = sortShirtSets(shirtSets);
            } catch (error) {
              newState.errors.shirtSets = error instanceof Error ? error.message : 'Failed to load shirt sets';
            }
          }

          if (
            newState.selectedStatisticsPeriodId &&
            !newState.group?.periods.some((period) => period.id === newState.selectedStatisticsPeriodId)
          ) {
            newState.selectedStatisticsPeriodId = null;
          }
          
          set({ ...newState, isInitialized: true });
        };

        await loadData();
      },
      
      clearAuthenticatedData: () => {
        clearSelectedGroupId();
        clearSelectedStatisticsPeriodId();
        set({
          group: null,
          groups: [],
          selectedStatisticsPeriodId: null,
          members: [],
          events: [],
          shirtSets: [],
          isInitialized: false,
          loading: {
            group: false,
            groups: false,
            players: false,
            events: false,
            trainers: false,
            shirtSets: false,
          },
          errors: {
            group: null,
            groups: null,
            players: null,
            events: null,
            trainers: null,
            shirtSets: null,
          },
        });
      },
      
      loadGroups: async () => {
        set({ loading: { ...get().loading, groups: true }, errors: { ...get().errors, groups: null } });
        
        try {
          const groups = await getGroups();
          set({ groups: sortGroups(groups), loading: { ...get().loading, groups: false } });
        } catch (error) {
          console.error('Failed to load groups:', error);
          set({ 
            loading: { ...get().loading, groups: false }, 
            errors: { ...get().errors, groups: error instanceof Error ? error.message : 'Failed to load groups' }
          });
        }
      },

      addGroup: async (groupData) => {
        set({ loading: { ...get().loading, groups: true }, errors: { ...get().errors, groups: null } });

        try {
          const newGroup = await createGroupService(groupData);
          const updatedGroups = sortGroups([...get().groups, newGroup]);
          set({
            groups: updatedGroups,
            loading: { ...get().loading, groups: false },
          });
          return newGroup;
        } catch (error) {
          console.error('Failed to add group:', error);
          set({
            loading: { ...get().loading, groups: false },
            errors: { ...get().errors, groups: error instanceof Error ? error.message : 'Failed to add group' },
          });
          return null;
        }
      },
      
      selectGroup: async (groupId: string) => {
        const groups = get().groups;
        const selectedGroup = groups.find(g => g.id === groupId);
        
        let group: Group;
        try {
          group = await getGroup(groupId);
        } catch (error) {
          console.error('Failed to fetch group:', error);
          if (selectedGroup) {
            group = selectedGroup;
          } else {
            // Fallback to minimal group object
            group = { id: groupId, name: `Group ${groupId}`, periods: [] };
          }
        }
        
        const sortedPeriods = sortPeriods(group.periods ?? []);
        const savedPeriodId = getSelectedStatisticsPeriodId();
        const isValidSavedPeriod = savedPeriodId && sortedPeriods.some((period) => period.id === savedPeriodId);
        
        const resolvedGroup = withResolvedGroupPermissions(group, [selectedGroup, get().group]) || group;

        set({
          group: {
            ...resolvedGroup,
            periods: sortedPeriods,
          },
          selectedStatisticsPeriodId: isValidSavedPeriod ? savedPeriodId : null,
        });
        setSelectedGroupId(groupId);
      },

      selectStatisticsPeriod: (periodId) => {
        set({ selectedStatisticsPeriodId: periodId });
        setSelectedStatisticsPeriodId(periodId);
      },
      
      // Actions
      setMembers: (members) => set({ members: sortMembers(members) }),
      setEvents: (events) => set({ events: sortEvents(events) }),
      setShirtSets: (shirtSets) => set({ shirtSets: sortShirtSets(shirtSets) }),
      
      // Player mutations
      addPlayer: async (playerData) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          const newPlayer = await addMemberService(currentGroup.id, {
            ...playerData,
            roles: Array.from(new Set([...(playerData.roles || []), 'player'])),
            firstName: playerData.firstName,
            lastName: playerData.lastName,
          }) as Player;
          const updatedMembers = upsertMember(get().members, newPlayer);
          set({ members: updatedMembers });
          return true;
        } catch (error) {
          console.error('Failed to add player:', error);
          return false;
        }
      },
      
      updatePlayer: async (id, playerData) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          const currentPlayer = playersFromMembers(get().members).find((player) => player.id === id);
          const updatedPlayer = await updateMemberService(currentGroup.id, id, {
            ...playerData,
            roles: Array.from(new Set([...(currentPlayer?.roles || []), ...(playerData.roles || []), 'player'])),
          }) as Player;
          const updatedMembers = upsertMember(get().members, updatedPlayer);
          set({ members: updatedMembers });
          return true;
        } catch (error) {
          console.error('Failed to update player:', error);
          return false;
        }
      },
      
      deletePlayer: async (id) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          const member = await getMemberByIdService(currentGroup.id, id);
          if (!member) {
            return false;
          }

          const roles = getUniqueRoles(member.roles);
          const canDeletePlayer = roles.length === 1 && roles[0] === MEMBER_ROLE_PLAYER;
          if (!canDeletePlayer) {
            throw new Error(PLAYER_DELETE_ROLE_CONSTRAINT);
          }

          await deleteMemberService(currentGroup.id, id);
          const refreshedMembers = await getAllMembers(currentGroup.id);
          set({ members: toMembers(refreshedMembers.players, refreshedMembers.trainers) });
          return true;
        } catch (error) {
          console.error('Failed to delete player:', error);
          if (error instanceof Error && error.message === PLAYER_DELETE_ROLE_CONSTRAINT) {
            throw error;
          }
          return false;
        }
      },

      addGuardianToPlayer: async (playerId, guardianData) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');

        try {
          const existingGuardianId = guardianData.guardianId || guardianData.userId || guardianData.trainerId;
          let ensuredGuardianMember: GroupMember | null = null;

          let guardianIdToLink = existingGuardianId;
          if (!guardianIdToLink) {
            if (!guardianData.firstName || !guardianData.lastName) {
              throw new Error('firstName and lastName are required to create a new guardian');
            }

            const newGuardianMember = await addMemberService(currentGroup.id, {
              firstName: guardianData.firstName,
              lastName: guardianData.lastName,
              email: guardianData.email,
              roles: ['guardian'],
            });

            guardianIdToLink = newGuardianMember.id;
          } else {
            const existingGuardianMember = await getMemberByIdService(currentGroup.id, guardianIdToLink);
            if (!existingGuardianMember) {
              return false;
            }

            const existingRoles = getUniqueRoles(existingGuardianMember.roles);
            if (!existingRoles.includes(MEMBER_ROLE_GUARDIAN)) {
              ensuredGuardianMember = await updateMemberService(currentGroup.id, guardianIdToLink, {
                ...existingGuardianMember,
                roles: Array.from(new Set<GroupRole>([...existingRoles, MEMBER_ROLE_GUARDIAN])),
              }) as GroupMember;
            } else {
              ensuredGuardianMember = existingGuardianMember as GroupMember;
            }
          }

          const updatedPlayer = await addGuardianToPlayerService(currentGroup.id, playerId, {
            guardianId: guardianIdToLink,
          });

          const currentPlayers = playersFromMembers(get().members);
          const updatedPlayers = currentPlayers.map((player) =>
            player.id === playerId ? { ...player, ...updatedPlayer } : player
          );

          if (!existingGuardianId) {
            const refreshedMembers = await getAllMembers(currentGroup.id);
            const mergedMembers = toMembers(updatedPlayers, refreshedMembers.trainers);
            set({ members: mergedMembers });
            return true;
          }

          const currentTrainers = trainersFromMembers(get().members);
          const nextMembers = ensuredGuardianMember
            ? upsertMember(toMembers(updatedPlayers, currentTrainers), ensuredGuardianMember)
            : toMembers(updatedPlayers, currentTrainers);
          set({
            members: nextMembers,
            group: mergeGroupMember(get().group, ensuredGuardianMember),
          });
          return true;
        } catch (error) {
          console.error('Failed to add guardian to player:', error);
          return false;
        }
      },

      deleteGuardianFromPlayer: async (playerId, guardianId) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');

        try {
          const updatedPlayer = await deleteGuardianFromPlayerService(currentGroup.id, playerId, guardianId);
          const currentPlayers = playersFromMembers(get().members);
          const updatedPlayers = currentPlayers.map((player) =>
            player.id === playerId
              ? {
                  ...player,
                  ...updatedPlayer,
                  // Keep UI in sync immediately even if API omits guardians in response.
                  guardians: dedupeGuardians(
                    ((updatedPlayer as Partial<Player>).guardians ?? player.guardians ?? []).filter(
                      (guardian) => !isMatchingGuardian(guardian, guardianId)
                    )
                  ),
                }
              : player
          );

          const guardianMember = await getMemberByIdService(currentGroup.id, guardianId);
          const guardianRoles = getUniqueRoles(guardianMember?.roles);
          if (guardianMember && guardianRoles.length === 0) {
            await deleteMemberService(currentGroup.id, guardianId);
            const refreshedMembers = await getAllMembers(currentGroup.id);
            set({ members: toMembers(refreshedMembers.players, refreshedMembers.trainers) });
            return true;
          }

          const currentTrainers = trainersFromMembers(get().members);
          set({ members: toMembers(updatedPlayers, currentTrainers) });
          return true;
        } catch (error) {
          console.error('Failed to delete guardian from player:', error);
          return false;
        }
      },

      editGuardianForPlayer: async (playerId, guardianId, guardianData, previousGuardianData) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');

        try {
          const existingGuardianMember = await getMemberByIdService(currentGroup.id, guardianId);
          if (!existingGuardianMember) {
            return false;
          }

          const nextRoles = Array.from(new Set<GroupRole>([...(existingGuardianMember.roles || []), 'guardian']));
          await updateMemberService(currentGroup.id, guardianId, {
            ...existingGuardianMember,
            firstName: guardianData.firstName,
            lastName: guardianData.lastName,
            email: guardianData.email,
            roles: nextRoles,
          });

          const refreshedMembers = await getAllMembers(currentGroup.id);
          set({ members: toMembers(refreshedMembers.players, refreshedMembers.trainers) });
          return true;
        } catch (error) {
          console.error('Failed to edit guardian member:', error, previousGuardianData, playerId);
          return false;
        }
      },

      mergeGuardianDuplicates: async (sourceGuardianId, targetGuardianId) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');

        if (sourceGuardianId === targetGuardianId) {
          return true;
        }

        const currentMembers = get().members;
        const currentPlayers = playersFromMembers(currentMembers);

        const targetGuardianTemplate = currentPlayers
          .flatMap((player) => player.guardians || [])
          .find((guardian) => isMatchingGuardian(guardian, targetGuardianId));

        if (!targetGuardianTemplate) {
          return false;
        }

        let targetGuardianIdToUse = targetGuardianId;
        let ensuredTargetMember: GroupMember | null = null;

        try {
          const targetMember = await getMemberByIdService(currentGroup.id, targetGuardianId);
          if (!targetMember) {
            const createdTargetGuardian = await addMemberService(currentGroup.id, {
              firstName: targetGuardianTemplate.firstName,
              lastName: targetGuardianTemplate.lastName,
              email: targetGuardianTemplate.email,
              roles: [MEMBER_ROLE_GUARDIAN],
            });

            targetGuardianIdToUse = createdTargetGuardian.id;
            ensuredTargetMember = createdTargetGuardian as GroupMember;
          } else {
            const targetRoles = getUniqueRoles(targetMember.roles);
            if (!targetRoles.includes(MEMBER_ROLE_GUARDIAN)) {
              ensuredTargetMember = await updateMemberService(currentGroup.id, targetGuardianId, {
                ...targetMember,
                roles: Array.from(new Set<GroupRole>([...targetRoles, MEMBER_ROLE_GUARDIAN])),
              }) as GroupMember;
            } else {
              ensuredTargetMember = targetMember as GroupMember;
            }
          }

          const playersToUpdate = currentPlayers.filter((player) =>
            (player.guardians || []).some((guardian) => isMatchingGuardian(guardian, sourceGuardianId))
          );

          if (playersToUpdate.length === 0) {
            return true;
          }

          let nextPlayers = currentPlayers;

          for (const player of playersToUpdate) {
            let workingPlayer = nextPlayers.find((entry) => entry.id === player.id) || player;
            const currentGuardiansForPlayer = workingPlayer.guardians || [];
            const hasTargetGuardian = currentGuardiansForPlayer.some((guardian) =>
              isMatchingGuardian(guardian, targetGuardianIdToUse)
            );

            if (!hasTargetGuardian) {
              const playerAfterAdd = await addGuardianToPlayerService(currentGroup.id, player.id, {
                guardianId: targetGuardianIdToUse,
              });

              nextPlayers = nextPlayers.map((entry) =>
                entry.id === player.id ? { ...entry, ...playerAfterAdd } : entry
              );
              workingPlayer = playerAfterAdd;
            }

            const guardiansToRemove = (workingPlayer.guardians || [])
              .filter((guardian) => isMatchingGuardian(guardian, sourceGuardianId))
              .filter((guardian) => !isMatchingGuardian(guardian, targetGuardianIdToUse));

            for (const guardian of guardiansToRemove) {
              const playerAfterRemove = await deleteGuardianFromPlayerService(currentGroup.id, player.id, guardian.id);
              nextPlayers = nextPlayers.map((entry) =>
                entry.id === player.id ? { ...entry, ...playerAfterRemove } : entry
              );
              workingPlayer = playerAfterRemove;
            }

            const normalizedWorkingPlayer = {
              ...workingPlayer,
              guardians: dedupeGuardians(workingPlayer.guardians || []),
            };
            nextPlayers = nextPlayers.map((entry) =>
              entry.id === player.id ? normalizedWorkingPlayer : entry
            );
          }

          const currentTrainers = trainersFromMembers(get().members);
          const baseMembers = toMembers(nextPlayers, currentTrainers);
          const nextMembers = ensuredTargetMember
            ? upsertMember(baseMembers, ensuredTargetMember)
            : baseMembers;

          set({
            members: nextMembers,
            group: mergeGroupMember(get().group, ensuredTargetMember),
          });

          return true;
        } catch (error) {
          console.error('Failed to merge duplicate guardians:', error);
          return false;
        }
      },
      
      // Event mutations
      addEvent: async (eventData) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          const newEvent = await addEventService(currentGroup.id, eventData);
          const currentEvents = get().events;
          const updatedEvents = [...currentEvents, newEvent];
          set({ events: sortEvents(updatedEvents) });
          return true;
        } catch (error) {
          console.error('Failed to add event:', error);
          return false;
        }
      },
      
      updateEvent: async (id, eventData) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          const updatedEvent = await updateEventService(currentGroup.id, id, eventData);
          const currentEvents = get().events;
          const updatedEvents = currentEvents.map(event => 
            event.id === id ? { ...event, ...updatedEvent } : event
          );
          set({ events: sortEvents(updatedEvents) });
          return true;
        } catch (error) {
          console.error('Failed to update event:', error);
          return false;
        }
      },

      updateInvitationStatus: async (eventId, playerId, status) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');

        try {
          const updatedEvent = await updatePlayerInvitationStatusService(currentGroup.id, eventId, playerId, status);
          const currentEvents = get().events;
          const updatedEvents = currentEvents.map((event) =>
            event.id === eventId ? { ...event, ...updatedEvent } : event
          );
          set({ events: sortEvents(updatedEvents) });
          return true;
        } catch (error) {
          console.error('Failed to update invitation status:', error);
          return false;
        }
      },
      
      deleteEvent: async (id) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          await deleteEventService(currentGroup.id, id);
          const currentEvents = get().events;
          const filteredEvents = currentEvents.filter(event => event.id !== id);
          set({ events: sortEvents(filteredEvents) });
          return true;
        } catch (error) {
          console.error('Failed to delete event:', error);
          return false;
        }
      },
      
      // Trainer mutations
      addTrainer: async (trainerData) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          const newTrainer = await addMemberService(currentGroup.id, {
            ...trainerData,
            roles: Array.from(new Set([...(trainerData.roles || []), 'trainer'])),
            firstName: trainerData.firstName,
            lastName: trainerData.lastName,
          }) as Trainer;
          const updatedMembers = upsertMember(get().members, newTrainer);
          set({ members: updatedMembers });
          return true;
        } catch (error) {
          console.error('Failed to add trainer:', error);
          return false;
        }
      },
      
      updateTrainer: async (id, trainerData) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          const currentTrainer = trainersFromMembers(get().members).find((trainer) => trainer.id === id);
          const updatedTrainer = await updateMemberService(currentGroup.id, id, {
            ...trainerData,
            roles: Array.from(new Set([...(currentTrainer?.roles || []), ...(trainerData.roles || []), 'trainer'])),
          }) as Trainer;
          const updatedMembers = upsertMember(get().members, updatedTrainer);
          set({ members: updatedMembers });
          return true;
        } catch (error) {
          console.error('Failed to update trainer:', error);
          return false;
        }
      },

      deleteTrainer: async (id) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          const member = await getMemberByIdService(currentGroup.id, id);
          if (!member) {
            return false;
          }

          const roles = getUniqueRoles(member.roles);
          const hasTrainerRole = roles.includes(MEMBER_ROLE_TRAINER);
          if (!hasTrainerRole) {
            return false;
          }

          const isAssignedAsGuardian = playersFromMembers(get().members).some((player) =>
            (player.guardians || []).some((guardian) => isMatchingGuardian(guardian, id))
          );

          if (roles.length === 1 && !isAssignedAsGuardian) {
            await deleteMemberService(currentGroup.id, id);
          } else {
            await revokeMemberRoleService(currentGroup.id, id, MEMBER_ROLE_TRAINER);
          }

          const refreshedMembers = await getAllMembers(currentGroup.id);
          set({ members: toMembers(refreshedMembers.players, refreshedMembers.trainers) });
          return true;
        } catch (error) {
          console.error('Failed to delete trainer:', error);
          return false;
        }
      },

      assignTrainerRole: async (id) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');

        try {
          const member = await getMemberByIdService(currentGroup.id, id);
          if (!member) {
            return false;
          }

          const roles = getUniqueRoles(member.roles);
          if (roles.includes(MEMBER_ROLE_TRAINER)) {
            return true;
          }

          await updateMemberService(currentGroup.id, id, {
            ...member,
            roles: Array.from(new Set<GroupRole>([...roles, MEMBER_ROLE_TRAINER])),
          });

          const refreshedMembers = await getAllMembers(currentGroup.id);
          set({ members: toMembers(refreshedMembers.players, refreshedMembers.trainers) });
          return true;
        } catch (error) {
          console.error('Failed to assign trainer role:', error);
          return false;
        }
      },

      mergeGuardianIntoTrainer: async (guardianId, trainerId) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');

        const currentMembers = get().members;
        const currentTrainers = trainersFromMembers(currentMembers);
        const currentPlayers = playersFromMembers(currentMembers);

        const targetTrainer = currentTrainers.find((trainer) => trainer.id === trainerId);
        if (!targetTrainer) {
          return false;
        }

        const playersToUpdate = currentPlayers.filter((player) =>
          (player.guardians || []).some((guardian) => isMatchingGuardian(guardian, guardianId))
        );

        if (playersToUpdate.length === 0) {
          return true;
        }

        let nextPlayers = currentPlayers;

        try {
          for (const player of playersToUpdate) {
            let workingPlayer = nextPlayers.find((entry) => entry.id === player.id) || player;
            const currentGuardiansForPlayer = workingPlayer.guardians || [];
            const hasTargetGuardian = currentGuardiansForPlayer.some(
              (guardian) => guardian.id === targetTrainer.id || guardian.userId === targetTrainer.id
            );

            if (!hasTargetGuardian) {
              const playerAfterAdd = await addGuardianToPlayerService(currentGroup.id, player.id, {
                userId: targetTrainer.id,
                trainerId: targetTrainer.id,
              });

              nextPlayers = nextPlayers.map((entry) =>
                entry.id === player.id ? { ...entry, ...playerAfterAdd } : entry
              );
              workingPlayer = playerAfterAdd;
            }

            const guardiansToRemove = (workingPlayer.guardians || [])
              .filter((guardian) => isMatchingGuardian(guardian, guardianId))
              .filter((guardian) => guardian.id !== targetTrainer.id && guardian.userId !== targetTrainer.id);

            for (const guardian of guardiansToRemove) {
              const playerAfterRemove = await deleteGuardianFromPlayerService(currentGroup.id, player.id, guardian.id);
              nextPlayers = nextPlayers.map((entry) =>
                entry.id === player.id ? { ...entry, ...playerAfterRemove } : entry
              );
              workingPlayer = playerAfterRemove;
            }

            const normalizedWorkingPlayer = {
              ...workingPlayer,
              guardians: dedupeGuardians(workingPlayer.guardians || []),
            };
            nextPlayers = nextPlayers.map((entry) =>
              entry.id === player.id ? normalizedWorkingPlayer : entry
            );
          }

          const trainerIdsToDelete = new Set<string>();
          if (guardianId !== trainerId && currentTrainers.some((trainer) => trainer.id === guardianId)) {
            trainerIdsToDelete.add(guardianId);
          }

          currentPlayers.forEach((player) => {
            (player.guardians || []).forEach((guardian) => {
              if (!isMatchingGuardian(guardian, guardianId)) {
                return;
              }

              const candidateTrainerId = guardian.userId || guardian.id;
              if (
                candidateTrainerId &&
                candidateTrainerId !== trainerId &&
                currentTrainers.some((trainer) => trainer.id === candidateTrainerId)
              ) {
                trainerIdsToDelete.add(candidateTrainerId);
              }
            });
          });

          for (const duplicateTrainerId of trainerIdsToDelete) {
            await deleteMemberService(currentGroup.id, duplicateTrainerId);
          }

          const nextTrainers =
            currentTrainers.filter((trainer) => !trainerIdsToDelete.has(trainer.id))
          ;

          set({ members: toMembers(nextPlayers, nextTrainers) });
          return true;
        } catch (error) {
          console.error('Failed to merge guardian into trainer:', error);
          return false;
        }
      },
      
      // Shirt set mutations
      addShirtSet: async (shirtSetData) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          const newShirtSet = await addShirtSetService(currentGroup.id, shirtSetData);
          const currentShirtSets = get().shirtSets;
          const updatedShirtSets = [...currentShirtSets, newShirtSet];
          set({ shirtSets: sortShirtSets(updatedShirtSets) });
          return newShirtSet;
        } catch (error) {
          console.error('Failed to add shirt set:', error);
          return null;
        }
      },
      
      updateShirtSet: async (id, shirtSetData) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          await updateShirtSetService(currentGroup.id, id, shirtSetData);
          const currentShirtSets = get().shirtSets;
          const updatedShirtSets = currentShirtSets.map(shirtSet => 
            shirtSet.id === id ? { ...shirtSet, ...shirtSetData } : shirtSet
          );
          set({ shirtSets: sortShirtSets(updatedShirtSets) });
          return true;
        } catch (error) {
          console.error('Failed to update shirt set:', error);
          return false;
        }
      },
      
      deleteShirtSet: async (id) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          await deleteShirtSetService(currentGroup.id, id);
          const currentShirtSets = get().shirtSets;
          const filteredShirtSets = currentShirtSets.filter(shirtSet => shirtSet.id !== id);
          set({ shirtSets: sortShirtSets(filteredShirtSets) });
          return true;
        } catch (error) {
          console.error('Failed to delete shirt set:', error);
          return false;
        }
      },
      
      addShirtToSet: async (shirtSetId, shirtData) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          const newShirt = await addShirtToSetService(currentGroup.id, shirtSetId, shirtData);
          const currentShirtSets = get().shirtSets;
          const updatedShirtSets = currentShirtSets.map(shirtSet => 
            shirtSet.id === shirtSetId 
              ? { ...shirtSet, shirts: [...shirtSet.shirts, newShirt] }
              : shirtSet
          );
          set({ shirtSets: sortShirtSets(updatedShirtSets) });
          return newShirt;
        } catch (error) {
          console.error('Failed to add shirt to set:', error);
          return null;
        }
      },
      
      removeShirtFromSet: async (shirtSetId, shirtNumber) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          await removeShirtFromSetService(currentGroup.id, shirtSetId, shirtNumber);
          const currentShirtSets = get().shirtSets;
          const updatedShirtSets = currentShirtSets.map(shirtSet => 
            shirtSet.id === shirtSetId 
              ? { ...shirtSet, shirts: shirtSet.shirts.filter(shirt => shirt.number !== shirtNumber) }
              : shirtSet
          );
          set({ shirtSets: sortShirtSets(updatedShirtSets) });
          return true;
        } catch (error) {
          console.error('Failed to remove shirt from set:', error);
          return false;
        }
      },
      
      updateShirt: async (shirtSetId, updatedShirt) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');
        
        try {
          await updateShirtService(currentGroup.id, shirtSetId, updatedShirt);
          const currentShirtSets = get().shirtSets;
          const updatedShirtSets = currentShirtSets.map(shirtSet => 
            shirtSet.id === shirtSetId 
              ? { 
                  ...shirtSet, 
                  shirts: shirtSet.shirts.map(shirt => 
                    shirt.number === updatedShirt.number ? updatedShirt : shirt
                  )
                }
              : shirtSet
          );
          set({ shirtSets: sortShirtSets(updatedShirtSets) });
          return true;
        } catch (error) {
          console.error('Failed to update shirt:', error);
          return false;
        }
      },

      addGroupPeriod: async (periodData) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');

        try {
          const newPeriod = await addGroupPeriodService(currentGroup.id, periodData);
          const updatedGroup = {
            ...currentGroup,
            periods: sortPeriods([...(currentGroup.periods ?? []), newPeriod]),
          };

          set((state) => ({
            group: updatedGroup,
            groups: state.groups.map((group) => (
              group.id === currentGroup.id ? updatedGroup : group
            )),
          }));

          return newPeriod;
        } catch (error) {
          console.error('Failed to add group period:', error);
          return null;
        }
      },

      updateGroupPeriod: async (periodId, periodData) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');

        try {
          const updatedPeriod = await updateGroupPeriodService(currentGroup.id, periodId, periodData);
          const updatedGroup = {
            ...currentGroup,
            periods: sortPeriods(
              (currentGroup.periods ?? []).map((period) => (
                period.id === periodId ? updatedPeriod : period
              ))
            ),
          };

          set((state) => ({
            group: updatedGroup,
            groups: state.groups.map((group) => (
              group.id === currentGroup.id ? updatedGroup : group
            )),
          }));

          return true;
        } catch (error) {
          console.error('Failed to update group period:', error);
          return false;
        }
      },

      deleteGroupPeriod: async (periodId) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');

        try {
          await deleteGroupPeriodService(currentGroup.id, periodId);

          const updatedGroup = {
            ...currentGroup,
            periods: (currentGroup.periods ?? []).filter((period) => period.id !== periodId),
          };

          const isDeletedPeriodSelected = get().selectedStatisticsPeriodId === periodId;

          set((state) => ({
            group: updatedGroup,
            groups: state.groups.map((group) => (
              group.id === currentGroup.id ? updatedGroup : group
            )),
            selectedStatisticsPeriodId: isDeletedPeriodSelected
              ? null
              : state.selectedStatisticsPeriodId,
          }));

          if (isDeletedPeriodSelected) {
            clearSelectedStatisticsPeriodId();
          }

          return true;
        } catch (error) {
          console.error('Failed to delete group period:', error);
          return false;
        }
      },
      
      // Selectors
      getPlayerById: (id) => playersFromMembers(get().members).find((player) => player.id === id),
      getEventById: (id) => get().events.find(e => e.id === id),
      getTrainerById: (id) => trainersFromMembers(get().members).find((trainer) => trainer.id === id),
      getShirtSetById: (id) => get().shirtSets.find(s => s.id === id),
      
      getPlayerStats: (playerId, excludeEventId) => {
        const events = excludeEventId 
          ? get().events.filter(e => e.id !== excludeEventId)
          : get().events;
        return getPlayerStats(playerId, events);
      },

      getTrainerEventHistory: (trainerId) => {
        const getEventStartTime = (event: Event): string | undefined => {
          const startTimes = event.teams
            .map((team) => team.startTime?.trim())
            .filter((startTime): startTime is string => Boolean(startTime));

          if (startTimes.length === 0) {
            return undefined;
          }

          return startTimes.sort()[0];
        };

        const getLocation = (teamLocation?: string, eventLocation?: string): string | undefined => {
          if (teamLocation?.trim()) {
            return teamLocation.trim();
          }

          if (eventLocation?.trim()) {
            return eventLocation.trim();
          }

          return undefined;
        };

        return get().events
          .filter((event) => event.teams.some((team) => team.trainerId === trainerId))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((event) => {
            const team = event.teams.find((entry) => entry.trainerId === trainerId);
            return {
              eventId: event.id,
              eventName: event.name,
              eventDate: event.date,
              startTime: team?.startTime || getEventStartTime(event),
              location: getLocation(team?.location, event.location),
              teamName: team?.name,
              teamStrength: team?.strength || 2,
            };
          });
      },
      
      getTeamAverageLevel: (team) => {
        const players = playersFromMembers(get().members);
        const selectedPlayers = team.selectedPlayers || [];
        
        if (selectedPlayers.length === 0) return 0;
        
        const totalLevel = selectedPlayers.reduce((sum, playerId) => {
          const player = players.find(p => p.id === playerId);
          return sum + (player?.level || 0);
        }, 0);
        
        return totalLevel / selectedPlayers.length;
      },
    }),
    {
      name: 'app-store',
    }
  )
);

// Stable selectors to prevent infinite re-renders
export const useAppLoading = () => useStore((state) => 
  state.loading.group || state.loading.players || state.loading.events || state.loading.trainers || state.loading.shirtSets
);

export const useAppErrors = () => useStore((state) => state.errors);

export const useAppHasErrors = () => useStore((state) => 
  !!(state.errors.players || state.errors.events || state.errors.trainers || state.errors.shirtSets)
);

export const useAppInitialized = () => useStore((state) => state.isInitialized);

export const useGroup = () => useStore((state) => state.group);

export const useGroups = () => useStore((state) => state.groups);

export const useGroupPeriods = () => useStore((state) => state.group?.periods ?? EMPTY_PERIODS);

export const useSelectedStatisticsPeriod = () => useStore((state) => {
  if (!state.selectedStatisticsPeriodId) return null;

  return (state.group?.periods ?? EMPTY_PERIODS).find(
    (period) => period.id === state.selectedStatisticsPeriodId
  ) ?? null;
});

export const useGroupsLoading = () => useStore((state) => state.loading.groups);

export const useGroupsError = () => useStore((state) => state.errors.groups);

export const useTrainers = () => {
  const members = useStore((state) => state.members);
  return useMemo(() => trainersFromMembers(members), [members]);
};