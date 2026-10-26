import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useActivities, useMatchPlanning, useSfvCatalog, useSquad, useSquadPeriods, useStore } from '../store';
import { ContentGrid, Page, PageDescription, PageHeader, PageHeaderContent, PageTitle, Stack } from '../components/ui';
import ConfirmDialog from '../components/ConfirmDialog';
import MatchFormatModal, { type MatchFormatFormData } from '../components/MatchFormatModal';
import FormationModal from '../components/FormationModal';
import StatisticsPeriodModal from '../components/StatisticsPeriodModal';
import { selectReferencedFormationIds, selectReferencedMatchFormatIds } from '../store/selectors/matchPlanningSelectors';
import type { Formation, MatchFormat, Period, PositionCode, SquadCategory } from '../types';
import { selectSpondGroupUrl } from '../store/selectors/squadSettingsSelectors';
import { unlinkSquadFromSpond } from '../services/squadService';
import SpondSyncResultBanner from '../components/SpondSyncResultBanner';
import SpondSettingsSection from '../components/squadSettings/SpondSettingsSection';
import PeriodsSettingsSection from '../components/squadSettings/PeriodsSettingsSection';
import CategorySettingsSection from '../components/squadSettings/CategorySettingsSection';
import MatchPlanningSettingsSection from '../components/squadSettings/MatchPlanningSettingsSection';
import MatchFormatsSettingsSection from '../components/squadSettings/MatchFormatsSettingsSection';
import FormationsSettingsSection from '../components/squadSettings/FormationsSettingsSection';
import DeactivateSquadSection from '../components/squadSettings/DeactivateSquadSection';

