import { useMemo } from 'react';
import { useStore, useSquadMatchFormats, useSquadFormations } from './useStore';
import { selectPlayersFromMembers, selectTrainersFromMembers } from './selectors/memberSelectors';

// Re-export store hooks for easier imports
export { 
  useStore,
  useAppLoading,
  useAppErrors,
  useAppHasErrors,
  useAppInitialized,
  useSfvCatalog,
  useSquad,
  useSquadPeriods,
  useSquads,
  useSelectedStatisticsPeriod,
  useSquadsLoading,
  useSquadsError,
  useMatchPlanningEnabled,
  useSquadMatchFormats,
  useSquadFormations,
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

// Hook specifically for activities data and mutations
export const useActivities = () => {
  const activities = useStore((state) => state.activities);
  const getActivityById = useStore((state) => state.getActivityById);
  const addActivity = useStore((state) => state.addActivity);
  const updateActivity = useStore((state) => state.updateActivity);
  const updateActivityInvitation = useStore((state) => state.updateActivityInvitation);
  const setActivityInvitations = useStore((state) => state.setActivityInvitations);
  const updateActivityTeams = useStore((state) => state.updateActivityTeams);
  const updateActivitySelection = useStore((state) => state.updateActivitySelection);
  const markActivitySelectionSent = useStore((state) => state.markActivitySelectionSent);
  const updateActivityAttendance = useStore((state) => state.updateActivityAttendance);
  const deleteActivity = useStore((state) => state.deleteActivity);
  const cancelActivity = useStore((state) => state.cancelActivity);
  const restoreActivity = useStore((state) => state.restoreActivity);

  return {
    activities,
    getActivityById,
    addActivity,
    updateActivity,
    updateActivityInvitation,
    setActivityInvitations,
    updateActivityTeams,
    updateActivitySelection,
    markActivitySelectionSent,
    updateActivityAttendance,
    deleteActivity,
    cancelActivity,
    restoreActivity,
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

// Hook for match planning: matchPlanningEnabled toggle, playing modes, and formations
export const useMatchPlanning = () => {
  const matchPlanningEnabled = useStore((state) => state.squad?.matchPlanningEnabled ?? false);
  const matchFormats = useSquadMatchFormats();
  const formations = useSquadFormations();
  const setMatchPlanningEnabled = useStore((state) => state.setMatchPlanningEnabled);
  const configureSquadCategory = useStore((state) => state.configureSquadCategory);
  const addMatchFormat = useStore((state) => state.addMatchFormat);
  const updateMatchFormat = useStore((state) => state.updateMatchFormat);
  const deleteMatchFormat = useStore((state) => state.deleteMatchFormat);
  const setDefaultMatchFormat = useStore((state) => state.setDefaultMatchFormat);
  const addFormation = useStore((state) => state.addFormation);
  const updateFormation = useStore((state) => state.updateFormation);
  const deleteFormation = useStore((state) => state.deleteFormation);

  return {
    matchPlanningEnabled,
    matchFormats,
    formations,
    setMatchPlanningEnabled,
    configureSquadCategory,
    addMatchFormat,
    updateMatchFormat,
    deleteMatchFormat,
    setDefaultMatchFormat,
    addFormation,
    updateFormation,
    deleteFormation,
  };
};
