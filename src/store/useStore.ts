
import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Player, Activity, Trainer, ShirtSet, Team, Squad, Period, CreateSquadRequest, SquadRole, SquadCategory, MatchFormat, Formation, PositionCode, SfvCategoryCatalog } from '../types';
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
import { getActivities, updateActivity as updateActivityService } from '../services/activityService';
import { createActivityActions, type ActivityActions } from './activityActions';
import { getActivityDate, getActivityStartTime, sortActivities } from './selectors/activitySelectors';
import { getShirtSets, addShirtSet as addShirtSetService, updateShirtSet as updateShirtSetService, deleteShirtSet as deleteShirtSetService, addShirtToSet as addShirtToSetService, removeShirtFromSet as removeShirtFromSetService, updateShirt as updateShirtService } from '../services/shirtService';
import { getSquads, getSquad, createSquad as createSquadService, deactivateSquad as deactivateSquadService, updateSquadCategory as updateSquadCategoryService, addSquadPeriod as addSquadPeriodService, updateSquadPeriod as updateSquadPeriodService, deleteSquadPeriod as deleteSquadPeriodService, setMatchPlanningEnabled as setMatchPlanningEnabledService, addSquadMatchFormat as addSquadMatchFormatService, updateSquadMatchFormat as updateSquadMatchFormatService, deleteSquadMatchFormat as deleteSquadMatchFormatService, setDefaultSquadMatchFormat as setDefaultSquadMatchFormatService, addSquadFormation as addSquadFormationService, updateSquadFormation as updateSquadFormationService, deleteSquadFormation as deleteSquadFormationService } from '../services/squadService';
import { authService } from '../services/authService';
import { setSelectedSquadId, clearSelectedSquadId, setSelectedStatisticsPeriodId, clearSelectedStatisticsPeriodId, getSelectedStatisticsPeriodId } from '../utils/localStorage';
import { canAccessRestrictedManagement, withResolvedSquadPermissions } from '../utils/permissions';
import { mergeMembersFromCollections, selectPlayersFromMembers, selectTrainersFromMembers, type SquadMember } from './selectors/memberSelectors';
import {
  selectActivityWithoutActiveInvitations,
  selectPlayerDeletionImpact,
} from './selectors/playerDeletionSelectors';
import { selectMatchingMatchFormat } from './selectors/squadCategorySelectors';
import { selectActiveSquads } from './selectors/squadSelectors';
import { selectOfficialMatchFormatForCategory } from './selectors/sfvCatalogSelectors';
import { getSfvCategoryCatalog } from '../services/sfvService';

