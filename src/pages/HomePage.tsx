import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import AddGroupModal from '../components/AddGroupModal';
import UpcomingEventCard from '../components/UpcomingEventCard';
import { useGroup, useGroups, useGroupsError, useGroupsLoading, useStore } from '../store/useStore';
import { selectUpcomingEventsWithGuardianInvitations } from '../store/selectors/homeSelectors';
import type { CreateGroupRequest } from '../types';

export default function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { addGroup, selectGroup, initializeApp, loadGroups, updateInvitationStatus } = useStore();
  const group = useGroup();
  const groups = useGroups();
  const groupsLoading = useGroupsLoading();
  const groupsError = useGroupsError();
  const events = useStore((state) => state.events);
  const players = useStore((state) => state.players);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [switchingGroupId, setSwitchingGroupId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [respondingInvitationId, setRespondingInvitationId] = useState<string | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  const upcomingEvents = selectUpcomingEventsWithGuardianInvitations(events, players, user, new Date(), 5);

  useEffect(() => {
    if (isAuthenticated) {
      loadGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleCreateGroup = async (groupData: CreateGroupRequest) => {
    setIsSubmitting(true);
    setCreateError(null);

    try {
      const newGroup = await addGroup(groupData);
      if (!newGroup) {
        setCreateError(useStore.getState().errors.groups || t('groups.errors.createFailed'));
        return;
      }

      await selectGroup(newGroup.id);
      await initializeApp();
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGroupSwitch = async (groupId: string) => {
    if (group?.id === groupId || switchingGroupId) {
      return;
    }

    setSwitchingGroupId(groupId);
    try {
      await selectGroup(groupId);
      await initializeApp();
    } finally {
      setSwitchingGroupId(null);
    }
  };

  const handleInvitationResponse = async (eventId: string, playerId: string, invitationId: string, status: 'accepted' | 'declined') => {
    setRespondingInvitationId(invitationId);
    setInvitationError(null);
    try {
      const success = await updateInvitationStatus(eventId, playerId, status);
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('groups.title')}</h2>

            {groupsLoading && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-gray-600">
                {t('groups.loading')}
              </div>
            )}

            {!groupsLoading && groupsError && (
              <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-red-700">
                {t('groups.errors.loadFailedWithReason', { error: groupsError })}
              </div>
            )}

            {!groupsLoading && !groupsError && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map((groupItem) => {
                  const isCurrentGroup = group?.id === groupItem.id;
                  const isSwitching = switchingGroupId === groupItem.id;

                  return (
                    <button
                      type="button"
                      onClick={() => handleGroupSwitch(groupItem.id)}
                      disabled={isCurrentGroup || !!switchingGroupId}
                      key={groupItem.id}
                      className={`rounded-lg border p-4 bg-white text-left transition-colors ${
                        isCurrentGroup
                          ? 'border-orange-400 cursor-default'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{groupItem.name}</p>
                      {groupItem.club && (
                        <p className="text-sm text-gray-600 mt-1">{t('groups.clubLabel', { club: groupItem.club })}</p>
                      )}
                      {isSwitching && (
                        <p className="text-xs text-gray-500 mt-2">{t('groups.switching')}</p>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="rounded-lg border border-dashed border-orange-300 p-4 bg-orange-50 text-left hover:bg-orange-100 transition-colors"
                >
                  <p className="font-medium text-orange-800">{t('groups.createNew')}</p>
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

      <AddGroupModal
        isOpen={isAddModalOpen}
        isSubmitting={isSubmitting}
        error={createError}
        onClose={() => {
          setCreateError(null);
          setIsAddModalOpen(false);
        }}
        onSave={handleCreateGroup}
      />
    </div>
  );
}