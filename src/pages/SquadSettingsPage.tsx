import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSquad, useSquadPeriods, useMatchPlanning, useSfvCatalog, useStore } from '../store';
import { Alert, Badge, Button, ButtonLink, EmptyState, Field, getButtonClassName, IconButton, ListFrame, ListRow, Page, PageDescription, PageHeader, PageHeaderContent, PageTitle, Panel, PanelDescription, PanelHeader, PanelTitle, Select, Switch } from '../components/ui';
import ConfirmDialog from '../components/ConfirmDialog';
import MatchFormatModal, { type MatchFormatFormData } from '../components/MatchFormatModal';
import FormationModal from '../components/FormationModal';
import StatisticsPeriodModal from '../components/StatisticsPeriodModal';
import { getPositionLabelKey, selectSlotDisplayIndexes } from '../store/selectors/matchPlanningSelectors';
import type { Formation, SquadCategory, MatchFormat, Period } from '../types';
import { GROUP_CATEGORIES } from '../store/selectors/squadCategorySelectors';
import {
  selectIsOfficialMatchFormat,
  selectIsTournamentOnlyCategory,
  selectOfficialMatchFormatForCategory,
} from '../store/selectors/sfvCatalogSelectors';
import { selectSpondGroupUrl } from '../store/selectors/squadSettingsSelectors';
import { unlinkSquadFromSpond } from '../services/squadService';
import SpondSyncResultBanner from '../components/SpondSyncResultBanner';

