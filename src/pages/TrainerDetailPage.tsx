import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { selectIsSpondLinked } from '../store/selectors/squadSettingsSelectors';
import { useSquad, useTrainers, useAppLoading, useAppHasErrors, useAppErrors, useSquadPeriods, useAppInitialized } from '../store';
import type { Period, Trainer } from '../types';
import { ActionCard, ActionCardTitle, Alert, Button, DateColumn, EmptyState, Page, PageDescription, PageHeader, PageHeaderContent, PageTitle, PageToolbar, Panel, PanelDescription, PanelHeader, PanelTitle } from '../components/ui';
import AddTrainerModal from '../components/AddTrainerModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Strength from '../components/Strength';

interface TrainerEventHistoryItem {
  eventId: string;
  eventName: string;
  eventDate: string;
  startTime?: string;
  location?: string;
  teamName?: string;
  teamStrength: number;
}

interface GroupedTrainerEventHistory {
  id: string;
  title: string;
  eventHistory: TrainerEventHistoryItem[];
}

const toComparableDate = (dateString: string): string | null => {
  if (!dateString) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidPeriod = (period: Period): boolean => period.startDate < period.endDate;

const hasNonOverlappingPeriods = (periods: Period[]): boolean => {
  if (periods.length < 2) {
    return true;
  }

  const sortedPeriods = [...periods].sort((left, right) => {
    const startCompare = left.startDate.localeCompare(right.startDate);
    if (startCompare !== 0) {
      return startCompare;
    }

    return left.endDate.localeCompare(right.endDate);
  });

  for (let index = 1; index < sortedPeriods.length; index += 1) {
    const previous = sortedPeriods[index - 1];
    const current = sortedPeriods[index];

    if (current.startDate < previous.endDate) {
      return false;
    }
  }

  return true;
};

export default function TrainerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Use store hooks
  const { updateTrainer, deleteTrainer, getTrainerById, getTrainerEventHistory } = useTrainers();
  const squadPeriods = useSquadPeriods();
  const spondLinked = selectIsSpondLinked(useSquad());
  const isInitialized = useAppInitialized();
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteActionError, setDeleteActionError] = useState<string | null>(null);

  // Get trainer from store
  const trainer = id ? getTrainerById(id) : null;

  // Keep hooks unconditionally ordered across renders.
  const trainerEventHistory: TrainerEventHistoryItem[] = useMemo(
    () => (trainer ? getTrainerEventHistory(trainer.id) : []),
    [getTrainerEventHistory, trainer]
  );

  const groupedTrainerEventHistory = useMemo<GroupedTrainerEventHistory[] | null>(() => {
    if (!trainer) {
      return null;
    }

    const validPeriods = squadPeriods.filter(isValidPeriod);

    if (validPeriods.length === 0 || !hasNonOverlappingPeriods(validPeriods)) {
      return null;
    }

    const groupedByPeriod: GroupedTrainerEventHistory[] = validPeriods.map((period) => ({
      id: period.id,
      title: period.name,
      eventHistory: [],
    }));

    const outsidePeriods: TrainerEventHistoryItem[] = [];

    trainerEventHistory.forEach((historyItem) => {
      const eventDate = toComparableDate(historyItem.eventDate);
      if (!eventDate) {
        outsidePeriods.push(historyItem);
        return;
      }

      const matchingIndex = validPeriods.findIndex((period) => (
        eventDate >= period.startDate && eventDate < period.endDate
      ));

      if (matchingIndex >= 0) {
        groupedByPeriod[matchingIndex].eventHistory.push(historyItem);
      } else {
        outsidePeriods.push(historyItem);
      }
    });

    const nonEmptySquads = groupedByPeriod.filter((group) => group.eventHistory.length > 0);

    if (outsidePeriods.length > 0) {
      nonEmptySquads.push({
        id: 'outside-periods',
        title: t('statistics.period.outsidePeriods'),
        eventHistory: outsidePeriods,
      });
    }

    return nonEmptySquads.length > 0 ? nonEmptySquads.reverse() : null;
  }, [squadPeriods, t, trainer, trainerEventHistory]);

  // Determine loading and error states
  const loading = isLoading;
  const error = !id ? t('trainerDetail.errors.noTrainerId') :
    (!trainer && !loading) ? t('trainerDetail.errors.notFound') :
      errors.trainers || (hasErrors ? t('trainerDetail.errors.failedToLoadData') : null);

  useEffect(() => {
    if (isInitialized && !loading && id && !trainer) {
      navigate('/members/trainers', { replace: true });
    }
  }, [isInitialized, loading, id, trainer, navigate]);

  if (loading) {
    return (
      <Page>
        <EmptyState>
          <p>{t('trainerDetail.loading')}</p>
        </EmptyState>
      </Page>
    );
  }

  if (error) {
    if (isInitialized && id && !trainer && !loading) {
      return null;
    }

    return (
      <Page>
        <EmptyState>
          <p>{t('common.errors.errorWithMessage', { message: error })}</p>
        </EmptyState>
      </Page>
    );
  }

  if (!trainer) {
    return (
      <Page>
        <EmptyState>
          <p>{t('trainerDetail.notFound')}</p>
        </EmptyState>
      </Page>
    );
  }

  const handleEditTrainer = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdateTrainer = async (trainerId: string, trainerData: Omit<Trainer, 'id'>) => {
    const success = await updateTrainer(trainerId, trainerData);
    if (success) {
      setIsEditModalOpen(false);
      // Trainer data will be automatically updated in the store
    }
  };

  const handleDeleteTrainer = () => {
    setDeleteActionError(null);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteTrainer = async () => {
    if (id) {
      try {
        const success = await deleteTrainer(id);
        setIsDeleteConfirmOpen(false); // Close dialog first
        if (success) {
          navigate('/members/trainers', { replace: true });
        } else {
          setDeleteActionError(t('trainerDetail.errors.deleteFailed'));
        }
      } catch (error) {
        setIsDeleteConfirmOpen(false); // Close dialog even on error
        console.error('Error deleting trainer:', error);
        setDeleteActionError(t('trainerDetail.errors.deleteFailed'));
      }
    } else {
      setIsDeleteConfirmOpen(false); // Close dialog if no ID
    }
  };

  const cancelDeleteTrainer = () => {
    setIsDeleteConfirmOpen(false);
  };

  return (
    <Page>
      <PageToolbar>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/members/trainers')}
          >
            ← {t('common.actions.back')}
          </Button>
          {!spondLinked && (
            <div className="layout-cluster">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleEditTrainer}
              >
                {t('common.actions.edit')}
              </Button>
              <Button
                variant="dangerGhost"
                size="sm"
                onClick={handleDeleteTrainer}
              >
                {t('common.actions.delete')}
              </Button>
            </div>
          )}
      </PageToolbar>
      <PageHeader>
        <PageHeaderContent>
          <p className="eyebrow">{t('domain.trainers')}</p>
          <PageTitle>{trainer.firstName} {trainer.lastName}</PageTitle>
          {trainer.email && <PageDescription>{trainer.email}</PageDescription>}
        </PageHeaderContent>
      </PageHeader>

      {deleteActionError && (
        <Alert className="mb-5">
          {deleteActionError}
        </Alert>
      )}

      {trainerEventHistory.length > 0 && (
        <Panel>
              <PanelHeader><div>
              <PanelTitle>{t('domain.events')}</PanelTitle>
              <PanelDescription>
                {t('trainerDetail.eventsAssignedDescription', { firstName: trainer.firstName })}
              </PanelDescription>
              </div></PanelHeader>
              {(groupedTrainerEventHistory ?? [{ id: 'all-events', title: t('statistics.period.allEvents'), eventHistory: trainerEventHistory }]).map((group) => (
                <div key={group.id} className="mb-6 last:mb-0">
                  {groupedTrainerEventHistory && (
                    <h3 className="mb-3 text-eyebrow font-bold uppercase tracking-label text-content-subtle">{group.title}</h3>
                  )}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {group.eventHistory.map((item) => (
                      <ActionCard
                        key={item.eventId}
                        leading={<DateColumn date={item.eventDate} />}
                        onClick={() => navigate(`/events/${item.eventId}`)}
                      >
                              <ActionCardTitle title={item.eventName}>{item.eventName}</ActionCardTitle>
                              <div className="flex items-center gap-4 mt-2">
                                {item.startTime && (
                                  <span className="body-muted">🕐 {item.startTime}</span>
                                )}
                                {item.location && (
                                  <span className="body-muted">📍 {item.location}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="body-muted">
                                  👥 {item.teamName || t('team.unknownTeam')}
                                </span>
                                <Strength level={item.teamStrength} className="text-xs" />
                              </div>
                      </ActionCard>
                    ))}
                  </div>
                </div>
              ))}
        </Panel>
      )}

      {trainerEventHistory.length === 0 && (
        <Panel>
              <PanelHeader><PanelTitle>{t('trainerDetail.trainingHistory')}</PanelTitle></PanelHeader>
              <EmptyState>
                {t('trainerDetail.noAssignmentsYet', { firstName: trainer.firstName })}
              </EmptyState>
        </Panel>
      )}

      <AddTrainerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={() => { }}
        onUpdate={handleUpdateTrainer}
        editingTrainer={trainer}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={t('members.deleteTrainerTitle')}
        message={t('members.deleteTrainerMessage', { firstName: trainer.firstName, lastName: trainer.lastName })}
        confirmText={t('members.deleteTrainerConfirm')}
        cancelText={t('common.actions.cancel')}
        onConfirm={confirmDeleteTrainer}
        onCancel={cancelDeleteTrainer}
      />
    </Page>
  );
}
