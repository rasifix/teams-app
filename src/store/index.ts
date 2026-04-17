import { useMemo } from 'react';
import { useStore } from './useStore';
import { selectPlayersFromMembers, selectTrainersFromMembers } from './selectors/memberSelectors';

// Re-export store hooks for easier imports
export { 
  useStore,
  useAppLoading,
  useAppErrors,
  useAppHasErrors,
  useAppInitialized,
  useGroup,
  useGroupPeriods,
  useGroups,
  useSelectedStatisticsPeriod,
  useGroupsLoading,
  useGroupsError
} from './useStore';

// Individual entity hooks for convenience

// Hook specifically for players data and related selectors
export const usePlayers = () => {
  const members = useStore((state) => state.members);
  const players = useMemo(() => selectPlayersFromMembers(members), [members]);
  const getPlayerById = useStore((state) => state.getPlayerById);
  const getPlayerStats = useStore((state) => state.getPlayerStats);
  const addPlayer = useStore((state) => state.addPlayer);
  const updatePlayer = useStore((state) => state.updatePlayer);
  const deletePlayer = useStore((state) => state.deletePlayer);
  const addGuardianToPlayer = useStore((state) => state.addGuardianToPlayer);
  const deleteGuardianFromPlayer = useStore((state) => state.deleteGuardianFromPlayer);
  const editGuardianForPlayer = useStore((state) => state.editGuardianForPlayer);
  const mergeGuardianDuplicates = useStore((state) => state.mergeGuardianDuplicates);
  
  return {
    players,
    getPlayerById,
    getPlayerStats,
    addPlayer,
    updatePlayer,
    deletePlayer,
    addGuardianToPlayer,
    deleteGuardianFromPlayer,
    editGuardianForPlayer,
    mergeGuardianDuplicates,
  };
};

// Hook specifically for events data and related selectors  
export const useEvents = () => {
  const events = useStore((state) => state.events);
  const getEventById = useStore((state) => state.getEventById);
  const addEvent = useStore((state) => state.addEvent);
  const updateEvent = useStore((state) => state.updateEvent);
  const updateInvitationStatus = useStore((state) => state.updateInvitationStatus);
  const deleteEvent = useStore((state) => state.deleteEvent);
  
  return {
    events,
    getEventById,
    addEvent,
    updateEvent,
    updateInvitationStatus,
    deleteEvent,
  };
};

// Hook specifically for trainers data
export const useTrainers = () => {
  const members = useStore((state) => state.members);
  const trainers = useMemo(() => selectTrainersFromMembers(members), [members]);
  const getTrainerById = useStore((state) => state.getTrainerById);
  const getTrainerEventHistory = useStore((state) => state.getTrainerEventHistory);
  const addTrainer = useStore((state) => state.addTrainer);
  const updateTrainer = useStore((state) => state.updateTrainer);
  const deleteTrainer = useStore((state) => state.deleteTrainer);
  const assignTrainerRole = useStore((state) => state.assignTrainerRole);
  const mergeGuardianIntoTrainer = useStore((state) => state.mergeGuardianIntoTrainer);
  
  return {
    trainers,
    getTrainerById,
    getTrainerEventHistory,
    addTrainer,
    updateTrainer,
    deleteTrainer,
    assignTrainerRole,
    mergeGuardianIntoTrainer,
  };
};

// Hook specifically for shirt sets data
export const useShirtSets = () => {
  const shirtSets = useStore((state) => state.shirtSets);
  const getShirtSetById = useStore((state) => state.getShirtSetById);
  const addShirtSet = useStore((state) => state.addShirtSet);
  const updateShirtSet = useStore((state) => state.updateShirtSet);
  const deleteShirtSet = useStore((state) => state.deleteShirtSet);
  const addShirtToSet = useStore((state) => state.addShirtToSet);
  const removeShirtFromSet = useStore((state) => state.removeShirtFromSet);
  const updateShirt = useStore((state) => state.updateShirt);
  
  return {
    shirtSets,
    getShirtSetById,
    addShirtSet,
    updateShirtSet,
    deleteShirtSet,
    addShirtToSet,
    removeShirtFromSet,
    updateShirt,
  };
};