export default function SquadSettingsPage() {
  const { t } = useTranslation();
  const squad = useSquad();
  const navigate = useNavigate();
  const periods = useSquadPeriods();
  const sfvCatalog = useSfvCatalog();
  const spondGroupUrl = selectSpondGroupUrl(squad);
  const initializeApp = useStore((state) => state.initializeApp);
  const deactivateSquad = useStore((state) => state.deactivateSquad);
  const selectedOfficialFormat = (category: SquadCategory | '') => selectOfficialMatchFormatForCategory(sfvCatalog, category || null);
  const {
    matchPlanningEnabled,
    matchFormats,
    formations,
    setMatchPlanningEnabled,
    configureSquadCategory,
    addMatchFormat,
    updateMatchFormat,
    deleteMatchFormat,
    setDefaultMatchFormat,
    addFormation,
    updateFormation,
    deleteFormation,
  } = useMatchPlanning();

  const [isTogglingEnabled, setIsTogglingEnabled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SquadCategory | ''>(squad?.category ?? '');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categorySaveError, setCategorySaveError] = useState<string | null>(null);
  const [isMatchFormatModalOpen, setIsMatchFormatModalOpen] = useState(false);
  const [editingMatchFormat, setEditingMatchFormat] = useState<MatchFormat | null>(null);
  const [deletingMatchFormat, setDeletingMatchFormat] = useState<MatchFormat | null>(null);
  const [isFormationModalOpen, setIsFormationModalOpen] = useState(false);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  const [deletingFormation, setDeletingFormation] = useState<Formation | null>(null);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodToEdit, setPeriodToEdit] = useState<Period | null>(null);
  const [isUnlinkSpondDialogOpen, setIsUnlinkSpondDialogOpen] = useState(false);
  const [isUnlinkingSpond, setIsUnlinkingSpond] = useState(false);
  const [unlinkSpondError, setUnlinkSpondError] = useState<string | null>(null);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCategory(squad?.category ?? '');
  }, [squad?.category]);

  const handleSaveCategory = async () => {
    setCategorySaveError(null);
    setIsSavingCategory(true);
    try {
      const success = await configureSquadCategory(selectedCategory || null);
      if (!success) {
        setCategorySaveError(t('matchPlanning.category.saveFailed'));
      }
    } catch {
      setCategorySaveError(t('matchPlanning.category.saveFailed'));
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleToggleEnabled = async () => {
    setIsTogglingEnabled(true);
    await setMatchPlanningEnabled(!matchPlanningEnabled);
    setIsTogglingEnabled(false);
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
      setUnlinkSpondError(t('squadSettings.spond.unlinkFailed'));
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
      setDeactivateError(t('squadSettings.deactivate.failed'));
      return;
    }
    setIsDeactivateDialogOpen(false);
    navigate('/squads', { replace: true });
  };

  const handleSaveMatchFormat = async (data: MatchFormatFormData) => {
    if (editingMatchFormat) {
      return updateMatchFormat(editingMatchFormat.id, data);
    }
    const created = await addMatchFormat(data);
    return created !== null;
  };

  const handleSaveFormation = async (data: { name: string; slots: Array<{ id?: string; positionCode: import('../types').PositionCode }> }) => {
    if (editingFormation) {
      return updateFormation(editingFormation.id, data);
    }
    const created = await addFormation(data);
    return created !== null;
  };

  return (
    <Page>
      <SpondSyncResultBanner className="mb-4" />
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>{t('squadSettings.title')}</PageTitle>
          <PageDescription>{t('squadSettings.description')}</PageDescription>
        </PageHeaderContent>
      </PageHeader>

      <div className="settings-grid">
        <div className="settings-column">
          <Panel>
            <div className="settings-intro">
              <div className="settings-icon settings-icon--brand">
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12.75 10.5 15l5.25-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div className="settings-intro-content">
                <PanelTitle>{t('squadSettings.spond.title')}</PanelTitle>
                <p className="field-help">{t('squadSettings.spond.description')}</p>
              </div>
            </div>
            {unlinkSpondError && <Alert className="mt-4">{unlinkSpondError}</Alert>}
            <div className="mt-5 flex flex-wrap gap-2">
            {spondGroupUrl ? (
              <>
                <a
                  className={getButtonClassName({ size: 'sm' })}
                  href={spondGroupUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('squadSettings.spond.openGroup')}
                </a>
                <Button variant="danger" size="sm" onClick={() => setIsUnlinkSpondDialogOpen(true)}>
                  {t('squadSettings.spond.unlinkGroup')}
                </Button>
              </>
            ) : (
              <ButtonLink size="sm" to="/spond-import">
                {t('squadSettings.spond.linkGroup')}
              </ButtonLink>
            )}
          </div>
          </Panel>

          <Panel>
            <PanelHeader>
              <div className="settings-intro">
                <div className="settings-icon settings-icon--info">
                  <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 9.75h16.5m-15-4.5h13.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z" />
                  </svg>
                </div>
                <div>
                  <PanelTitle>{t('squadSettings.periods.title')}</PanelTitle>
                  <p className="field-help">{t('squadSettings.periods.description')}</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setPeriodToEdit(null);
                  setIsPeriodModalOpen(true);
                }}
              >
                {t('squadSettings.periods.add')}
              </Button>
            </PanelHeader>
            {periods.length === 0 ? (
              <EmptyState>{t('squadSettings.periods.empty')}</EmptyState>
            ) : (
              <ListFrame>
                {periods.map((period) => (
                  <ListRow key={period.id}>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-content-strong">{period.name}</p>
                      <p className="mt-0.5 text-sm text-content-subtle">
                        {t('squadSettings.periods.range', { startDate: period.startDate, endDate: period.endDate })}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setPeriodToEdit(period);
                        setIsPeriodModalOpen(true);
                      }}
                    >
                      {t('common.actions.edit')}
                    </Button>
                  </ListRow>
                ))}
              </ListFrame>
            )}
          </Panel>
        </div>

        <div className="settings-column">
          <Panel>
            <div className="settings-intro">
              <div className="settings-icon settings-icon--accent">
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75c-4.5 0-8.25 2.1-8.25 4.5S7.5 12.75 12 12.75s8.25-2.1 8.25-4.5S16.5 3.75 12 3.75Zm-8.25 4.5v7.5c0 2.4 3.75 4.5 8.25 4.5s8.25-2.1 8.25-4.5v-7.5" />
                </svg>
              </div>
              <div>
                <PanelTitle>{t('matchPlanning.category.title')}</PanelTitle>
                <p className="field-help">{t('matchPlanning.category.description')}</p>
              </div>
            </div>
            <div className="settings-category-form">
              <Field className="flex-1" label={t('matchPlanning.category.label')} htmlFor="squad-category">
                <Select
                  id="squad-category"
                  value={selectedCategory}
                  onChange={(event) => {
                    setSelectedCategory(event.target.value as SquadCategory | '');
                    setCategorySaveError(null);
                  }}
                >
                  <option value="">{t('matchPlanning.category.none')}</option>
                  {GROUP_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
              </Field>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveCategory}
                disabled={isSavingCategory || selectedCategory === (squad?.category ?? '')}
              >
                {isSavingCategory ? t('matchPlanning.category.saving') : t('common.actions.save')}
              </Button>
            </div>
            {categorySaveError && <Alert className="mt-3">{categorySaveError}</Alert>}
            {selectedCategory && selectedOfficialFormat(selectedCategory) && (
              <Alert tone="warning" className="mt-3">
                {t('matchPlanning.category.officialModeHint', { mode: selectedOfficialFormat(selectedCategory)?.name })}
              </Alert>
            )}
            {selectedCategory && selectIsTournamentOnlyCategory(sfvCatalog, selectedCategory) && (
              <Alert tone="info" className="mt-3">{t('matchPlanning.category.tournamentOnlyHint')}</Alert>
            )}
            {selectedCategory === 'FF14' && (
              <Alert tone="info" className="mt-3">{t('matchPlanning.category.ff14Hint')}</Alert>
            )}
          </Panel>

          <Panel>
            <div className="settings-intro settings-intro--split">
              <div className="settings-intro">
                <div className="settings-icon settings-icon--success">
                  <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18M3 12h18M5.64 5.64l12.72 12.72m0-12.72L5.64 18.36" />
                  </svg>
                </div>
                <div>
                  <PanelTitle>{t('matchPlanning.title')}</PanelTitle>
                  <p className="field-help">{t('matchPlanning.description')}</p>
                </div>
              </div>
            <Switch
              checked={matchPlanningEnabled}
              label={t('matchPlanning.title')}
              disabled={isTogglingEnabled}
              onClick={handleToggleEnabled}
              className="mt-1"
            />
          </div>
            {!matchPlanningEnabled && (
              <Alert tone="info" className="mt-5">
                {t('matchPlanning.disabledState')}
              </Alert>
            )}
          </Panel>
        </div>
      </div>

      {matchPlanningEnabled && (
        <div className="settings-grid settings-grid--secondary">
          <Panel>
              <PanelHeader>
                <PanelTitle>{t('matchPlanning.matchFormats.title')}</PanelTitle>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingMatchFormat(null);
                    setIsMatchFormatModalOpen(true);
                  }}
                >
                  {t('common.actions.add')}
                </Button>
              </PanelHeader>

              {matchFormats.length === 0 ? (
                <EmptyState>{t('matchPlanning.matchFormats.emptyState')}</EmptyState>
              ) : (
                <ListFrame>
                  {matchFormats.map((matchFormat) => (
                    <ListRow
                      key={matchFormat.id}
                      align="start"
                    >
                      <div className="min-w-0">
                        <div className="layout-cluster layout-cluster--wrap">
                          <span className="font-semibold text-content-strong">{matchFormat.name}</span>
                          {matchFormat.isDefault && (
                            <Badge tone="brand" size="sm">
                              {t('matchPlanning.matchFormats.defaultBadge')}
                            </Badge>
                          )}
                          {selectIsOfficialMatchFormat(matchFormat) && (
                            <Badge tone="info" size="sm">
                              {t('matchPlanning.matchFormats.officialBadge')}
                            </Badge>
                          )}
                        </div>
                        {matchFormat.playersOnField !== undefined && (
                          <div className="field-help">
                            {t('matchPlanning.matchFormats.players', {
                              onField: matchFormat.playersOnField,
                              min: matchFormat.minPlayersPerTeam ?? '-',
                              max: matchFormat.maxPlayersPerTeam ?? '-',
                            })}
                          </div>
                        )}
                        <div className="body-muted">
                          {t('matchPlanning.matchFormats.summary', {
                            periods: matchFormat.numberOfPeriods,
                            minutes: matchFormat.periodLengthMinutes,
                          })}
                        </div>
                        <div className="body-muted">
                          {t('matchPlanning.matchFormats.minimumPeriods', {
                            count: matchFormat.minimumPeriodsPerPlayer ?? 0,
                          })}
                        </div>
                      </div>
                      <div className="settings-list-actions">
                        {!matchFormat.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDefaultMatchFormat(matchFormat.id)}
                            className="mr-1"
                          >
                            {t('matchPlanning.matchFormats.setDefault')}
                          </Button>
                        )}
                        <IconButton
                          label={t('common.actions.edit')}
                          onClick={() => {
                            setEditingMatchFormat(matchFormat);
                            setIsMatchFormatModalOpen(true);
                          }}
                        >
                          <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </IconButton>
                        <IconButton
                          label={t('common.actions.delete')}
                          variant="danger"
                          onClick={() => setDeletingMatchFormat(matchFormat)}
                        >
                          <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </IconButton>
                      </div>
                    </ListRow>
                  ))}
                </ListFrame>
              )}
          </Panel>

          <Panel>
              <PanelHeader>
                <PanelTitle>{t('matchPlanning.formations.title')}</PanelTitle>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingFormation(null);
                    setIsFormationModalOpen(true);
                  }}
                >
                  {t('common.actions.add')}
                </Button>
              </PanelHeader>

              {formations.length === 0 ? (
                <EmptyState>{t('matchPlanning.formations.emptyState')}</EmptyState>
              ) : (
                <ListFrame>
                  {formations.map((formation) => {
                    const displayIndexes = selectSlotDisplayIndexes(formation.slots);
                    return (
                      <ListRow key={formation.id}>
                        <div className="w-full">
                        <div className="layout-split">
                          <span className="font-semibold text-content-strong">{formation.name}</span>
                          <div className="settings-list-actions">
                            <IconButton
                              label={t('common.actions.edit')}
                              onClick={() => {
                                setEditingFormation(formation);
                                setIsFormationModalOpen(true);
                              }}
                            >
                              <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                              </svg>
                            </IconButton>
                            <IconButton
                              label={t('common.actions.delete')}
                              variant="danger"
                              onClick={() => setDeletingFormation(formation)}
                            >
                              <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </IconButton>
                          </div>
                        </div>
                        <div className="settings-formation-slots">
                          {formation.slots.map((slot) => {
                            const displayIndex = displayIndexes.get(slot.id);
                            return (
                              <Badge key={slot.id} tone="neutral" size="sm">
                                {t(getPositionLabelKey(slot.positionCode))}
                                {displayIndex !== null && displayIndex !== undefined ? ` ${displayIndex}` : ''}
                              </Badge>
                            );
                          })}
                        </div>
                        </div>
                      </ListRow>
                    );
                  })}
                </ListFrame>
              )}
          </Panel>
        </div>
      )}

      <Panel tone="danger" className="mt-5">
        <PanelTitle>{t('squadSettings.deactivate.title')}</PanelTitle>
        <PanelDescription>{t('squadSettings.deactivate.description')}</PanelDescription>
        {deactivateError && <Alert className="mt-3">{deactivateError}</Alert>}
        <Button className="mt-4" variant="danger" size="sm" onClick={() => setIsDeactivateDialogOpen(true)}>
          {t('squadSettings.deactivate.action')}
        </Button>
      </Panel>

      {isMatchFormatModalOpen && (
        <MatchFormatModal
          isOpen={isMatchFormatModalOpen}
          onClose={() => setIsMatchFormatModalOpen(false)}
          matchFormatToEdit={editingMatchFormat}
          onSave={handleSaveMatchFormat}
        />
      )}

      {isFormationModalOpen && (
        <FormationModal
          isOpen={isFormationModalOpen}
          onClose={() => setIsFormationModalOpen(false)}
          formationToEdit={editingFormation}
          onSave={handleSaveFormation}
        />
      )}

      {deletingMatchFormat && (
        <ConfirmDialog
          isOpen={true}
          title={t('matchPlanning.matchFormats.deleteTitle')}
          message={t('matchPlanning.matchFormats.deleteMessage', { name: deletingMatchFormat.name })}
          confirmText={t('common.actions.delete')}
          onConfirm={async () => {
            await deleteMatchFormat(deletingMatchFormat.id);
            setDeletingMatchFormat(null);
          }}
          onCancel={() => setDeletingMatchFormat(null)}
        />
      )}

      {deletingFormation && (
        <ConfirmDialog
          isOpen={true}
          title={t('matchPlanning.formations.deleteTitle')}
          message={t('matchPlanning.formations.deleteMessage', { name: deletingFormation.name })}
          confirmText={t('common.actions.delete')}
          onConfirm={async () => {
            await deleteFormation(deletingFormation.id);
            setDeletingFormation(null);
          }}
          onCancel={() => setDeletingFormation(null)}
        />
      )}

      <ConfirmDialog
        isOpen={isUnlinkSpondDialogOpen}
        title={t('squadSettings.spond.unlinkTitle')}
        message={t('squadSettings.spond.unlinkMessage')}
        confirmText={isUnlinkingSpond ? t('common.states.processing') : t('squadSettings.spond.unlinkGroup')}
        onConfirm={() => void handleUnlinkSpond()}
        onCancel={() => setIsUnlinkSpondDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeactivateDialogOpen}
        title={t('squadSettings.deactivate.confirmTitle')}
        message={t('squadSettings.deactivate.confirmMessage')}
        confirmText={isDeactivating ? t('common.states.processing') : t('squadSettings.deactivate.action')}
        onConfirm={() => void handleDeactivateSquad()}
        onCancel={() => !isDeactivating && setIsDeactivateDialogOpen(false)}
      />

      <StatisticsPeriodModal
        isOpen={isPeriodModalOpen}
        onClose={() => {
          setIsPeriodModalOpen(false);
          setPeriodToEdit(null);
        }}
        periodToEdit={periodToEdit}
      />
    </Page>
  );
}
