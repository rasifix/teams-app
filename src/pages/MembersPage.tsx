import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
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
import { Alert, Button, Cluster, EmptyState, NavigationTab, NavigationTabs, Page, PageActions, PageDescription, PageHeader, PageHeaderContent, PageTitle } from "../components/ui";
import SpondBadge from '../components/SpondBadge';
import BirthdayCalendarModal from '../components/BirthdayCalendarModal';
import { createBirthdayCalendarSubscription, getBirthdayCalendarSubscription, revokeBirthdayCalendarSubscription } from '../services/squadService';

export interface MembersOutletContext {
  players: Player[];
  trainers: Trainer[];
  guardians: Guardian[];
  openAddPlayerModal: () => void;
  openAddTrainerModal: () => void;
  openBirthdayCalendar: () => void;
  openMember: (memberType: 'players' | 'trainers', memberId: string) => void;
  canImportFromSpond: boolean;
  canManageBirthdayCalendar: boolean;
  spondLinked: boolean;
  requestDeletePlayer: (player: Player) => void;
  requestDeleteTrainer: (trainer: Trainer) => void;
}

export default function MembersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
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
  const [isBirthdayCalendarOpen, setIsBirthdayCalendarOpen] = useState(false);
  const [birthdaySubscriptionUrl, setBirthdaySubscriptionUrl] = useState<string | null>(null);
  const [isBirthdayCalendarLoading, setIsBirthdayCalendarLoading] = useState(false);
  const [isBirthdayCalendarSaving, setIsBirthdayCalendarSaving] = useState(false);
  const [birthdayCalendarError, setBirthdayCalendarError] = useState<string | null>(null);
  const [birthdayCalendarCopied, setBirthdayCalendarCopied] = useState(false);

  const guardians = useMemo(
    () => selectMemberGuardians(players).map((row) => row.guardian),
    [players]
  );

  const spondLinked = selectIsSpondLinked(squad);

  useEffect(() => {
    if (!isBirthdayCalendarOpen || !squad) return;

    let cancelled = false;
    setIsBirthdayCalendarLoading(true);
    setBirthdayCalendarError(null);
    setBirthdayCalendarCopied(false);
    getBirthdayCalendarSubscription(squad.id)
      .then((result) => { if (!cancelled) setBirthdaySubscriptionUrl(result.subscriptionUrl); })
      .catch(() => { if (!cancelled) setBirthdayCalendarError(t('page.members.birthdayCalendar.errors.loadFailed')); })
      .finally(() => { if (!cancelled) setIsBirthdayCalendarLoading(false); });

    return () => { cancelled = true; };
  }, [isBirthdayCalendarOpen, squad?.id, t]);

  const handleCreateBirthdayCalendar = async () => {
    if (!squad) return;
    setIsBirthdayCalendarSaving(true);
    setBirthdayCalendarError(null);
    try {
      const result = await createBirthdayCalendarSubscription(squad.id);
      setBirthdaySubscriptionUrl(result.subscriptionUrl);
    } catch {
      setBirthdayCalendarError(t('page.members.birthdayCalendar.errors.createFailed'));
    } finally {
      setIsBirthdayCalendarSaving(false);
    }
  };

  const handleCopyBirthdayCalendar = async () => {
    if (!birthdaySubscriptionUrl) return;
    try {
      await navigator.clipboard.writeText(birthdaySubscriptionUrl);
      setBirthdayCalendarCopied(true);
    } catch {
      setBirthdayCalendarError(t('page.members.birthdayCalendar.errors.copyFailed'));
    }
  };

  const handleRevokeBirthdayCalendar = async () => {
    if (!squad || !window.confirm(t('page.members.birthdayCalendar.revokeConfirm'))) return;
    setIsBirthdayCalendarSaving(true);
    setBirthdayCalendarError(null);
    try {
      await revokeBirthdayCalendarSubscription(squad.id);
      setBirthdaySubscriptionUrl(null);
      setBirthdayCalendarCopied(false);
    } catch {
      setBirthdayCalendarError(t('page.members.birthdayCalendar.errors.revokeFailed'));
    } finally {
      setIsBirthdayCalendarSaving(false);
    }
  };

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
          setDeleteActionError(t('page.members.errors.deletePlayerFailed'));
        }
      } catch (error) {
        setDeletingPlayer(null); // Close dialog even on error
        console.error('Error deleting player:', error);
        if (error instanceof Error && error.message === PLAYER_DELETE_ROLE_CONSTRAINT_ERROR_MESSAGE) {
          setDeleteActionError(t('page.members.errors.playerHasUnexpectedRoles'));
        } else if (error instanceof Error && error.message === PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT_ERROR_MESSAGE) {
          setDeleteActionError(t('page.members.errors.playerHasPastTeamAssignments'));
        } else {
          setDeleteActionError(t('page.members.errors.deletePlayerFailed'));
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
          setDeleteActionError(t('page.members.errors.deleteTrainerFailed'));
        }
      } catch (error) {
        console.error('Error deleting trainer:', error);
        setDeleteActionError(t('page.members.errors.deleteTrainerFailed'));
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
    openBirthdayCalendar: () => setIsBirthdayCalendarOpen(true),
    openMember: (memberType, memberId) => navigate(`/${memberType}/${memberId}`),
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
          <p>{t('page.members.loading')}</p>
        </EmptyState>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader align="start">
        <PageHeaderContent>
          <PageTitle>{t('page.members.title')}</PageTitle>
          <PageDescription>{t('page.members.subtitle')}</PageDescription>
        </PageHeaderContent>
        <PageActions>
          {isAdmin && spondLinked && (
            <Button variant="secondary" size="sm" onClick={() => navigate('/spond-import?scope=players')}>
              <Cluster gap="sm" wrap={false}><SpondBadge />{t('spondSync.syncAction')}</Cluster>
            </Button>
          )}
        </PageActions>
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

      {squad && <BirthdayCalendarModal
        isOpen={isBirthdayCalendarOpen}
        onClose={() => setIsBirthdayCalendarOpen(false)}
        subscriptionUrl={birthdaySubscriptionUrl}
        isLoading={isBirthdayCalendarLoading}
        isSaving={isBirthdayCalendarSaving}
        error={birthdayCalendarError}
        copied={birthdayCalendarCopied}
        onCreate={() => void handleCreateBirthdayCalendar()}
        onCopy={() => void handleCopyBirthdayCalendar()}
        onRevoke={() => void handleRevokeBirthdayCalendar()}
      />}

      {/* Tab Navigation */}
      <NavigationTabs label={t('common.tabs')} mobileFit className="members-tabs">
          <NavigationTab to="/members/players">
            {t('domain.player.plural')} <span className={'ui-tab-count'}>({players.length})</span>
          </NavigationTab>
          <NavigationTab to="/members/trainers">
            {t('domain.trainer.plural')} <span className={'ui-tab-count'}>({trainers.length})</span>
          </NavigationTab>
          {isAdmin && (
          <NavigationTab to="/members/guardians">
            {t('domain.guardian.plural')} <span className={'ui-tab-count'}>({guardians.length})</span>
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
        title={t('page.members.deletePlayerTitle')}
        message={t('page.members.deletePlayerMessage', {
          firstName: deletingPlayer?.firstName ?? '',
          lastName: deletingPlayer?.lastName ?? '',
        })}
        confirmText={t('page.members.deletePlayerConfirm')}
        cancelText={t('common.actions.cancel')}
        onConfirm={confirmDeletePlayer}
        onCancel={cancelDeletePlayer}
      />

      {/* Delete Trainer Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingTrainer)}
        title={t('page.members.deleteTrainerTitle')}
        message={t('page.members.deleteTrainerMessage', {
          firstName: deletingTrainer?.firstName ?? '',
          lastName: deletingTrainer?.lastName ?? '',
        })}
        confirmText={t('page.members.deleteTrainerConfirm')}
        cancelText={t('common.actions.cancel')}
        onConfirm={confirmDeleteTrainer}
        onCancel={cancelDeleteTrainer}
      />
    </Page>
  );
}
