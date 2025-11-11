
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Player, Event, Trainer, ShirtSet, Team } from '../types';
import { getPlayerStats } from '../utils/playerStats';
import { getPlayers, addPlayer as addPlayerService, updatePlayer as updatePlayerService, deletePlayer as deletePlayerService } from '../services/playerService';
import { getEvents } from '../services/eventService';
import { getTrainers, addTrainer as addTrainerService, updateTrainer as updateTrainerService, deleteTrainer as deleteTrainerService } from '../services/trainerService';
import { getShirtSets } from '../services/shirtService';

// Helper function to sort players alphabetically by lastName + firstName
const sortPlayers = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => {
    const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
    const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
    return nameA.localeCompare(nameB);
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
  
  // Trainer mutations
  addTrainer: (trainerData: Omit<Trainer, 'id'>) => Promise<boolean>;
  updateTrainer: (id: string, trainerData: Partial<Trainer>) => Promise<boolean>;
  deleteTrainer: (id: string) => Promise<boolean>;
  
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
            getPlayers().then((players: Player[]) => ({ type: 'players' as const, data: players })),
            getEvents().then((events: Event[]) => ({ type: 'events' as const, data: events })),
            getTrainers().then((trainers: Trainer[]) => ({ type: 'trainers' as const, data: trainers })),
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
              if (type === 'players') newState.players = data as Player[];
              else if (type === 'events') newState.events = data as Event[];
              else if (type === 'trainers') newState.trainers = data as Trainer[];
              else if (type === 'shirtSets') newState.shirtSets = data as ShirtSet[];
            } else {
              const types = ['players', 'events', 'trainers', 'shirtSets'] as const;
              const type = types[index];
              newState.errors[type] = result.reason?.message || 'Failed to load data';
            }
          });
          
          set({ ...newState, isInitialized: true });
        };

        await loadData();
      },
      
      // Actions
      setPlayers: (players) => set({ players: sortPlayers(players) }),
      setEvents: (events) => set({ events }),
      setTrainers: (trainers) => set({ trainers }),
      setShirtSets: (shirtSets) => set({ shirtSets }),
      
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
      
      // Trainer mutations
      addTrainer: async (trainerData) => {
        try {
          const newTrainer = await addTrainerService(trainerData);
          const currentTrainers = get().trainers;
          set({ trainers: [...currentTrainers, newTrainer] });
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
          set({ trainers: updatedTrainers });
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
          set({ trainers: filteredTrainers });
          return true;
        } catch (error) {
          console.error('Failed to delete trainer:', error);
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