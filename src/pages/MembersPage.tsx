import { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import AddPlayerModal from "../components/AddPlayerModal";
import AddTrainerModal from "../components/AddTrainerModal";
import ConfirmDialog from "../components/ConfirmDialog";
import ImportMembersModal from "../components/ImportMembersModal";
import { selectMemberGuardians } from "../store/selectors/memberGuardiansSelectors";
import { usePlayers, useTrainers, useAppLoading, useAppHasErrors, useAppErrors } from "../store";
import type { Guardian, Player, Trainer } from "../types";

export interface MembersOutletContext {
  players: Player[];
  trainers: Trainer[];
  guardians: Guardian[];
  openAddPlayerModal: () => void;
  openAddTrainerModal: () => void;
  openImportModal: () => void;
  requestDeletePlayer: (player: Player) => void;
  requestDeleteTrainer: (trainer: Trainer) => void;
}

export default function MembersPage() {
  const { t } = useTranslation();
  
  // Store hooks
  const { players, addPlayer: addPlayerToStore, deletePlayer } = usePlayers();
  const { trainers, addTrainer, deleteTrainer } = useTrainers();
  
  // Use individual selectors for loading/error states
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  
  // Modal states
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Delete confirmation states
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [deletingTrainer, setDeletingTrainer] = useState<Trainer | null>(null);

  const guardians = useMemo(
    () => selectMemberGuardians(players).map((row) => row.guardian),
    [players]
  );

  // Player handlers
  const handleAddPlayer = async (playerData: Omit<Player, "id">) => {
    const success = await addPlayerToStore(playerData);
    if (success) {
      setIsPlayerModalOpen(false);
    }
  };

  const handleDeletePlayer = (player: Player) => {
    setDeletingPlayer(player);
  };

  const confirmDeletePlayer = async () => {
    if (deletingPlayer) {
      try {
        const success = await deletePlayer(deletingPlayer.id);
        setDeletingPlayer(null); // Always close dialog
        if (!success) {
          console.error('Failed to delete player');
        }
      } catch (error) {
        setDeletingPlayer(null); // Close dialog even on error
        console.error('Error deleting player:', error);
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
    setDeletingTrainer(trainer);
  };

  const confirmDeleteTrainer = async () => {
    if (deletingTrainer) {
      try {
        const success = await deleteTrainer(deletingTrainer.id);
        
        if (!success) {
          console.error('Failed to delete trainer');
        }
      } catch (error) {
        console.error('Error deleting trainer:', error);
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
    openImportModal: () => setIsImportModalOpen(true),
    requestDeletePlayer: handleDeletePlayer,
    requestDeleteTrainer: handleDeleteTrainer,
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>{t('members.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container lg:px-4 px-0">
      {hasErrors && (errors.players || errors.trainers) && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mx-4 lg:mx-0">
          {errors.players || errors.trainers}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6 px-4 lg:px-0">
        <nav className="flex gap-8" aria-label={t('common.tabs')}>
          <NavLink
            to="/members/players"
            className={({ isActive }) => `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('domain.players')} ({players.length})
          </NavLink>
          <NavLink
            to="/members/trainers"
            className={({ isActive }) => `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('domain.trainers')} ({trainers.length})
          </NavLink>
          <NavLink
            to="/members/guardians"
            className={({ isActive }) => `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('domain.guardians')} ({guardians.length})
          </NavLink>
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

      <ImportMembersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
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