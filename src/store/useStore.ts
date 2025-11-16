
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Player, Event, Trainer, ShirtSet, Team, Group } from '../types';
import { getPlayerStats } from '../utils/playerStats';
import { getAllMembers, addPlayer as addPlayerService, updatePlayer as updatePlayerService, deletePlayer as deletePlayerService, addTrainer as addTrainerService, updateTrainer as updateTrainerService, deleteTrainer as deleteTrainerService } from '../services/memberService';
import { getEvents, addEvent as addEventService, updateEvent as updateEventService, deleteEvent as deleteEventService } from '../services/eventService';
import { getShirtSets, addShirtSet as addShirtSetService, updateShirtSet as updateShirtSetService, deleteShirtSet as deleteShirtSetService, addShirtToSet as addShirtToSetService, removeShirtFromSet as removeShirtFromSetService, updateShirt as updateShirtService } from '../services/shirtService';
import { getGroups } from '../services/groupService';
import { setSelectedGroupId, clearSelectedGroupId } from '../utils/localStorage';

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

interface AppState {
  // Data
  group: Group | null;
  groups: Group[];
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
  selectGroup: (groupId: string) => Promise<void>;
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
  
  // Event mutations
  addEvent: (eventData: Omit<Event, 'id'>) => Promise<boolean>;
  updateEvent: (id: string, eventData: Partial<Event>) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  
  // Trainer mutations
  addTrainer: (trainerData: Omit<Trainer, 'id'>) => Promise<boolean>;
  updateTrainer: (id: string, trainerData: Partial<Trainer>) => Promise<boolean>;
  deleteTrainer: (id: string) => Promise<boolean>;
  
  // Shirt set mutations
  addShirtSet: (shirtSetData: Omit<ShirtSet, 'id'>) => Promise<ShirtSet | null>;
  updateShirtSet: (id: string, shirtSetData: Partial<ShirtSet>) => Promise<boolean>;
  deleteShirtSet: (id: string) => Promise<boolean>;
  addShirtToSet: (shirtSetId: string, shirtData: import('../types').Shirt) => Promise<import('../types').Shirt | null>;
  removeShirtFromSet: (shirtSetId: string, shirtNumber: number) => Promise<boolean>;
  updateShirt: (shirtSetId: string, updatedShirt: import('../types').Shirt) => Promise<boolean>;
  
  // Selectors (computed values)
  getPlayerById: (id: string) => Player | undefined;
  getEventById: (id: string) => Event | undefined;
  getTrainerById: (id: string) => Trainer | undefined;
  getShirtSetById: (id: string) => ShirtSet | undefined;
  getPlayerStats: (playerId: string, excludeEventId?: string) => ReturnType<typeof getPlayerStats>;
  getTeamAverageLevel: (team: Team) => number;
}

export const useStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      group: null,
      groups: [],
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
        
        // Set all loading states
        set({
          loading: {
            group: true,
            groups: true,
            players: true,
            events: true,
            trainers: true,
            shirtSets: true,
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
          const currentGroup = get().group;
          if (!currentGroup) {
            throw new Error('No group selected');
          }
          
          const results = await Promise.allSettled([
            Promise.resolve({ type: 'group' as const, data: currentGroup }),
            getAllMembers(currentGroup.id).then((members) => ({ type: 'members' as const, data: members })),
            getEvents(currentGroup.id).then((events: Event[]) => ({ type: 'events' as const, data: events })),
            getShirtSets(currentGroup.id).then((shirtSets: ShirtSet[]) => ({ type: 'shirtSets' as const, data: shirtSets })),
          ]);
          
          const newState = {
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
            players: state.players,
            events: state.events,
            trainers: state.trainers,
            shirtSets: state.shirtSets,
          };
          
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              const { type, data } = result.value;
              if (type === 'group') {
                newState.group = data as Group;
              } else if (type === 'members') {
                const membersData = data as { players: Player[], trainers: Trainer[] };
                newState.players = sortPlayers(membersData.players);
                newState.trainers = sortTrainers(membersData.trainers);
              } else if (type === 'events') {
                newState.events = sortEvents(data as Event[]);
              } else if (type === 'shirtSets') {
                newState.shirtSets = sortShirtSets(data as ShirtSet[]);
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
              } else if (index === 3) {
                // ShirtSets call failed
                newState.errors.shirtSets = result.reason?.message || 'Failed to load shirt sets';
              }
            }
          });
          
          set({ ...newState, isInitialized: true });
        };

        await loadData();
      },
      
      clearAuthenticatedData: () => {
        clearSelectedGroupId();
        set({
          group: null,
          groups: [],
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
          set({ groups, loading: { ...get().loading, groups: false } });
        } catch (error) {
          console.error('Failed to load groups:', error);
          set({ 
            loading: { ...get().loading, groups: false }, 
            errors: { ...get().errors, groups: error instanceof Error ? error.message : 'Failed to load groups' }
          });
        }
      },
      
      selectGroup: async (groupId: string) => {
        // Set the selected group (simplified: just use the groupId directly)
        const groups = get().groups;
        const selectedGroup = groups.find(g => g.id === groupId);
        
        // If group is in the groups array, use it; otherwise create a minimal group object
        const group = selectedGroup || { id: groupId, name: `Group ${groupId}` };
        set({ group });
        setSelectedGroupId(groupId);
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
          const newPlayer = await addPlayerService(currentGroup.id, playerData);
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
          const updatedPlayer = await updatePlayerService(currentGroup.id, id, playerData);
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
          await deletePlayerService(currentGroup.id, id);
          const currentPlayers = get().players;
          const filteredPlayers = currentPlayers.filter(player => player.id !== id);
          set({ players: sortPlayers(filteredPlayers) });
          return true;
        } catch (error) {
          console.error('Failed to delete player:', error);
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
          const newTrainer = await addTrainerService(currentGroup.id, trainerData);
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
          const updatedTrainer = await updateTrainerService(currentGroup.id, id, trainerData);
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
          await deleteTrainerService(currentGroup.id, id);
          const currentTrainers = get().trainers;
          const filteredTrainers = currentTrainers.filter(trainer => trainer.id !== id);
          set({ trainers: sortTrainers(filteredTrainers) });
          return true;
        } catch (error) {
          console.error('Failed to delete trainer:', error);
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

export const useGroupsLoading = () => useStore((state) => state.loading.groups);

export const useGroupsError = () => useStore((state) => state.errors.groups);

export const useTrainers = () => useStore((state) => state.trainers);