import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore, useSquads, useSquadsLoading, useSquadsError } from '../store/useStore';
import AddSquadModal from '../components/AddSquadModal';
import type { CreateSquadRequest } from '../types';
import {
  Alert,
  Button,
  ChevronRightIcon,
  EmptyState,
  LoadingState,
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
} from '../components/ui';

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
      <div className="auth-shell">
        <LoadingState message={t('squads.loading')} size="lg" />
      </div>
    );
  }

  if (error && (!squads || squads.length === 0)) {
    return (
      <div className="auth-shell">
        <div className="text-center max-w-md">
          <Alert className="mb-4">
            <strong>{t('squads.errors.failedToLoadTitle')}</strong>
            <p className="mt-2">{error}</p>
          </Alert>
          <Button onClick={() => window.location.reload()}>
            {t('common.actions.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <Panel className="w-full max-w-md">
        <PanelHeader className="block text-center">
          <PanelTitle>{t('squads.selectTitle')}</PanelTitle>
          <PanelDescription>{t('squads.selectDescription')}</PanelDescription>
        </PanelHeader>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="mb-5 w-full"
        >
          {t('squads.createNew')}
        </Button>

        <div className="layout-stack layout-stack--sm">
          {squads?.map((squad) => (
            <button
              type="button"
              key={squad.id}
              data-ui-control="composite"
              onClick={() => handleSquadSelect(squad.id)}
              className="w-full p-4 text-left border border-edge rounded-lg hover:border-brand-border hover:bg-brand-subtle transition-colors group"
            >
              <div className="layout-split">
                <div>
                  <h3 className="font-medium text-content-strong">{squad.name}</h3>
                  {squad.category && (
                    <p className="body-muted">{t('squads.categoryLabel', { category: squad.category })}</p>
                  )}
                  <p className="body-muted">{t('squads.idLabel', { id: squad.id })}</p>
                </div>
                <ChevronRightIcon className="card-chevron" />
              </div>
            </button>
          ))}
        </div>

        {(!squads || squads.length === 0) && (
          <EmptyState className="mt-8">
            <p>{t('squads.noneAvailable')}</p>
          </EmptyState>
        )}
      </Panel>

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
