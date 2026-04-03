import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useEvents, useTrainers, useAppLoading, useAppHasErrors, useAppErrors, useGroupPeriods } from '../store';
import type { Period, Trainer } from '../types';
import { Card, CardBody, CardTitle, DateColumn } from '../components/ui';
import AddTrainerModal from '../components/AddTrainerModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Strength from '../components/Strength';

interface TrainerEventHistoryItem {
  eventId: string;
  eventName: string;
  eventDate: string;
  teamName: string;
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Use store hooks
  const { events } = useEvents();
  const { updateTrainer, deleteTrainer, getTrainerById } = useTrainers();
  const groupPeriods = useGroupPeriods();
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Get trainer from store
  const trainer = id ? getTrainerById(id) : null;

  // Determine loading and error states
  const loading = isLoading;
  const error = !id ? 'No trainer ID provided' :
    (!trainer && !loading) ? 'Trainer not found' :
      errors.trainers || (hasErrors ? 'Failed to load data' : null);

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Loading trainer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Trainer not found.</p>
        </div>
      </div>
    );
  }

  // Prepare trainer event history data - events where this trainer was assigned to teams
  const trainerEventHistory: TrainerEventHistoryItem[] = events
    .filter(event => event.teams.some(team => team.trainerId === trainer.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Reverse chronological order (newest first)
    .map(event => {
      const team = event.teams.find(team => team.trainerId === trainer.id);
      return {
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        teamName: team?.name || 'Unknown Team',
        teamStrength: team?.strength || 2
      };
    });

  const groupedTrainerEventHistory = useMemo<GroupedTrainerEventHistory[] | null>(() => {
    const validPeriods = groupPeriods.filter(isValidPeriod);

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

    const nonEmptyGroups = groupedByPeriod.filter((group) => group.eventHistory.length > 0);

    if (outsidePeriods.length > 0) {
      nonEmptyGroups.push({
        id: 'outside-periods',
        title: 'Outside periods',
        eventHistory: outsidePeriods,
      });
    }

    return nonEmptyGroups.length > 0 ? nonEmptyGroups.reverse() : null;
  }, [groupPeriods, trainerEventHistory]);

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
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteTrainer = async () => {
    if (id) {
      try {
        const success = await deleteTrainer(id);
        setIsDeleteConfirmOpen(false); // Close dialog first
        if (success) {
          navigate('/members');
        } else {
          // Show error feedback if needed
          console.error('Failed to delete trainer');
        }
      } catch (error) {
        setIsDeleteConfirmOpen(false); // Close dialog even on error
        console.error('Error deleting trainer:', error);
      }
    } else {
      setIsDeleteConfirmOpen(false); // Close dialog if no ID
    }
  };

  const cancelDeleteTrainer = () => {
    setIsDeleteConfirmOpen(false);
  };

  return (
    <div className="page-container lg:px-4 px-0">
      {/* Sub Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 -mt-8 mb-6 py-3 px-4 lg:px-0 lg:rounded-t-lg">
        <div className="relative flex items-center justify-between">
          <button
            onClick={() => navigate('/members/trainers')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-900">{trainer.firstName} {trainer.lastName}</span>
          <div className="flex gap-3">
            <button
              onClick={handleEditTrainer}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteTrainer}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Trainer Badge */}
      <div className="px-4 lg:px-0 mb-4">
        <span className="text-gray-600 text-sm bg-gray-100 px-2 py-1 rounded">Trainer</span>
      </div>

      {/* Training History */}
      {trainerEventHistory.length > 0 && (
        <div>
          <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
            <CardBody className="lg:p-6 p-4">
              <CardTitle>Events</CardTitle>
              <p className="text-sm text-gray-600 mt-1 mb-4">
                Events where {trainer.firstName} was assigned as a trainer
              </p>
              {(groupedTrainerEventHistory ?? [{ id: 'all-events', title: 'All events', eventHistory: trainerEventHistory }]).map((group) => (
                <div key={group.id} className="mb-6 last:mb-0">
                  {groupedTrainerEventHistory && (
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">{group.title}</h3>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-hidden">
                    {group.eventHistory.map((item) => (
                      <div
                        key={item.eventId}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer min-w-0"
                        onClick={() => navigate(`/events/${item.eventId}`)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Date column */}
                          <DateColumn date={item.eventDate} />

                          {/* Content and chevron */}
                          <div className="flex justify-between items-center flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate" title={item.eventName}>{item.eventName}</h3>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-gray-700">
                                  👥 {item.teamName}
                                </span>
                                <Strength level={item.teamStrength} className="text-xs" />
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
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
            </CardBody>
          </Card>
        </div>
      )}

      {trainerEventHistory.length === 0 && (
        <div>
          <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
            <CardBody className="lg:p-6 p-4">
              <CardTitle>Training History</CardTitle>
              <p className="text-gray-500 text-center py-8">
                {trainer.firstName} hasn't been assigned to any teams yet.
              </p>
            </CardBody>
          </Card>
        </div>
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
        title="Delete Trainer"
        message={`Are you sure you want to delete ${trainer.firstName} ${trainer.lastName}? This action cannot be undone.`}
        confirmText="Delete Trainer"
        cancelText="Cancel"
        onConfirm={confirmDeleteTrainer}
        onCancel={cancelDeleteTrainer}
      />
    </div>
  );
}