import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore, useSquads, useSquadsLoading, useSquadsError } from '../store/useStore';
import AddSquadModal from '../components/AddSquadModal';
import type { CreateSquadRequest } from '../types';
import {
  Alert,
  AddCardButton,
  ActionCard,
  ActionCardTitle,
  Button,
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
        setCreateError(useStore.getState().errors.squads || t('page.squads.errors.createFailed'));
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
        <LoadingState message={t('page.squads.loading')} size="lg" />
      </div>
    );
  }

  if (error && (!squads || squads.length === 0)) {
    return (
      <div className="auth-shell">
        <PageStateContent>
          <Alert>
            <strong>{t('page.squads.errors.failedToLoadTitle')}</strong>
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
          <PanelTitle>{t('page.squads.selectTitle')}</PanelTitle>
          <PanelDescription>{t('page.squads.selectDescription')}</PanelDescription>
        </PanelHeader>

        <Stack gap="sm">
          {squads?.map((squad) => (
            <ActionCard
              key={squad.id}
              onClick={() => handleSquadSelect(squad.id)}
            >
                  <ActionCardTitle>{squad.name}</ActionCardTitle>
                  <EntityMeta>
                  {squad.category && (
                    <span>{t('page.squads.categoryLabel', { category: squad.category })}</span>
                  )}
                  <span>{t('page.squads.idLabel', { id: squad.id })}</span>
                  </EntityMeta>
            </ActionCard>
          ))}
          <AddCardButton cardSize="lg" onClick={() => setIsAddModalOpen(true)} label={t('page.squads.createNew')} />
        </Stack>
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
