import { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import AddPlayerModal from "../components/AddPlayerModal";
import AddTrainerModal from "../components/AddTrainerModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { selectIsSpondLinked } from "../store/selectors/groupSettingsSelectors";
import { selectMemberGuardians } from "../store/selectors/memberGuardiansSelectors";
import { usePlayers, useTrainers, useAppLoading, useAppHasErrors, useAppErrors, useSquad } from "../store";
import {
  PLAYER_DELETE_ROLE_CONSTRAINT_ERROR_MESSAGE,
  PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT_ERROR_MESSAGE,
} from "../store/useStore";
import { useAuth } from "../hooks/useAuth";
import { canManageGuardians } from "../utils/guardians";
import type { Guardian, Player, Trainer } from "../types";

export interface MembersOutletContext {
  players: Player[];
  trainers: Trainer[];
  guardians: Guardian[];
  openAddPlayerModal: () => void;
  openAddTrainerModal: () => void;
  canImportFromSpond: boolean;
  canManageBirthdayCalendar: boolean;
  spondLinked: boolean;
  requestDeletePlayer: (player: Player) => void;
  requestDeleteTrainer: (trainer: Trainer) => void;
}

export default function MembersPage() {
  const { t } = useTranslation();
  
  // Store hooks
  const { players, addPlayer: addPlayerToStore, deletePlayer } = usePlayers();
  const { trainers, addTrainer, deleteTrainer } = useTrainers();
  const squad = useSquad();
  const { user } = useAuth();
  
  // Use individual selectors for loading/error states
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  
  // Modal states
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  
  // Delete confirmation states
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [deletingTrainer, setDeletingTrainer] = useState<Trainer | null>(null);
  const [deleteActionError, setDeleteActionError] = useState<string | null>(null);

  const guardians = useMemo(
    () => selectMemberGuardians(players).map((row) => row.guardian),
    [players]
  );

  const spondLinked = selectIsSpondLinked(squad);

  const isAdmin = useMemo(() => {
    return canManageGuardians(user, squad, trainers);
  }, [user, squad, trainers]);

  // Player handlers
  const handleAddPlayer = async (playerData: Omit<Player, "id">) => {
    const success = await addPlayerToStore(playerData);
    if (success) {
      setIsPlayerModalOpen(false);
    }
  };

  const handleDeletePlayer = (player: Player) => {
    setDeleteActionError(null);
    setDeletingPlayer(player);
  };

  const confirmDeletePlayer = async () => {
    if (deletingPlayer) {
      try {
        const success = await deletePlayer(deletingPlayer.id);
        setDeletingPlayer(null); // Always close dialog
        if (!success) {
          setDeleteActionError(t('members.errors.deletePlayerFailed'));
        }
      } catch (error) {
        setDeletingPlayer(null); // Close dialog even on error
        console.error('Error deleting player:', error);
        if (error instanceof Error && error.message === PLAYER_DELETE_ROLE_CONSTRAINT_ERROR_MESSAGE) {
          setDeleteActionError(t('members.errors.playerHasUnexpectedRoles'));
        } else if (error instanceof Error && error.message === PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT_ERROR_MESSAGE) {
          setDeleteActionError(t('members.errors.playerHasPastTeamAssignments'));
        } else {
          setDeleteActionError(t('members.errors.deletePlayerFailed'));
        }
      }
    }
  };

  const cancelDeletePlayer = () => {
    setDeletingPlayer(null);
  };

  // Trainer handlers
  const handleAddTrainer = async (trainerData: Omit<Trainer, "id">) => {
    const success = await addTrainer(trainerData);
    if (success) {
      setIsTrainerModalOpen(false);
    }
  };

  const handleDeleteTrainer = (trainer: Trainer) => {
    setDeleteActionError(null);
    setDeletingTrainer(trainer);
  };

  const confirmDeleteTrainer = async () => {
    if (deletingTrainer) {
      try {
        const success = await deleteTrainer(deletingTrainer.id);
        
        if (!success) {
          setDeleteActionError(t('members.errors.deleteTrainerFailed'));
        }
      } catch (error) {
        console.error('Error deleting trainer:', error);
        setDeleteActionError(t('members.errors.deleteTrainerFailed'));
      } finally {
        setDeletingTrainer(null); // Always close dialog in finally block
      }
    }
  };

  const cancelDeleteTrainer = () => {
    setDeletingTrainer(null);
  };

  const handleCloseTrainerModal = () => {
    setIsTrainerModalOpen(false);
  };

  const outletContext: MembersOutletContext = {
    players,
    trainers,
    guardians,
    openAddPlayerModal: () => setIsPlayerModalOpen(true),
    openAddTrainerModal: () => setIsTrainerModalOpen(true),
    canImportFromSpond: isAdmin && spondLinked,
    canManageBirthdayCalendar: isAdmin,
    spondLinked,
    requestDeletePlayer: handleDeletePlayer,
    requestDeleteTrainer: handleDeleteTrainer,
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
          <p>{t('members.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t('members.title')}</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">{t('members.subtitle')}</p>
      </div>

      {hasErrors && (errors.players || errors.trainers) && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.players || errors.trainers}
        </div>
      )}

      {deleteActionError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteActionError}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-5 overflow-x-auto">
        <nav className="inline-flex min-w-max gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" aria-label={t('common.tabs')}>
          <NavLink
            to="/members/players"
            className={({ isActive }) => `rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-[#13212b] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {t('domain.players')} ({players.length})
          </NavLink>
          <NavLink
            to="/members/trainers"
            className={({ isActive }) => `rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-[#13212b] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {t('domain.trainers')} ({trainers.length})
          </NavLink>
          {isAdmin && (
          <NavLink
            to="/members/guardians"
            className={({ isActive }) => `rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-[#13212b] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {t('domain.guardians')} ({guardians.length})
          </NavLink>
          )}
        </nav>
      </div>

      <Outlet context={outletContext} />

      {/* Player Modal */}
      <AddPlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        onSave={handleAddPlayer}
        onUpdate={() => {}}
        editingPlayer={null}
      />

      {/* Trainer Modal */}
      <AddTrainerModal
        isOpen={isTrainerModalOpen}
        onClose={handleCloseTrainerModal}
        onSave={handleAddTrainer}
        onUpdate={() => {}}
        editingTrainer={null}
      />

      {/* Delete Player Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingPlayer)}
        title={t('members.deletePlayerTitle')}
        message={t('members.deletePlayerMessage', {
          firstName: deletingPlayer?.firstName ?? '',
          lastName: deletingPlayer?.lastName ?? '',
        })}
        confirmText={t('members.deletePlayerConfirm')}
        cancelText={t('common.actions.cancel')}
        onConfirm={confirmDeletePlayer}
        onCancel={cancelDeletePlayer}
      />

      {/* Delete Trainer Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingTrainer)}
        title={t('members.deleteTrainerTitle')}
        message={t('members.deleteTrainerMessage', {
          firstName: deletingTrainer?.firstName ?? '',
          lastName: deletingTrainer?.lastName ?? '',
        })}
        confirmText={t('members.deleteTrainerConfirm')}
        cancelText={t('common.actions.cancel')}
        onConfirm={confirmDeleteTrainer}
        onCancel={cancelDeleteTrainer}
      />
    </div>
  );
}
