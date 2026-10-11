import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore, useSquads, useSquadsLoading, useSquadsError } from '../store/useStore';
import AddSquadModal from '../components/AddSquadModal';
import type { CreateSquadRequest } from '../types';

export default function SquadSelectionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loadSquads, addSquad, configureSquadCategory, selectSquad, initializeApp } = useStore();
  const squads = useSquads();
  const loading = useSquadsLoading();
  const error = useSquadsError();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadSquads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSquadSelect = async (squadId: string) => {
    await selectSquad(squadId);
    await initializeApp();
    navigate('/');
  };

  const handleCreateSquad = async (squadData: CreateSquadRequest) => {
    setIsSubmitting(true);
    setCreateError(null);
    try {
      const newSquad = await addSquad(squadData);
      if (!newSquad) {
        setCreateError(useStore.getState().errors.squads || t('squads.errors.createFailed'));
        return;
      }

      setIsAddModalOpen(false);
      await handleSquadSelect(newSquad.id);
      if (squadData.category) {
        await configureSquadCategory(squadData.category);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('squads.loading')}</h2>
        </div>
      </div>
    );
  }

  if (error && (!squads || squads.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('squads.errors.failedToLoadTitle')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {t('common.actions.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('squads.selectTitle')}</h1>
          <p className="text-gray-600">{t('squads.selectDescription')}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full mb-5 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-sm font-medium"
        >
          {t('squads.createNew')}
        </button>

        <div className="space-y-3">
          {squads?.map((squad) => (
            <button
              key={squad.id}
              onClick={() => handleSquadSelect(squad.id)}
              className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{squad.name}</h3>
                  {squad.category && (
                    <p className="text-sm text-gray-500">{t('squads.categoryLabel', { category: squad.category })}</p>
                  )}
                  <p className="text-sm text-gray-500">{t('squads.idLabel', { id: squad.id })}</p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {(!squads || squads.length === 0) && (
          <div className="text-center text-gray-500 mt-8">
            <p>{t('squads.noneAvailable')}</p>
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