// Helper function to sort members alphabetically by lastName + firstName
const sortMembers = (members: SquadMember[]): SquadMember[] => {
  return [...members].sort((a, b) => {
    const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
    const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

function toMembers(players: Player[], trainers: Trainer[]): SquadMember[] {
  return sortMembers(mergeMembersFromCollections(players, trainers));
}

function playersFromMembers(members: SquadMember[]): Player[] {
  return selectPlayersFromMembers(members);
}

function trainersFromMembers(members: SquadMember[]): Trainer[] {
  return selectTrainersFromMembers(members);
}

function upsertMember(members: SquadMember[], member: SquadMember): SquadMember[] {
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

const sortSquads = (squads: Squad[]): Squad[] => {
  return [...squads].sort((a, b) => a.name.localeCompare(b.name));
};

const EMPTY_PERIODS: Period[] = [];

function dedupeGuardians(guardians: import('../types').Guardian[]): import('../types').Guardian[] {
  const seenKeys = new Set<string>();

  return guardians.filter((guardian) => {
    const key = guardian.id || `${(guardian.email || '').toLowerCase()}::${(guardian.firstName || '').toLowerCase()}::${(guardian.lastName || '').toLowerCase()}`;
    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function isMatchingGuardian(guardian: import('../types').Guardian, guardianId: string): boolean {
  return guardian.id === guardianId;
}

function mergeSquadMember(squad: Squad | null, member: SquadMember | null): Squad | null {
  if (!squad || !member) {
    return squad;
  }

  const nextMember = {
    id: member.id,
    email: 'email' in member ? member.email : undefined,
    roles: member.roles || [],
  };

  return {
    ...squad,
    members: [
      ...(squad.members || []).filter((existingMember) => existingMember.id !== member.id),
      nextMember,
    ],
  };
}

const PLAYER_DELETE_ROLE_CONSTRAINT = 'PLAYER_DELETE_ROLE_CONSTRAINT';
export const PLAYER_DELETE_ROLE_CONSTRAINT_ERROR_MESSAGE = PLAYER_DELETE_ROLE_CONSTRAINT;
const PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT = 'PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT';
export const PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT_ERROR_MESSAGE = PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT;

function getUniqueRoles(roles: SquadRole[] | undefined): SquadRole[] {
  return Array.from(new Set(roles || []));
}

interface AppState extends ActivityActions {
  // Data
  squad: Squad | null;
  squads: Squad[];
  selectedStatisticsPeriodId: string | null;
  members: SquadMember[];
  activities: Activity[];
  shirtSets: ShirtSet[];
  
  // Loading states
  loading: {
    squad: boolean;
    squads: boolean;
    players: boolean;
    activities: boolean;
    trainers: boolean;
    shirtSets: boolean;
  };
  
  // Error states
  errors: {
    squad: string | null;
    squads: string | null;
    players: string | null;
    activities: string | null;
    trainers: string | null;
    shirtSets: string | null;
  };
  
  // Initialization tracking
  isInitialized: boolean;

  // SFV reference data (static, cached for the session)
  sfvCatalog: SfvCategoryCatalog | null;
  loadSfvCatalog: () => Promise<void>;

  loadSquads: () => Promise<void>;
  addSquad: (squadData: CreateSquadRequest) => Promise<Squad | null>;
  deactivateSquad: () => Promise<boolean>;
  configureSquadCategory: (category: SquadCategory | null) => Promise<boolean>;
  selectSquad: (squadId: string) => Promise<void>;
  selectStatisticsPeriod: (periodId: string | null) => void;
  initializeApp: () => Promise<void>;
  clearAuthenticatedData: () => void;
  setMembers: (members: SquadMember[]) => void;
  setActivities: (activities: Activity[]) => void;
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

  // Squad period mutations
  addSquadPeriod: (periodData: Omit<Period, 'id'>) => Promise<Period | null>;
  updateSquadPeriod: (periodId: string, periodData: Omit<Period, 'id'>) => Promise<boolean>;
  deleteSquadPeriod: (periodId: string) => Promise<boolean>;

  // Match planning mutations
  setMatchPlanningEnabled: (enabled: boolean) => Promise<boolean>;
  addMatchFormat: (data: Omit<MatchFormat, 'id' | 'isDefault'>) => Promise<MatchFormat | null>;
  updateMatchFormat: (matchFormatId: string, data: Omit<MatchFormat, 'id' | 'isDefault'>) => Promise<boolean>;
  deleteMatchFormat: (matchFormatId: string) => Promise<boolean>;
  setDefaultMatchFormat: (matchFormatId: string) => Promise<boolean>;
  addFormation: (data: { name: string; slots: Array<{ positionCode: PositionCode }> }) => Promise<Formation | null>;
  updateFormation: (formationId: string, data: { name: string; slots: Array<{ id?: string; positionCode: PositionCode }> }) => Promise<boolean>;
  deleteFormation: (formationId: string) => Promise<boolean>;
  
  // Selectors (computed values)
  getPlayerById: (id: string) => Player | undefined;
  getActivityById: (id: string) => Activity | undefined;
  getTrainerById: (id: string) => Trainer | undefined;
  getShirtSetById: (id: string) => ShirtSet | undefined;
  getPlayerStats: (playerId: string, excludeActivityId?: string) => ReturnType<typeof getPlayerStats>;
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
      squad: null,
      squads: [],
      selectedStatisticsPeriodId: null,
      members: [],
      activities: [],
      shirtSets: [],
      isInitialized: false,
      sfvCatalog: null,
      loading: {
        squad: false,
        squads: false,
        players: false,
        activities: false,
        trainers: false,
        shirtSets: false,
      },
      errors: {
        squad: null,
        squads: null,
        players: null,
        activities: null,
        trainers: null,
        shirtSets: null,
      },
      
      // Actions
      initializeApp: async () => {
        const state = get();
        const selectedSquad = get().squad;

        if (!selectedSquad) {
          throw new Error('No squad selected');
        }

        const currentSquad = selectedSquad;

        let currentUser: import('../services/authService').User | null = null;
        try {
          currentUser = await authService.getCurrentUser();
        } catch (error) {
          console.warn('Failed to resolve current user for app initialization:', error);
        }
        
        // Set all loading states
        set({
          loading: {
            squad: true,
            squads: true,
            players: true,
            activities: true,
            trainers: true,
            shirtSets: false,
          },
          errors: {
            squad: null,
            squads: null,
            players: null,
            activities: null,
            trainers: null,
            shirtSets: null,
          },
        });
        
        // Load all data in parallel
        const loadData = async () => {
          const results = await Promise.allSettled([
            getSquad(currentSquad.id).then((squad) => ({ type: 'squad' as const, data: squad })),
            getAllMembers(currentSquad.id).then((members) => ({ type: 'members' as const, data: members })),
            getActivities(currentSquad.id).then((activities: Activity[]) => ({ type: 'activities' as const, data: activities })),
          ]);
          
          const newState: {
            loading: AppState['loading'];
            errors: AppState['errors'];
            squad: Squad | null;
            squads: Squad[];
            selectedStatisticsPeriodId: string | null;
            members: SquadMember[];
            activities: Activity[];
            shirtSets: ShirtSet[];
          } = {
            loading: {
              squad: false,
              squads: false,
              players: false,
              activities: false,
              trainers: false,
              shirtSets: false,
            },
            errors: {
              squad: null,
              squads: null,
              players: null,
              activities: null,
              trainers: null,
              shirtSets: null,
            },
            squad: state.squad,
            squads: state.squads,
            selectedStatisticsPeriodId: state.selectedStatisticsPeriodId,
            members: state.members,
            activities: state.activities,
            shirtSets: state.shirtSets,
          };
          
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              const { type } = result.value;
              if (type === 'squad') {
                const resolvedSquad = withResolvedSquadPermissions(result.value.data, [get().squad, newState.squad]) || result.value.data;
                newState.squad = {
                  ...resolvedSquad,
                  periods: sortPeriods(resolvedSquad?.periods ?? []),
                };
              } else if (type === 'members') {
                const membersData = result.value.data as { players: Player[], trainers: Trainer[] };
                newState.members = toMembers(membersData.players, membersData.trainers);
              } else if (type === 'activities') {
                newState.activities = sortActivities(result.value.data.map((activity) => ({ ...activity, status: activity.status ?? 'active' })));
              }
            } else {
              // Map index to appropriate error handling
              if (index === 0) {
                // Squad call failed - log warning but don't treat as fatal error
                console.warn('Failed to load squad:', result.reason?.message || 'Unknown error');
                newState.errors.squad = result.reason?.message || 'Failed to load squad';
              } else if (index === 1) {
                // Members call failed - set error for both players and trainers
                newState.errors.players = result.reason?.message || 'Failed to load members';
                newState.errors.trainers = result.reason?.message || 'Failed to load members';
              } else if (index === 2) {
                // Events call failed
                newState.errors.activities = result.reason?.message || 'Failed to load activities';
              }
            }
          });

          if (currentUser && newState.squad) {
            try {
              const currentUserMember = await getMemberByIdService(newState.squad.id, currentUser.id);
              newState.squad = mergeSquadMember(newState.squad, currentUserMember);
            } catch (error) {
              console.warn('Failed to load current user member for permissions:', error);
            }
          }

          const shouldLoadShirtSets = canAccessRestrictedManagement(currentUser, {
            squad: newState.squad,
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
              const shirtSets = await getShirtSets(currentSquad.id);
              newState.shirtSets = sortShirtSets(shirtSets);
            } catch (error) {
              newState.errors.shirtSets = error instanceof Error ? error.message : 'Failed to load shirt sets';
            }
          }

          if (
            newState.selectedStatisticsPeriodId &&
            !newState.squad?.periods.some((period) => period.id === newState.selectedStatisticsPeriodId)
          ) {
            newState.selectedStatisticsPeriodId = null;
          }
          
          set({ ...newState, isInitialized: true });
        };

        await loadData();
      },
      
      loadSfvCatalog: async () => {
        if (get().sfvCatalog) {
          return;
        }

        try {
          const sfvCatalog = await getSfvCategoryCatalog();
          set({ sfvCatalog });
        } catch (error) {
          // The catalog only enriches category selection; the app works with the built-in fallback.
          console.warn('Failed to load SFV category catalog:', error);
        }
      },

      clearAuthenticatedData: () => {
        clearSelectedSquadId();
        clearSelectedStatisticsPeriodId();
        set({
          squad: null,
          squads: [],
          selectedStatisticsPeriodId: null,
          members: [],
          activities: [],
          shirtSets: [],
          isInitialized: false,
          loading: {
            squad: false,
            squads: false,
            players: false,
            activities: false,
            trainers: false,
            shirtSets: false,
          },
          errors: {
            squad: null,
            squads: null,
            players: null,
            activities: null,
            trainers: null,
            shirtSets: null,
          },
        });
      },

      loadSquads: async () => {
        set({ loading: { ...get().loading, squads: true }, errors: { ...get().errors, squads: null } });
        
        try {
          const squads = await getSquads();
          set({ squads: sortSquads(selectActiveSquads(squads)), loading: { ...get().loading, squads: false } });
        } catch (error) {
          console.error('Failed to load squads:', error);
          set({ 
            loading: { ...get().loading, squads: false }, 
            errors: { ...get().errors, squads: error instanceof Error ? error.message : 'Failed to load squads' }
          });
        }
      },

      addSquad: async (squadData) => {
        set({ loading: { ...get().loading, squads: true }, errors: { ...get().errors, squads: null } });

        try {
          const newSquad = await createSquadService(squadData);
          const updatedSquads = sortSquads([...get().squads, newSquad]);
          set({
            squads: updatedSquads,
            loading: { ...get().loading, squads: false },
          });
          return newSquad;
        } catch (error) {
          console.error('Failed to add squad:', error);
          set({
            loading: { ...get().loading, squads: false },
            errors: { ...get().errors, squads: error instanceof Error ? error.message : 'Failed to add squad' },
          });
          return null;
        }
      },

      deactivateSquad: async () => {
        const currentSquad = get().squad;
        if (!currentSquad) return false;

        try {
          await deactivateSquadService(currentSquad.id);
          clearSelectedSquadId();
          clearSelectedStatisticsPeriodId();
          set((state) => ({
            squad: null,
            squads: state.squads.filter((squad) => squad.id !== currentSquad.id),
            selectedStatisticsPeriodId: null,
            members: [],
            activities: [],
            shirtSets: [],
            isInitialized: false,
          }));
          return true;
        } catch (error) {
          console.error('Failed to deactivate squad:', error);
          return false;
        }
      },

      configureSquadCategory: async (category) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          let updatedSquad = await updateSquadCategoryService(currentSquad.id, currentSquad.name, category);
          const officialMode = selectOfficialMatchFormatForCategory(get().sfvCatalog, category);

          if (officialMode) {
            if (!updatedSquad.matchPlanningEnabled) {
              updatedSquad = await setMatchPlanningEnabledService(currentSquad.id, true);
            }

            const availableModes = updatedSquad.matchFormats ?? currentSquad.matchFormats ?? [];
            let matchingMode = selectMatchingMatchFormat(availableModes, officialMode);
            if (!matchingMode) {
              matchingMode = await addSquadMatchFormatService(currentSquad.id, officialMode);
            }

            await setDefaultSquadMatchFormatService(currentSquad.id, matchingMode.id);
            const matchFormats = [
              ...availableModes.filter((mode) => mode.id !== matchingMode.id),
              matchingMode,
            ].map((mode) => ({ ...mode, isDefault: mode.id === matchingMode.id }));

            updatedSquad = {
              ...updatedSquad,
              category,
              matchPlanningEnabled: true,
              matchFormats,
            };
          }

          set((state) => ({
            squad: updatedSquad,
            squads: state.squads.map((squad) => squad.id === updatedSquad.id ? updatedSquad : squad),
          }));
          return true;
        } catch (error) {
          console.error('Failed to configure squad category:', error);
          return false;
        }
      },
      
      selectSquad: async (squadId: string) => {
        const squads = get().squads;
        const selectedSquad = squads.find(g => g.id === squadId);
        
        let squad: Squad;
        try {
          squad = await getSquad(squadId);
        } catch (error) {
          console.error('Failed to fetch squad:', error);
          if (selectedSquad) {
            squad = selectedSquad;
          } else {
            // Fallback to minimal squad object
            squad = { id: squadId, name: `Squad ${squadId}`, periods: [] };
          }
        }
        
        const sortedPeriods = sortPeriods(squad.periods ?? []);
        const savedPeriodId = getSelectedStatisticsPeriodId();
        const isValidSavedPeriod = savedPeriodId && sortedPeriods.some((period) => period.id === savedPeriodId);
        
        const resolvedSquad = withResolvedSquadPermissions(squad, [selectedSquad, get().squad]) || squad;

        set({
          squad: {
            ...resolvedSquad,
            periods: sortedPeriods,
          },
          selectedStatisticsPeriodId: isValidSavedPeriod ? savedPeriodId : null,
        });
        setSelectedSquadId(squadId);
      },

      selectStatisticsPeriod: (periodId) => {
        set({ selectedStatisticsPeriodId: periodId });
        setSelectedStatisticsPeriodId(periodId);
      },
      
      // Actions
      setMembers: (members) => set({ members: sortMembers(members) }),
      setActivities: (activities) => set({ activities: sortActivities(activities) }),
      setShirtSets: (shirtSets) => set({ shirtSets: sortShirtSets(shirtSets) }),
      
      // Player mutations
      addPlayer: async (playerData) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');
        
        try {
          const newPlayer = await addMemberService(currentSquad.id, {
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
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');
        
        try {
          const currentPlayer = playersFromMembers(get().members).find((player) => player.id === id);
          const updatedPlayer = await updateMemberService(currentSquad.id, id, {
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
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');
        
        try {
          const member = await getMemberByIdService(currentSquad.id, id);
          if (!member) {
            return false;
          }

          const roles = getUniqueRoles(member.roles);
          const canDeletePlayer = roles.length === 1 && roles[0] === MEMBER_ROLE_PLAYER;
          if (!canDeletePlayer) {
            throw new Error(PLAYER_DELETE_ROLE_CONSTRAINT);
          }

          const currentPlayer = playersFromMembers(get().members).find((player) => player.id === id);
          if (!currentPlayer) {
            return false;
          }

          const deletionImpact = selectPlayerDeletionImpact(get().activities, id);
          if (deletionImpact.hasPastTeamAssignment) {
            throw new Error(PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT);
          }

          let updatedActivities = get().activities;
          for (const activity of deletionImpact.activitiesWithActiveInvitations) {
            const sanitizedActivity = selectActivityWithoutActiveInvitations(activity, id);
            const persistedActivity = await updateActivityService(currentSquad.id, activity.id, {
              invitations: sanitizedActivity.invitations,
            });

            updatedActivities = updatedActivities.map((entry) => (
              entry.id === persistedActivity.id ? persistedActivity : entry
            ));
          }

          await deleteMemberService(currentSquad.id, id);

          const updatedMembers = sortMembers(
            get().members.filter((entry) => entry.id !== id)
          );

          set({
            members: updatedMembers,
            activities: sortActivities(updatedActivities),
          });
          return true;
        } catch (error) {
          console.error('Failed to delete player:', error);
          if (
            error instanceof Error && (
              error.message === PLAYER_DELETE_ROLE_CONSTRAINT
              || error.message === PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT
            )
          ) {
            throw error;
          }
          return false;
        }
      },

      addGuardianToPlayer: async (playerId, guardianData) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          const existingGuardianId = guardianData.guardianId || guardianData.trainerId;
          let ensuredGuardianMember: SquadMember | null = null;

          let guardianIdToLink = existingGuardianId;
          if (!guardianIdToLink) {
            if (!guardianData.firstName || !guardianData.lastName) {
              throw new Error('firstName and lastName are required to create a new guardian');
            }

            const newGuardianMember = await addMemberService(currentSquad.id, {
              firstName: guardianData.firstName,
              lastName: guardianData.lastName,
              email: guardianData.email,
              roles: ['guardian'],
            });

            guardianIdToLink = newGuardianMember.id;
          } else {
            const existingGuardianMember = await getMemberByIdService(currentSquad.id, guardianIdToLink);
            if (!existingGuardianMember) {
              return false;
            }

            const existingRoles = getUniqueRoles(existingGuardianMember.roles);
            if (!existingRoles.includes(MEMBER_ROLE_GUARDIAN)) {
              ensuredGuardianMember = await updateMemberService(currentSquad.id, guardianIdToLink, {
                ...existingGuardianMember,
                roles: Array.from(new Set<SquadRole>([...existingRoles, MEMBER_ROLE_GUARDIAN])),
              }) as SquadMember;
            } else {
              ensuredGuardianMember = existingGuardianMember as SquadMember;
            }
          }

          const updatedPlayer = await addGuardianToPlayerService(currentSquad.id, playerId, {
            guardianId: guardianIdToLink,
          });

          const currentPlayers = playersFromMembers(get().members);
          const updatedPlayers = currentPlayers.map((player) =>
            player.id === playerId ? { ...player, ...updatedPlayer } : player
          );

          if (!existingGuardianId) {
            const refreshedMembers = await getAllMembers(currentSquad.id);
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
            squad: mergeSquadMember(get().squad, ensuredGuardianMember),
          });
          return true;
        } catch (error) {
          console.error('Failed to add guardian to player:', error);
          return false;
        }
      },

      deleteGuardianFromPlayer: async (playerId, guardianId) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          const updatedPlayer = await deleteGuardianFromPlayerService(currentSquad.id, playerId, guardianId);
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

          const guardianMember = await getMemberByIdService(currentSquad.id, guardianId);
          const guardianRoles = getUniqueRoles(guardianMember?.roles);
          if (guardianMember && guardianRoles.length === 0) {
            await deleteMemberService(currentSquad.id, guardianId);
            const refreshedMembers = await getAllMembers(currentSquad.id);
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
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          const existingGuardianMember = await getMemberByIdService(currentSquad.id, guardianId);
          if (!existingGuardianMember) {
            return false;
          }

          const nextRoles = Array.from(new Set<SquadRole>([...(existingGuardianMember.roles || []), 'guardian']));
          await updateMemberService(currentSquad.id, guardianId, {
            ...existingGuardianMember,
            firstName: guardianData.firstName,
            lastName: guardianData.lastName,
            email: guardianData.email,
            roles: nextRoles,
          });

          const refreshedMembers = await getAllMembers(currentSquad.id);
          set({ members: toMembers(refreshedMembers.players, refreshedMembers.trainers) });
          return true;
        } catch (error) {
          console.error('Failed to edit guardian member:', error, previousGuardianData, playerId);
          return false;
        }
      },

      mergeGuardianDuplicates: async (sourceGuardianId, targetGuardianId) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

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
        let ensuredTargetMember: SquadMember | null = null;

        try {
          const targetMember = await getMemberByIdService(currentSquad.id, targetGuardianId);
          if (!targetMember) {
            const createdTargetGuardian = await addMemberService(currentSquad.id, {
              firstName: targetGuardianTemplate.firstName,
              lastName: targetGuardianTemplate.lastName,
              email: targetGuardianTemplate.email,
              roles: [MEMBER_ROLE_GUARDIAN],
            });

            targetGuardianIdToUse = createdTargetGuardian.id;
            ensuredTargetMember = createdTargetGuardian as SquadMember;
          } else {
            const targetRoles = getUniqueRoles(targetMember.roles);
            if (!targetRoles.includes(MEMBER_ROLE_GUARDIAN)) {
              ensuredTargetMember = await updateMemberService(currentSquad.id, targetGuardianId, {
                ...targetMember,
                roles: Array.from(new Set<SquadRole>([...targetRoles, MEMBER_ROLE_GUARDIAN])),
              }) as SquadMember;
            } else {
              ensuredTargetMember = targetMember as SquadMember;
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
              const playerAfterAdd = await addGuardianToPlayerService(currentSquad.id, player.id, {
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
              const playerAfterRemove = await deleteGuardianFromPlayerService(currentSquad.id, player.id, guardian.id);
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
            squad: mergeSquadMember(get().squad, ensuredTargetMember),
          });

          return true;
        } catch (error) {
          console.error('Failed to merge duplicate guardians:', error);
          return false;
        }
      },
      
      // Activity mutations
      ...createActivityActions({ get, set }),
      
      // Trainer mutations
      addTrainer: async (trainerData) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');
        
        try {
          const newTrainer = await addMemberService(currentSquad.id, {
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
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');
        
        try {
          const currentTrainer = trainersFromMembers(get().members).find((trainer) => trainer.id === id);
          const updatedTrainer = await updateMemberService(currentSquad.id, id, {
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
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');
        
        try {
          const member = await getMemberByIdService(currentSquad.id, id);
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
            await deleteMemberService(currentSquad.id, id);
          } else {
            await revokeMemberRoleService(currentSquad.id, id, MEMBER_ROLE_TRAINER);
          }

          const refreshedMembers = await getAllMembers(currentSquad.id);
          set({ members: toMembers(refreshedMembers.players, refreshedMembers.trainers) });
          return true;
        } catch (error) {
          console.error('Failed to delete trainer:', error);
          return false;
        }
      },

      assignTrainerRole: async (id) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          const member = await getMemberByIdService(currentSquad.id, id);
          if (!member) {
            return false;
          }

          const roles = getUniqueRoles(member.roles);
          if (roles.includes(MEMBER_ROLE_TRAINER)) {
            return true;
          }

          await updateMemberService(currentSquad.id, id, {
            ...member,
            roles: Array.from(new Set<SquadRole>([...roles, MEMBER_ROLE_TRAINER])),
          });

          const refreshedMembers = await getAllMembers(currentSquad.id);
          set({ members: toMembers(refreshedMembers.players, refreshedMembers.trainers) });
          return true;
        } catch (error) {
          console.error('Failed to assign trainer role:', error);
          return false;
        }
      },

      mergeGuardianIntoTrainer: async (guardianId, trainerId) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

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
              (guardian) => guardian.id === targetTrainer.id
            );

            if (!hasTargetGuardian) {
              const playerAfterAdd = await addGuardianToPlayerService(currentSquad.id, player.id, {
                guardianId: targetTrainer.id,
              });

              nextPlayers = nextPlayers.map((entry) =>
                entry.id === player.id ? { ...entry, ...playerAfterAdd } : entry
              );
              workingPlayer = playerAfterAdd;
            }

            const guardiansToRemove = (workingPlayer.guardians || [])
              .filter((guardian) => isMatchingGuardian(guardian, guardianId))
              .filter((guardian) => guardian.id !== targetTrainer.id);

            for (const guardian of guardiansToRemove) {
              const playerAfterRemove = await deleteGuardianFromPlayerService(currentSquad.id, player.id, guardian.id);
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

              const candidateTrainerId = guardian.id;
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
            await deleteMemberService(currentSquad.id, duplicateTrainerId);
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
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');
        
        try {
          const newShirtSet = await addShirtSetService(currentSquad.id, shirtSetData);
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
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');
        
        try {
          await updateShirtSetService(currentSquad.id, id, shirtSetData);
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
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');
        
        try {
          await deleteShirtSetService(currentSquad.id, id);
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
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');
        
        try {
          const newShirt = await addShirtToSetService(currentSquad.id, shirtSetId, shirtData);
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
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');
        
        try {
          await removeShirtFromSetService(currentSquad.id, shirtSetId, shirtNumber);
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
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');
        
        try {
          await updateShirtService(currentSquad.id, shirtSetId, updatedShirt);
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

      addSquadPeriod: async (periodData) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          const newPeriod = await addSquadPeriodService(currentSquad.id, periodData);
          const updatedSquad = {
            ...currentSquad,
            periods: sortPeriods([...(currentSquad.periods ?? []), newPeriod]),
          };

          set((state) => ({
            squad: updatedSquad,
            squads: state.squads.map((squad) => (
              squad.id === currentSquad.id ? updatedSquad : squad
            )),
          }));

          return newPeriod;
        } catch (error) {
          console.error('Failed to add squad period:', error);
          return null;
        }
      },

      updateSquadPeriod: async (periodId, periodData) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          const updatedPeriod = await updateSquadPeriodService(currentSquad.id, periodId, periodData);
          const updatedSquad = {
            ...currentSquad,
            periods: sortPeriods(
              (currentSquad.periods ?? []).map((period) => (
                period.id === periodId ? updatedPeriod : period
              ))
            ),
          };

          set((state) => ({
            squad: updatedSquad,
            squads: state.squads.map((squad) => (
              squad.id === currentSquad.id ? updatedSquad : squad
            )),
          }));

          return true;
        } catch (error) {
          console.error('Failed to update squad period:', error);
          return false;
        }
      },

      deleteSquadPeriod: async (periodId) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          await deleteSquadPeriodService(currentSquad.id, periodId);

          const updatedSquad = {
            ...currentSquad,
            periods: (currentSquad.periods ?? []).filter((period) => period.id !== periodId),
          };

          const isDeletedPeriodSelected = get().selectedStatisticsPeriodId === periodId;

          set((state) => ({
            squad: updatedSquad,
            squads: state.squads.map((squad) => (
              squad.id === currentSquad.id ? updatedSquad : squad
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
          console.error('Failed to delete squad period:', error);
          return false;
        }
      },

      setMatchPlanningEnabled: async (enabled) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          const updatedSquad = await setMatchPlanningEnabledService(currentSquad.id, enabled);

          set((state) => ({
            squad: updatedSquad,
            squads: state.squads.map((squad) => (
              squad.id === currentSquad.id ? updatedSquad : squad
            )),
          }));

          return true;
        } catch (error) {
          console.error('Failed to update match planning setting:', error);
          return false;
        }
      },

      addMatchFormat: async (data) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          const newMatchFormat = await addSquadMatchFormatService(currentSquad.id, data);
          const updatedSquad = {
            ...currentSquad,
            matchFormats: [...(currentSquad.matchFormats ?? []), newMatchFormat],
          };

          set((state) => ({
            squad: updatedSquad,
            squads: state.squads.map((squad) => (
              squad.id === currentSquad.id ? updatedSquad : squad
            )),
          }));

          return newMatchFormat;
        } catch (error) {
          console.error('Failed to add playing mode:', error);
          return null;
        }
      },

      updateMatchFormat: async (matchFormatId, data) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          const updatedMatchFormat = await updateSquadMatchFormatService(currentSquad.id, matchFormatId, data);
          const updatedSquad = {
            ...currentSquad,
            matchFormats: (currentSquad.matchFormats ?? []).map((mode) => (
              mode.id === matchFormatId ? updatedMatchFormat : mode
            )),
          };

          set((state) => ({
            squad: updatedSquad,
            squads: state.squads.map((squad) => (
              squad.id === currentSquad.id ? updatedSquad : squad
            )),
          }));

          return true;
        } catch (error) {
          console.error('Failed to update playing mode:', error);
          return false;
        }
      },

      deleteMatchFormat: async (matchFormatId) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          await deleteSquadMatchFormatService(currentSquad.id, matchFormatId);
          const updatedSquad = {
            ...currentSquad,
            matchFormats: (currentSquad.matchFormats ?? []).filter((mode) => mode.id !== matchFormatId),
          };

          set((state) => ({
            squad: updatedSquad,
            squads: state.squads.map((squad) => (
              squad.id === currentSquad.id ? updatedSquad : squad
            )),
          }));

          return true;
        } catch (error) {
          console.error('Failed to delete playing mode:', error);
          return false;
        }
      },

      setDefaultMatchFormat: async (matchFormatId) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          await setDefaultSquadMatchFormatService(currentSquad.id, matchFormatId);
          const updatedSquad = {
            ...currentSquad,
            matchFormats: (currentSquad.matchFormats ?? []).map((mode) => ({
              ...mode,
              isDefault: mode.id === matchFormatId,
            })),
          };

          set((state) => ({
            squad: updatedSquad,
            squads: state.squads.map((squad) => (
              squad.id === currentSquad.id ? updatedSquad : squad
            )),
          }));

          return true;
        } catch (error) {
          console.error('Failed to set default playing mode:', error);
          return false;
        }
      },

      addFormation: async (data) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          const newFormation = await addSquadFormationService(currentSquad.id, data);
          const updatedSquad = {
            ...currentSquad,
            formations: [...(currentSquad.formations ?? []), newFormation],
          };

          set((state) => ({
            squad: updatedSquad,
            squads: state.squads.map((squad) => (
              squad.id === currentSquad.id ? updatedSquad : squad
            )),
          }));

          return newFormation;
        } catch (error) {
          console.error('Failed to add formation:', error);
          return null;
        }
      },

      updateFormation: async (formationId, data) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          const updatedFormation = await updateSquadFormationService(currentSquad.id, formationId, data);
          const updatedSquad = {
            ...currentSquad,
            formations: (currentSquad.formations ?? []).map((formation) => (
              formation.id === formationId ? updatedFormation : formation
            )),
          };

          set((state) => ({
            squad: updatedSquad,
            squads: state.squads.map((squad) => (
              squad.id === currentSquad.id ? updatedSquad : squad
            )),
          }));

          return true;
        } catch (error) {
          console.error('Failed to update formation:', error);
          return false;
        }
      },

      deleteFormation: async (formationId) => {
        const currentSquad = get().squad;
        if (!currentSquad) throw new Error('No squad selected');

        try {
          await deleteSquadFormationService(currentSquad.id, formationId);
          const updatedSquad = {
            ...currentSquad,
            formations: (currentSquad.formations ?? []).filter((formation) => formation.id !== formationId),
          };

          set((state) => ({
            squad: updatedSquad,
            squads: state.squads.map((squad) => (
              squad.id === currentSquad.id ? updatedSquad : squad
            )),
          }));

          return true;
        } catch (error) {
          console.error('Failed to delete formation:', error);
          return false;
        }
      },
      
      // Selectors
      getPlayerById: (id) => playersFromMembers(get().members).find((player) => player.id === id),
      getActivityById: (id) => get().activities.find(e => e.id === id),
      getTrainerById: (id) => trainersFromMembers(get().members).find((trainer) => trainer.id === id),
      getShirtSetById: (id) => get().shirtSets.find(s => s.id === id),
      
      getPlayerStats: (playerId, excludeActivityId) => {
        const activities = excludeActivityId
          ? get().activities.filter(e => e.id !== excludeActivityId)
          : get().activities;
        return getPlayerStats(playerId, activities);
      },

      getTrainerEventHistory: (trainerId) => {
        const getEventStartTime = (activity: Activity): string => getActivityStartTime(activity);

        const getLocation = (teamLocation?: string, eventLocation?: string): string | undefined => {
          if (teamLocation?.trim()) {
            return teamLocation.trim();
          }

          if (eventLocation?.trim()) {
            return eventLocation.trim();
          }

          return undefined;
        };

        const isResponsible = (team: Team) => team.responsiblePersonId === trainerId;

        return get().activities
          .filter((event) => event.teams.some(isResponsible))
          .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
          .map((event) => {
            const team = event.teams.find(isResponsible);
            return {
              eventId: event.id,
              eventName: event.name,
              eventDate: getActivityDate(event),
              startTime: event.kind === 'match' ? getEventStartTime(event) : team?.startTime || getEventStartTime(event),
              location: event.kind === 'match' ? event.location : getLocation(team?.location, event.location),
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
  state.loading.squad || state.loading.players || state.loading.activities || state.loading.trainers || state.loading.shirtSets
);

export const useAppErrors = () => useStore((state) => state.errors);

export const useAppHasErrors = () => useStore((state) => 
  !!(state.errors.players || state.errors.activities || state.errors.trainers || state.errors.shirtSets)
);

export const useAppInitialized = () => useStore((state) => state.isInitialized);

export const useSfvCatalog = () => useStore((state) => state.sfvCatalog);

export const useSquad = () => useStore((state) => state.squad);

export const useSquads = () => useStore((state) => state.squads);

export const useSquadPeriods = () => useStore((state) => state.squad?.periods ?? EMPTY_PERIODS);

const EMPTY_PLAYING_MODES: MatchFormat[] = [];
const EMPTY_FORMATIONS: Formation[] = [];

export const useMatchPlanningEnabled = () => useStore((state) => state.squad?.matchPlanningEnabled ?? false);

export const useSquadMatchFormats = () => useStore((state) => state.squad?.matchFormats ?? EMPTY_PLAYING_MODES);

export const useSquadFormations = () => useStore((state) => state.squad?.formations ?? EMPTY_FORMATIONS);

export const useSelectedStatisticsPeriod = () => useStore((state) => {
  if (!state.selectedStatisticsPeriodId) return null;

  return (state.squad?.periods ?? EMPTY_PERIODS).find(
    (period) => period.id === state.selectedStatisticsPeriodId
  ) ?? null;
});

export const useSquadsLoading = () => useStore((state) => state.loading.squads);

export const useSquadsError = () => useStore((state) => state.errors.squads);

export const useTrainers = () => {
  const members = useStore((state) => state.members);
  return useMemo(() => trainersFromMembers(members), [members]);
};
