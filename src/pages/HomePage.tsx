import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import AddGroupModal from '../components/AddGroupModal';
import { useGroup, useGroups, useGroupsError, useGroupsLoading, useStore } from '../store/useStore';
import type { CreateGroupRequest } from '../types';

export default function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { addGroup, selectGroup, initializeApp, loadGroups } = useStore();
  const group = useGroup();
  const groups = useGroups();
  const groupsLoading = useGroupsLoading();
  const groupsError = useGroupsError();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [switchingGroupId, setSwitchingGroupId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {isAuthenticated ? (
            <>
              <Link
                to="/members"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 119.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('home.cards.membersTitle')}</h3>
                <p className="text-gray-600">{t('home.cards.membersDescription')}</p>
              </Link>

              <Link
                to="/events"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="text-green-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('home.cards.eventsTitle')}</h3>
                <p className="text-gray-600">{t('home.cards.eventsDescription')}</p>
              </Link>

              <Link
                to="/statistics"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="text-purple-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('home.cards.statisticsTitle')}</h3>
                <p className="text-gray-600">{t('home.cards.statisticsDescription')}</p>
              </Link>
            </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-blue-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 119.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('home.cards.membersTitle')}</h3>
                <p className="text-gray-600">{t('home.cards.membersDescription')}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-green-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('home.cards.eventsTitle')}</h3>
                <p className="text-gray-600">{t('home.cards.eventsDescription')}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-purple-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('home.cards.statisticsTitle')}</h3>
                <p className="text-gray-600">{t('home.cards.statisticsDescription')}</p>
              </div>
            </>
          )}
        </div>
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