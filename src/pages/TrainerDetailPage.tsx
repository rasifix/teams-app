import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { selectIsSpondLinked } from '../store/selectors/groupSettingsSelectors';
import { useSquad, useTrainers, useAppLoading, useAppHasErrors, useAppErrors, useSquadPeriods, useAppInitialized } from '../store';
import type { Period, Trainer } from '../types';
import { DateColumn } from '../components/ui';
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
      <div className="page-container">
        <div className="empty-state">
          <p>{t('trainerDetail.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    if (isInitialized && id && !trainer && !loading) {
      return null;
    }

    return (
      <div className="page-container">
        <div className="empty-state">
          <p>{t('common.errors.errorWithMessage', { message: error })}</p>
        </div>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>{t('trainerDetail.notFound')}</p>
        </div>
      </div>
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6">
        <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
          <button
            onClick={() => navigate('/members/trainers')}
            className="text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            ← {t('common.actions.back')}
          </button>
          {!spondLinked && (
            <div className="flex gap-2">
              <button
                onClick={handleEditTrainer}
                className="btn-secondary btn-sm"
              >
                {t('common.actions.edit')}
              </button>
              <button
                onClick={handleDeleteTrainer}
                className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                {t('common.actions.delete')}
              </button>
            </div>
          )}
        </div>
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.075em] text-orange-600">{t('domain.trainers')}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{trainer.firstName} {trainer.lastName}</h1>
          {trainer.email && <p className="mt-2 text-sm text-slate-600">{trainer.email}</p>}
        </div>
      </header>

      {deleteActionError && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteActionError}
        </div>
      )}

      {trainerEventHistory.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">{t('domain.events')}</h2>
              <p className="mb-5 mt-1 text-sm leading-6 text-slate-500">
                {t('trainerDetail.eventsAssignedDescription', { firstName: trainer.firstName })}
              </p>
              {(groupedTrainerEventHistory ?? [{ id: 'all-events', title: t('statistics.period.allEvents'), eventHistory: trainerEventHistory }]).map((group) => (
                <div key={group.id} className="mb-6 last:mb-0">
                  {groupedTrainerEventHistory && (
                    <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.075em] text-slate-500">{group.title}</h3>
                  )}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {group.eventHistory.map((item) => (
                      <div
                        key={item.eventId}
                        className="min-w-0 cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/40 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
                        onClick={() => navigate(`/events/${item.eventId}`)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Date column */}
                          <DateColumn date={item.eventDate} />

                          {/* Content and chevron */}
                          <div className="flex justify-between items-center flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                              <h3 className="truncate font-semibold text-slate-900" title={item.eventName}>{item.eventName}</h3>
                              <div className="flex items-center gap-4 mt-2">
                                {item.startTime && (
                                  <span className="text-sm text-slate-600">🕐 {item.startTime}</span>
                                )}
                                {item.location && (
                                  <span className="text-sm text-slate-600">📍 {item.location}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-slate-600">
                                  👥 {item.teamName || t('team.unknownTeam')}
                                </span>
                                <Strength level={item.teamStrength} className="text-xs" />
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
        </section>
      )}

      {trainerEventHistory.length === 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">{t('trainerDetail.trainingHistory')}</h2>
              <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                {t('trainerDetail.noAssignmentsYet', { firstName: trainer.firstName })}
              </p>
        </section>
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
    </div>
  );
}
