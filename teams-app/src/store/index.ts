import { useStore } from './useStore';

// Re-export store hooks for easier imports
export { 
  useStore,
  useAppLoading,
  useAppErrors,
  useAppHasErrors,
  useAppInitialized
} from './useStore';

// Individual entity hooks for convenience

// Hook specifically for players data and related selectors
export const usePlayers = () => {
  const players = useStore((state) => state.players);
  const getPlayerById = useStore((state) => state.getPlayerById);
  const getPlayerStats = useStore((state) => state.getPlayerStats);
  const addPlayer = useStore((state) => state.addPlayer);
  const updatePlayer = useStore((state) => state.updatePlayer);
  const deletePlayer = useStore((state) => state.deletePlayer);
  
  return {
    players,
    getPlayerById,
    getPlayerStats,
    addPlayer,
    updatePlayer,
    deletePlayer,
  };
};

// Hook specifically for events data and related selectors  
export const useEvents = () => {
  const events = useStore((state) => state.events);
  const getEventById = useStore((state) => state.getEventById);
  
  return {
    events,
    getEventById,
  };
};

// Hook specifically for trainers data
export const useTrainers = () => {
  const trainers = useStore((state) => state.trainers);
  const getTrainerById = useStore((state) => state.getTrainerById);
  const addTrainer = useStore((state) => state.addTrainer);
  const updateTrainer = useStore((state) => state.updateTrainer);
  const deleteTrainer = useStore((state) => state.deleteTrainer);
  
  return {
    trainers,
    getTrainerById,
    addTrainer,
    updateTrainer,
    deleteTrainer,
  };
};

// Hook specifically for shirt sets data
export const useShirtSets = () => {
  const shirtSets = useStore((state) => state.shirtSets);
  const getShirtSetById = useStore((state) => state.getShirtSetById);
  
  return {
    shirtSets,
    getShirtSetById,
  };
};