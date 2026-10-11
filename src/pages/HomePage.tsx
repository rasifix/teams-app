import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import AddSquadModal from '../components/AddSquadModal';
import UpcomingEventCard from '../components/UpcomingEventCard';
import { useSquad, useSquads, useSquadsError, useSquadsLoading, useStore } from '../store/useStore';
import { useActivities } from '../hooks/useActivities';
import { selectUpcomingEventsWithGuardianInvitations } from '../store/selectors/homeSelectors';
import { selectPlayersFromMembers } from '../store/selectors/memberSelectors';
import type { CreateSquadRequest } from '../types';

export default function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { addSquad, configureSquadCategory, selectSquad, initializeApp, loadSquads } = useStore();
  const squad = useSquad();
  const squads = useSquads();
  const squadsLoading = useSquadsLoading();
  const squadsError = useSquadsError();
  const { activities, updateActivityInvitation } = useActivities();
  const members = useStore((state) => state.members);
  const players = useMemo(() => selectPlayersFromMembers(members), [members]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [switchingSquadId, setSwitchingSquadId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [respondingInvitationId, setRespondingInvitationId] = useState<string | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  const upcomingEvents = selectUpcomingEventsWithGuardianInvitations(activities, players, user, new Date(), 5);

  useEffect(() => {
    if (isAuthenticated) {
      loadSquads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleCreateSquad = async (squadData: CreateSquadRequest) => {
    setIsSubmitting(true);
    setCreateError(null);

    try {
      const newSquad = await addSquad(squadData);
      if (!newSquad) {
        setCreateError(useStore.getState().errors.squads || t('squads.errors.createFailed'));
        return;
      }

      await selectSquad(newSquad.id);
      await initializeApp();
      if (squadData.category) {
        await configureSquadCategory(squadData.category);
      }
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSquadSwitch = async (squadId: string) => {
    if (squad?.id === squadId || switchingSquadId) {
      return;
    }

    setSwitchingSquadId(squadId);
    try {
      await selectSquad(squadId);
      await initializeApp();
    } finally {
      setSwitchingSquadId(null);
    }
  };

  const handleInvitationResponse = async (eventId: string, playerId: string, invitationId: string, status: 'accepted' | 'declined') => {
    setRespondingInvitationId(invitationId);
    setInvitationError(null);
    try {
      const success = await updateActivityInvitation(eventId, playerId, { response: status });
      if (!success) {
        setInvitationError(t('home.openInvitations.updateError'));
      }
    } finally {
      setRespondingInvitationId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('home.title')}
        </h1>

        {isAuthenticated && (
          <div className="max-w-3xl mx-auto mb-12 text-left">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('squads.title')}</h2>

            {squadsLoading && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-gray-600">
                {t('squads.loading')}
              </div>
            )}

            {!squadsLoading && squadsError && (
              <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-red-700">
                {t('squads.errors.loadFailedWithReason', { error: squadsError })}
              </div>
            )}

            {!squadsLoading && !squadsError && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {squads.map((squadItem) => {
                  const isCurrentSquad = squad?.id === squadItem.id;
                  const isSwitching = switchingSquadId === squadItem.id;

                  return (
                    <button
                      type="button"
                      onClick={() => handleSquadSwitch(squadItem.id)}
                      disabled={isCurrentSquad || !!switchingSquadId}
                      key={squadItem.id}
                      className={`rounded-lg border p-4 bg-white text-left transition-colors ${
                        isCurrentSquad
                          ? 'border-orange-400 cursor-default'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{squadItem.name}</p>
                      {squadItem.club && (
                        <p className="text-sm text-gray-600 mt-1">{t('squads.clubLabel', { club: squadItem.club })}</p>
                      )}
                      {squadItem.category && (
                        <p className="text-sm text-gray-600 mt-1">{t('squads.categoryLabel', { category: squadItem.category })}</p>
                      )}
                      {isSwitching && (
                        <p className="text-xs text-gray-500 mt-2">{t('squads.switching')}</p>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="rounded-lg border border-dashed border-orange-300 p-4 bg-orange-50 text-left hover:bg-orange-100 transition-colors"
                >
                  <p className="font-medium text-orange-800">{t('squads.createNew')}</p>
                </button>
              </div>
            )}
          </div>
        )}
        
        {!isAuthenticated && (
          <div className="flex gap-4 justify-center mb-12">
            <Link
              to="/login"
              className="px-6 py-3 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700 transition-colors"
            >
              {t('auth.login')}
            </Link>
            <Link
              to="/login?register=true"
              className="px-6 py-3 bg-white text-orange-600 border-2 border-orange-600 rounded-md font-medium hover:bg-orange-50 transition-colors"
            >
              {t('auth.register')}
            </Link>
          </div>
        )}
        
        {isAuthenticated && (
          <div className="max-w-3xl mx-auto mt-12 text-left">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">{t('home.upcomingEvents.title')}</h2>
              <Link
                to="/events"
                className="text-sm font-medium text-orange-700 hover:text-orange-800"
              >
                {t('home.upcomingEvents.viewAll')}
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-gray-600">
                {t('home.upcomingEvents.empty')}
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <UpcomingEventCard
                    key={event.id}
                    event={event}
                    respondingInvitationId={respondingInvitationId}
                    onInvitationResponse={handleInvitationResponse}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {isAuthenticated && invitationError && (
          <div className="max-w-3xl mx-auto mt-4 text-left">
            <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-red-700">
              {invitationError}
            </div>
          </div>
        )}
      </div>

      <AddSquadModal
        isOpen={isAddModalOpen}
        isSubmitting={isSubmitting}
        error={createError}
        onClose={() => {
          setCreateError(null);
          setIsAddModalOpen(false);
        }}
        onSave={handleCreateSquad}
      />
    </div>
  );
}
