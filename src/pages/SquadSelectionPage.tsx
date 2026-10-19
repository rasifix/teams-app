import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore, useSquads, useSquadsLoading, useSquadsError } from '../store/useStore';
import AddSquadModal from '../components/AddSquadModal';
import type { CreateSquadRequest } from '../types';
import {
  Alert,
  ActionCard,
  ActionCardTitle,
  Button,
  EmptyState,
  EntityMeta,
  LoadingState,
  PageStateContent,
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  Stack,
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
        <PageStateContent className="squad-selection-error">
          <Alert>
            <strong>{t('squads.errors.failedToLoadTitle')}</strong>
            <p>{error}</p>
          </Alert>
          <Button onClick={() => window.location.reload()}>
            {t('common.actions.retry')}
          </Button>
        </PageStateContent>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <Panel className="squad-selection-panel">
        <PanelHeader className="squad-selection-header">
          <PanelTitle>{t('squads.selectTitle')}</PanelTitle>
          <PanelDescription>{t('squads.selectDescription')}</PanelDescription>
        </PanelHeader>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="squad-selection-create"
        >
          {t('squads.createNew')}
        </Button>

        <Stack gap="sm">
          {squads?.map((squad) => (
            <ActionCard
              key={squad.id}
              onClick={() => handleSquadSelect(squad.id)}
            >
                  <ActionCardTitle>{squad.name}</ActionCardTitle>
                  <EntityMeta>
                  {squad.category && (
                    <span>{t('squads.categoryLabel', { category: squad.category })}</span>
                  )}
                  <span>{t('squads.idLabel', { id: squad.id })}</span>
                  </EntityMeta>
            </ActionCard>
          ))}
        </Stack>

        {(!squads || squads.length === 0) && (
          <EmptyState className="squad-selection-empty">
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
