import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { selectIsSpondLinked } from '../store/selectors/squadSettingsSelectors';
import { useSquad, useTrainers, useAppLoading, useAppHasErrors, useAppErrors, useSquadPeriods, useAppInitialized } from '../store';
import type { Trainer } from '../types';
import { ActionCard, ActionCardTitle, Alert, Button, Cluster, ContentGrid, DateColumn, EmptyState, MetadataItem, MetadataList, Page, PageDescription, PageHeader, PageHeaderContent, PageTitle, PageToolbar, Panel, PanelDescription, PanelHeader, PanelTitle, SectionEyebrow, Stack } from '../components/ui';
import AddTrainerModal from '../components/AddTrainerModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Strength from '../components/Strength';
import { selectGroupedDatedHistory } from '../store/selectors/playerDetailSelectors';

interface TrainerEventHistoryItem {
  eventId: string;
  eventName: string;
  eventDate: string;
  startTime?: string;
  location?: string;
  teamName?: string;
  teamStrength: number;
}

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

  const groupedTrainerEventHistory = useMemo(
    () => trainer ? selectGroupedDatedHistory(squadPeriods, trainerEventHistory, t('page.statistics.period.outsidePeriods')) : null,
    [squadPeriods, t, trainer, trainerEventHistory],
  );

  // Determine loading and error states
  const loading = isLoading;
  const error = !id ? t('page.trainerDetail.errors.noTrainerId') :
    (!trainer && !loading) ? t('page.trainerDetail.errors.notFound') :
      errors.trainers || (hasErrors ? t('common.errors.failedToLoadData') : null);

  useEffect(() => {
    if (isInitialized && !loading && id && !trainer) {
      navigate('/members/trainers', { replace: true });
    }
  }, [isInitialized, loading, id, trainer, navigate]);

  if (loading) {
    return (
      <Page>
        <EmptyState>
          <p>{t('page.trainerDetail.loading')}</p>
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
          <p>{t('page.trainerDetail.notFound')}</p>
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
          setDeleteActionError(t('page.trainerDetail.errors.deleteFailed'));
        }
      } catch (error) {
        setIsDeleteConfirmOpen(false); // Close dialog even on error
        console.error('Error deleting trainer:', error);
        setDeleteActionError(t('page.trainerDetail.errors.deleteFailed'));
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
            <Cluster gap="sm">
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
            </Cluster>
          )}
      </PageToolbar>
      <PageHeader>
        <PageHeaderContent>
          <p className="eyebrow">{t('domain.trainer.label')}</p>
          <PageTitle>{trainer.firstName} {trainer.lastName}</PageTitle>
          {trainer.email && <PageDescription>{trainer.email}</PageDescription>}
        </PageHeaderContent>
      </PageHeader>

      {deleteActionError && (
        <Alert>
          {deleteActionError}
        </Alert>
      )}

      {trainerEventHistory.length > 0 && (
        <Panel>
              <PanelHeader><div>
              <PanelTitle>{t('domain.activity.plural')}</PanelTitle>
              <PanelDescription>
                {t('page.trainerDetail.eventsAssignedDescription', { firstName: trainer.firstName })}
              </PanelDescription>
              </div></PanelHeader>
              {(groupedTrainerEventHistory ?? [{ id: 'all-events', title: t('page.statistics.period.allEvents'), eventHistory: trainerEventHistory }]).map((group) => (
                <Stack key={group.id} gap="sm">
                  {groupedTrainerEventHistory && (
                    <SectionEyebrow>{group.title}</SectionEyebrow>
                  )}
                  <ContentGrid variant="equal">
                    {group.eventHistory.map((item) => (
                      <ActionCard
                        key={item.eventId}
                        leading={<DateColumn date={item.eventDate} />}
                        onClick={() => navigate(`/activities/${item.eventId}`)}
                      >
                              <ActionCardTitle title={item.eventName}>{item.eventName}</ActionCardTitle>
                              <MetadataList>
                                {item.startTime && (
                                  <MetadataItem>🕐 {item.startTime}</MetadataItem>
                                )}
                                {item.location && (
                                  <MetadataItem>📍 {item.location}</MetadataItem>
                                )}
                              </MetadataList>
                              <MetadataList>
                                <MetadataItem>
                                  👥 {item.teamName || t('domain.team.unknownLabel')}
                                </MetadataItem>
                                <Strength level={item.teamStrength} />
                              </MetadataList>
                      </ActionCard>
                    ))}
                  </ContentGrid>
                </Stack>
              ))}
        </Panel>
      )}

      {trainerEventHistory.length === 0 && (
        <Panel>
              <PanelHeader><PanelTitle>{t('page.trainerDetail.trainingHistory')}</PanelTitle></PanelHeader>
              <EmptyState>
                {t('page.trainerDetail.noAssignmentsYet', { firstName: trainer.firstName })}
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
        title={t('page.members.deleteTrainerTitle')}
        message={t('page.members.deleteTrainerMessage', { firstName: trainer.firstName, lastName: trainer.lastName })}
        confirmText={t('page.members.deleteTrainerConfirm')}
        cancelText={t('common.actions.cancel')}
        onConfirm={confirmDeleteTrainer}
        onCancel={cancelDeleteTrainer}
      />
    </Page>
  );
}