export default function SquadSettingsPage() {
  const { t } = useTranslation();
  const squad = useSquad();
  const navigate = useNavigate();
  const { activities } = useActivities();
  const periods = useSquadPeriods();
  const sfvCatalog = useSfvCatalog();
  const spondGroupUrl = selectSpondGroupUrl(squad);
  const referencedFormationIds = selectReferencedFormationIds(activities);
  const referencedMatchFormatIds = selectReferencedMatchFormatIds(activities);
  const initializeApp = useStore((state) => state.initializeApp);
  const deactivateSquad = useStore((state) => state.deactivateSquad);
  const addSquadPeriod = useStore((state) => state.addSquadPeriod);
  const updateSquadPeriod = useStore((state) => state.updateSquadPeriod);
  const deleteSquadPeriod = useStore((state) => state.deleteSquadPeriod);
  const {
    matchPlanningEnabled, matchFormats, formations, setMatchPlanningEnabled,
    configureSquadCategory, addMatchFormat, updateMatchFormat, deleteMatchFormat,
    setDefaultMatchFormat, addFormation, updateFormation, deleteFormation,
  } = useMatchPlanning();

  const [isTogglingEnabled, setIsTogglingEnabled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SquadCategory | ''>(squad?.category ?? '');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categorySaveError, setCategorySaveError] = useState<string | null>(null);
  const [isMatchFormatModalOpen, setIsMatchFormatModalOpen] = useState(false);
  const [editingMatchFormat, setEditingMatchFormat] = useState<MatchFormat | null>(null);
  const [deletingMatchFormat, setDeletingMatchFormat] = useState<MatchFormat | null>(null);
  const [matchFormatDeleteError, setMatchFormatDeleteError] = useState<string | null>(null);
  const [isFormationModalOpen, setIsFormationModalOpen] = useState(false);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  const [deletingFormation, setDeletingFormation] = useState<Formation | null>(null);
  const [formationDeleteError, setFormationDeleteError] = useState<string | null>(null);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodToEdit, setPeriodToEdit] = useState<Period | null>(null);
  const [deletingPeriod, setDeletingPeriod] = useState<Period | null>(null);
  const [isUnlinkSpondDialogOpen, setIsUnlinkSpondDialogOpen] = useState(false);
  const [isUnlinkingSpond, setIsUnlinkingSpond] = useState(false);
  const [unlinkSpondError, setUnlinkSpondError] = useState<string | null>(null);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  useEffect(() => setSelectedCategory(squad?.category ?? ''), [squad?.category]);

  const handleDeleteFormation = async () => {
    if (!deletingFormation) return;
    const formationToDelete = deletingFormation;
    setDeletingFormation(null);
    setFormationDeleteError(null);
    if (!await deleteFormation(formationToDelete.id)) setFormationDeleteError(t('page.matchPlanning.formations.errors.deleteFailed'));
  };

  const handleDeleteMatchFormat = async () => {
    if (!deletingMatchFormat) return;
    const formatToDelete = deletingMatchFormat;
    setDeletingMatchFormat(null);
    setMatchFormatDeleteError(null);
    if (!await deleteMatchFormat(formatToDelete.id)) setMatchFormatDeleteError(t('page.matchPlanning.matchFormats.errors.deleteFailed'));
  };

  const handleSaveCategory = async () => {
    setCategorySaveError(null);
    setIsSavingCategory(true);
    try {
      if (!await configureSquadCategory(selectedCategory || null)) setCategorySaveError(t('page.matchPlanning.category.saveFailed'));
    } catch {
      setCategorySaveError(t('page.matchPlanning.category.saveFailed'));
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleToggleEnabled = async () => {
    setIsTogglingEnabled(true);
    try {
      await setMatchPlanningEnabled(!matchPlanningEnabled);
    } finally {
      setIsTogglingEnabled(false);
    }
  };

  const handleUnlinkSpond = async () => {
    if (!squad || isUnlinkingSpond) return;
    setIsUnlinkingSpond(true);
    setUnlinkSpondError(null);
    try {
      await unlinkSquadFromSpond(squad.id, squad.name);
      await initializeApp();
      setIsUnlinkSpondDialogOpen(false);
    } catch {
      setUnlinkSpondError(t('page.squadSettings.spond.unlinkFailed'));
    } finally {
      setIsUnlinkingSpond(false);
    }
  };

  const handleDeactivateSquad = async () => {
    if (isDeactivating) return;
    setIsDeactivating(true);
    setDeactivateError(null);
    const success = await deactivateSquad();
    setIsDeactivating(false);
    if (!success) {
      setDeactivateError(t('page.squadSettings.deactivate.failed'));
      return;
    }
    setIsDeactivateDialogOpen(false);
    navigate('/squads', { replace: true });
  };

  const handleSaveMatchFormat = async (data: MatchFormatFormData) => {
    if (editingMatchFormat) return updateMatchFormat(editingMatchFormat.id, data);
    return (await addMatchFormat(data)) !== null;
  };

  const handleSaveFormation = async (data: { name: string; slots: Array<{ id?: string; positionCode: PositionCode }> }) => {
    if (editingFormation) return updateFormation(editingFormation.id, data);
    return (await addFormation(data)) !== null;
  };

  const openPeriod = (period: Period | null) => {
    setPeriodToEdit(period);
    setIsPeriodModalOpen(true);
  };

  const handleSavePeriod = async (data: Omit<Period, 'id'>, periodId: string | null) => {
    const wasSaved = periodId
      ? await updateSquadPeriod(periodId, data)
      : (await addSquadPeriod(data)) !== null;
    if (wasSaved) {
      setIsPeriodModalOpen(false);
      setPeriodToEdit(null);
    }
    return wasSaved;
  };

  const handleDeletePeriod = async () => {
    if (!deletingPeriod) return;
    await deleteSquadPeriod(deletingPeriod.id);
    setDeletingPeriod(null);
  };

  return <Page>
    <SpondSyncResultBanner />
    <PageHeader><PageHeaderContent>
      <PageTitle>{t('page.squadSettings.title')}</PageTitle>
      <PageDescription>{t('page.squadSettings.description')}</PageDescription>
    </PageHeaderContent></PageHeader>

    <ContentGrid variant="equal">
      <Stack>
        <SpondSettingsSection groupUrl={spondGroupUrl} error={unlinkSpondError} onUnlink={() => { setUnlinkSpondError(null); setIsUnlinkSpondDialogOpen(true); }} />
        <PeriodsSettingsSection periods={periods} onAdd={() => openPeriod(null)} onEdit={openPeriod} onDelete={setDeletingPeriod} />
      </Stack>
      <Stack>
        <CategorySettingsSection category={selectedCategory} squadCategory={squad?.category} catalog={sfvCatalog} isSaving={isSavingCategory} error={categorySaveError} onChange={(category) => { setSelectedCategory(category); setCategorySaveError(null); }} onSave={() => void handleSaveCategory()} />
        <MatchPlanningSettingsSection enabled={matchPlanningEnabled} isSaving={isTogglingEnabled} onToggle={() => void handleToggleEnabled()} />
      </Stack>
    </ContentGrid>

    {matchPlanningEnabled && <ContentGrid variant="equal">
      <MatchFormatsSettingsSection
        formats={matchFormats}
        referencedIds={referencedMatchFormatIds}
        error={matchFormatDeleteError}
        onAdd={() => { setEditingMatchFormat(null); setIsMatchFormatModalOpen(true); }}
        onEdit={(format) => { setEditingMatchFormat(format); setIsMatchFormatModalOpen(true); }}
        onDelete={setDeletingMatchFormat}
        onSetDefault={(id) => void setDefaultMatchFormat(id)}
      />
      <FormationsSettingsSection
        formations={formations}
        referencedIds={referencedFormationIds}
        error={formationDeleteError}
        onAdd={() => { setEditingFormation(null); setIsFormationModalOpen(true); }}
        onEdit={(formation) => { setEditingFormation(formation); setIsFormationModalOpen(true); }}
        onDelete={setDeletingFormation}
      />
    </ContentGrid>}

    <DeactivateSquadSection error={deactivateError} onDeactivate={() => setIsDeactivateDialogOpen(true)} />

    {isMatchFormatModalOpen && <MatchFormatModal isOpen={isMatchFormatModalOpen} onClose={() => setIsMatchFormatModalOpen(false)} matchFormatToEdit={editingMatchFormat} onSave={handleSaveMatchFormat} />}
    {isFormationModalOpen && <FormationModal isOpen={isFormationModalOpen} onClose={() => setIsFormationModalOpen(false)} formationToEdit={editingFormation} onSave={handleSaveFormation} />}

    {deletingPeriod && <ConfirmDialog
      isOpen={true}
      title={t('page.statistics.period.deleteTitle')}
      message={t('page.statistics.period.deleteMessage', { period: deletingPeriod.name })}
      confirmText={t('common.actions.delete')}
      onConfirm={() => void handleDeletePeriod()}
      onCancel={() => setDeletingPeriod(null)}
      confirmButtonColor="red"
    />}
    {deletingMatchFormat && <ConfirmDialog
      isOpen={true}
      title={t('page.matchPlanning.matchFormats.deleteTitle')}
      message={t('page.matchPlanning.matchFormats.deleteMessage', { name: deletingMatchFormat.name })}
      confirmText={t('common.actions.delete')}
      onConfirm={() => void handleDeleteMatchFormat()}
      onCancel={() => { setDeletingMatchFormat(null); setMatchFormatDeleteError(null); }}
    />}
    {deletingFormation && <ConfirmDialog
      isOpen={true}
      title={t('page.matchPlanning.formations.deleteTitle')}
      message={t('page.matchPlanning.formations.deleteMessage', { name: deletingFormation.name })}
      confirmText={t('common.actions.delete')}
      onConfirm={() => void handleDeleteFormation()}
      onCancel={() => { setDeletingFormation(null); setFormationDeleteError(null); }}
    />}
    <ConfirmDialog
      isOpen={isUnlinkSpondDialogOpen}
      title={t('page.squadSettings.spond.unlinkTitle')}
      message={t('page.squadSettings.spond.unlinkMessage')}
      error={unlinkSpondError}
      confirmText={isUnlinkingSpond ? t('common.states.processing') : t('page.squadSettings.spond.unlinkGroup')}
      onConfirm={() => void handleUnlinkSpond()}
      onCancel={() => setIsUnlinkSpondDialogOpen(false)}
    />
    <ConfirmDialog
      isOpen={isDeactivateDialogOpen}
      title={t('page.squadSettings.deactivate.confirmTitle')}
      message={t('page.squadSettings.deactivate.confirmMessage')}
      confirmText={isDeactivating ? t('common.states.processing') : t('page.squadSettings.deactivate.action')}
      onConfirm={() => void handleDeactivateSquad()}
      onCancel={() => !isDeactivating && setIsDeactivateDialogOpen(false)}
    />
    <StatisticsPeriodModal
      isOpen={isPeriodModalOpen}
      onCancel={() => { setIsPeriodModalOpen(false); setPeriodToEdit(null); }}
      onSubmit={handleSavePeriod}
      periodToEdit={periodToEdit}
      squadName={squad?.name ?? ''}
    />
  </Page>;
}
