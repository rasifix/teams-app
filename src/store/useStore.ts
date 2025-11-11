
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Player, Event, Trainer, ShirtSet, Team } from '../types';
import { getPlayerStats } from '../utils/playerStats';
import { getAllMembers, addPlayer as addPlayerService, updatePlayer as updatePlayerService, deletePlayer as deletePlayerService, addTrainer as addTrainerService, updateTrainer as updateTrainerService, deleteTrainer as deleteTrainerService } from '../services/memberService';
import { getEvents, addEvent as addEventService, updateEvent as updateEventService, deleteEvent as deleteEventService } from '../services/eventService';
import { getShirtSets, addShirtSet as addShirtSetService, updateShirtSet as updateShirtSetService, deleteShirtSet as deleteShirtSetService, addShirtToSet as addShirtToSetService, removeShirtFromSet as removeShirtFromSetService, updateShirt as updateShirtService } from '../services/shirtService';

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
  players: Player[];
  events: Event[];
  trainers: Trainer[];
  shirtSets: ShirtSet[];
  
  // Loading states
  loading: {
    players: boolean;
    events: boolean;
    trainers: boolean;
    shirtSets: boolean;
  };
  
  // Error states
  errors: {
    players: string | null;
    events: string | null;
    trainers: string | null;
    shirtSets: string | null;
  };
  
  // Initialization tracking
  isInitialized: boolean;
  
  // Actions
  initializeApp: () => Promise<void>;
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
      players: [],
      events: [],
      trainers: [],
      shirtSets: [],
      isInitialized: false,
      loading: {
        players: false,
        events: false,
        trainers: false,
        shirtSets: false,
      },
      errors: {
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
            players: true,
            events: true,
            trainers: true,
            shirtSets: true,
          },
          errors: {
            players: null,
            events: null,
            trainers: null,
            shirtSets: null,
          },
        });
        
        // Load all data in parallel
        const loadData = async () => {
          const results = await Promise.allSettled([
            getAllMembers().then((members) => ({ type: 'members' as const, data: members })),
            getEvents().then((events: Event[]) => ({ type: 'events' as const, data: events })),
            getShirtSets().then((shirtSets: ShirtSet[]) => ({ type: 'shirtSets' as const, data: shirtSets })),
          ]);
          
          const newState = {
            loading: {
              players: false,
              events: false,
              trainers: false,
              shirtSets: false,
            },
            errors: {
              players: null,
              events: null,
              trainers: null,
              shirtSets: null,
            },
            players: state.players,
            events: state.events,
            trainers: state.trainers,
            shirtSets: state.shirtSets,
          };
          
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              const { type, data } = result.value;
              if (type === 'members') {
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
                // Members call failed - set error for both players and trainers
                newState.errors.players = result.reason?.message || 'Failed to load members';
                newState.errors.trainers = result.reason?.message || 'Failed to load members';
              } else if (index === 1) {
                // Events call failed
                newState.errors.events = result.reason?.message || 'Failed to load events';
              } else if (index === 2) {
                // ShirtSets call failed
                newState.errors.shirtSets = result.reason?.message || 'Failed to load shirt sets';
              }
            }
          });
          
          set({ ...newState, isInitialized: true });
        };

        await loadData();
      },
      
      // Actions
      setPlayers: (players) => set({ players: sortPlayers(players) }),
      setEvents: (events) => set({ events: sortEvents(events) }),
      setTrainers: (trainers) => set({ trainers: sortTrainers(trainers) }),
      setShirtSets: (shirtSets) => set({ shirtSets: sortShirtSets(shirtSets) }),
      
      // Player mutations
      addPlayer: async (playerData) => {
        try {
          const newPlayer = await addPlayerService(playerData);
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
        try {
          const updatedPlayer = await updatePlayerService(id, playerData);
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
        try {
          await deletePlayerService(id);
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
        try {
          const newEvent = await addEventService(eventData);
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
        try {
          const updatedEvent = await updateEventService(id, eventData);
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
        try {
          await deleteEventService(id);
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
        try {
          const newTrainer = await addTrainerService(trainerData);
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
        try {
          const updatedTrainer = await updateTrainerService(id, trainerData);
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
        try {
          await deleteTrainerService(id);
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
        try {
          const newShirtSet = await addShirtSetService(shirtSetData);
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
        try {
          await updateShirtSetService(id, shirtSetData);
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
        try {
          await deleteShirtSetService(id);
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
        try {
          const newShirt = await addShirtToSetService(shirtSetId, shirtData);
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
        try {
          await removeShirtFromSetService(shirtSetId, shirtNumber);
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
        try {
          await updateShirtService(shirtSetId, updatedShirt);
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
  state.loading.players || state.loading.events || state.loading.trainers || state.loading.shirtSets
);

export const useAppErrors = () => useStore((state) => state.errors);

export const useAppHasErrors = () => useStore((state) => 
  !!(state.errors.players || state.errors.events || state.errors.trainers || state.errors.shirtSets)
);

export const useAppInitialized = () => useStore((state) => state.isInitialized);