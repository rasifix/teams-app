
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
  MEMBER_ROLE_TRAINER,
} from '../services/memberService';
import { getEvents, addEvent as addEventService, updateEvent as updateEventService, deleteEvent as deleteEventService, updatePlayerInvitationStatus as updatePlayerInvitationStatusService } from '../services/eventService';
import { getShirtSets, addShirtSet as addShirtSetService, updateShirtSet as updateShirtSetService, deleteShirtSet as deleteShirtSetService, addShirtToSet as addShirtToSetService, removeShirtFromSet as removeShirtFromSetService, updateShirt as updateShirtService } from '../services/shirtService';
import { getGroups, getGroup, createGroup as createGroupService, addGroupPeriod as addGroupPeriodService, updateGroupPeriod as updateGroupPeriodService, deleteGroupPeriod as deleteGroupPeriodService } from '../services/groupService';
import { authService } from '../services/authService';
import { setSelectedGroupId, clearSelectedGroupId, setSelectedStatisticsPeriodId, clearSelectedStatisticsPeriodId, getSelectedStatisticsPeriodId } from '../utils/localStorage';
import { canAccessRestrictedManagement } from '../utils/permissions';

// Helper function to sort players alphabetically by lastName + firstName
const sortPlayers = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => {
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

// Helper function to sort trainers alphabetically by lastName + firstName
const sortTrainers = (trainers: Trainer[]): Trainer[] => {
  return [...trainers].sort((a, b) => {
    const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
    const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
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
  players: Player[];
  events: Event[];
  trainers: Trainer[];
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
  setPlayers: (players: Player[]) => void;
  setEvents: (events: Event[]) => void;
  setTrainers: (trainers: Trainer[]) => void;
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
      players: [],
      events: [],
      trainers: [],
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

        let currentGroup = selectedGroup;
        try {
          currentGroup = await getGroup(selectedGroup.id);
          const sortedPeriods = sortPeriods(currentGroup.periods ?? []);
          set({
            group: {
              ...currentGroup,
              periods: sortedPeriods,
            },
          });
        } catch (error) {
          console.warn('Failed to resolve full group before permission checks:', error);
        }

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
            players: Player[];
            events: Event[];
            trainers: Trainer[];
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
            players: state.players,
            events: state.events,
            trainers: state.trainers,
            shirtSets: state.shirtSets,
          };
          
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              const { type } = result.value;
              if (type === 'group') {
                newState.group = {
                  ...result.value.data,
                  periods: sortPeriods(result.value.data.periods ?? []),
                };
              } else if (type === 'members') {
                const membersData = result.value.data as { players: Player[], trainers: Trainer[] };
                newState.players = sortPlayers(membersData.players);
                newState.trainers = sortTrainers(membersData.trainers);
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

          const shouldLoadShirtSets = canAccessRestrictedManagement(currentUser, {
            group: newState.group,
            trainers: newState.trainers,
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
          players: [],
          events: [],
          trainers: [],
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
        
        set({
          group: {
            ...group,
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
      setPlayers: (players) => set({ players: sortPlayers(players) }),
      setEvents: (events) => set({ events: sortEvents(events) }),
      setTrainers: (trainers) => set({ trainers: sortTrainers(trainers) }),
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
          const currentPlayers = get().players;
          const updatedPlayers = [...currentPlayers, newPlayer];
          set({ players: sortPlayers(updatedPlayers) });
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
          const currentPlayer = get().players.find((player) => player.id === id);
          const updatedPlayer = await updateMemberService(currentGroup.id, id, {
            ...playerData,
            roles: Array.from(new Set([...(currentPlayer?.roles || []), ...(playerData.roles || []), 'player'])),
          }) as Player;
          const currentPlayers = get().players;
          const updatedPlayers = currentPlayers.map(player => 
            player.id === id ? { ...player, ...updatedPlayer } : player
          );
          set({ players: sortPlayers(updatedPlayers) });
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
          set({
            players: sortPlayers(refreshedMembers.players),
            trainers: sortTrainers(refreshedMembers.trainers),
          });
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
          }

          const updatedPlayer = await addGuardianToPlayerService(currentGroup.id, playerId, {
            guardianId: guardianIdToLink,
          });

          const currentPlayers = get().players;
          const updatedPlayers = currentPlayers.map((player) =>
            player.id === playerId ? { ...player, ...updatedPlayer } : player
          );

          if (!existingGuardianId) {
            const refreshedMembers = await getAllMembers(currentGroup.id);
            set({
              players: sortPlayers(updatedPlayers),
              trainers: sortTrainers(refreshedMembers.trainers),
            });
            return true;
          }

          set({ players: sortPlayers(updatedPlayers) });
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
          const currentPlayers = get().players;
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
            set({
              players: sortPlayers(refreshedMembers.players),
              trainers: sortTrainers(refreshedMembers.trainers),
            });
            return true;
          }

          set({ players: sortPlayers(updatedPlayers) });
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
          set({
            players: sortPlayers(refreshedMembers.players),
            trainers: sortTrainers(refreshedMembers.trainers),
          });
          return true;
        } catch (error) {
          console.error('Failed to edit guardian member:', error, previousGuardianData, playerId);
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
          const currentTrainers = get().trainers;
          const updatedTrainers = [...currentTrainers, newTrainer];
          set({ trainers: sortTrainers(updatedTrainers) });
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
          const currentTrainer = get().trainers.find((trainer) => trainer.id === id);
          const updatedTrainer = await updateMemberService(currentGroup.id, id, {
            ...trainerData,
            roles: Array.from(new Set([...(currentTrainer?.roles || []), ...(trainerData.roles || []), 'trainer'])),
          }) as Trainer;
          const currentTrainers = get().trainers;
          const updatedTrainers = currentTrainers.map(trainer => 
            trainer.id === id ? { ...trainer, ...updatedTrainer } : trainer
          );
          set({ trainers: sortTrainers(updatedTrainers) });
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

          const isAssignedAsGuardian = get().players.some((player) =>
            (player.guardians || []).some((guardian) => isMatchingGuardian(guardian, id))
          );

          if (roles.length === 1 && !isAssignedAsGuardian) {
            await deleteMemberService(currentGroup.id, id);
          } else {
            await revokeMemberRoleService(currentGroup.id, id, MEMBER_ROLE_TRAINER);
          }

          const refreshedMembers = await getAllMembers(currentGroup.id);
          set({
            players: sortPlayers(refreshedMembers.players),
            trainers: sortTrainers(refreshedMembers.trainers),
          });
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
          set({
            players: sortPlayers(refreshedMembers.players),
            trainers: sortTrainers(refreshedMembers.trainers),
          });
          return true;
        } catch (error) {
          console.error('Failed to assign trainer role:', error);
          return false;
        }
      },

      mergeGuardianIntoTrainer: async (guardianId, trainerId) => {
        const currentGroup = get().group;
        if (!currentGroup) throw new Error('No group selected');

        const targetTrainer = get().trainers.find((trainer) => trainer.id === trainerId);
        if (!targetTrainer) {
          return false;
        }

        const currentPlayers = get().players;
        const currentTrainers = get().trainers;
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

          const nextTrainers = sortTrainers(
            currentTrainers.filter((trainer) => !trainerIdsToDelete.has(trainer.id))
          );

          set({ players: sortPlayers(nextPlayers), trainers: nextTrainers });
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
      getPlayerById: (id) => get().players.find(p => p.id === id),
      getEventById: (id) => get().events.find(e => e.id === id),
      getTrainerById: (id) => get().trainers.find(t => t.id === id),
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
        const { players } = get();
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

export const useTrainers = () => useStore((state) => state.trainers);