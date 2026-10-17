import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import AddPlayerModal from "../components/AddPlayerModal";
import AddTrainerModal from "../components/AddTrainerModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { selectIsSpondLinked } from "../store/selectors/squadSettingsSelectors";
import { selectMemberGuardians } from "../store/selectors/memberGuardiansSelectors";
import { usePlayers, useTrainers, useAppLoading, useAppHasErrors, useAppErrors, useSquad } from "../store";
import {
  PLAYER_DELETE_ROLE_CONSTRAINT_ERROR_MESSAGE,
  PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT_ERROR_MESSAGE,
} from "../store/useStore";
import { useAuth } from "../hooks/useAuth";
import { canManageGuardians } from "../utils/guardians";
import type { Guardian, Player, Trainer } from "../types";
import { Alert, EmptyState, NavigationTab, NavigationTabs, Page, PageDescription, PageHeader, PageHeaderContent, PageTitle } from "../components/ui";

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
      <Page>
        <EmptyState>
          <p>{t('members.loading')}</p>
        </EmptyState>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>{t('members.title')}</PageTitle>
          <PageDescription>{t('members.subtitle')}</PageDescription>
        </PageHeaderContent>
      </PageHeader>

      {hasErrors && (errors.players || errors.trainers) && (
        <Alert>
          {errors.players || errors.trainers}
        </Alert>
      )}

      {deleteActionError && (
        <Alert>
          {deleteActionError}
        </Alert>
      )}

      {/* Tab Navigation */}
      <NavigationTabs label={t('common.tabs')} className="mb-5">
          <NavigationTab to="/members/players">
            {t('domain.players')} ({players.length})
          </NavigationTab>
          <NavigationTab to="/members/trainers">
            {t('domain.trainers')} ({trainers.length})
          </NavigationTab>
          {isAdmin && (
          <NavigationTab to="/members/guardians">
            {t('domain.guardians')} ({guardians.length})
          </NavigationTab>
          )}
      </NavigationTabs>

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
    </Page>
  );
}
