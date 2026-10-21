import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useActivities, useSquad, useSquadPeriods, useMatchPlanning, useSfvCatalog, useStore } from '../store';
import { AddCardButton, Alert, Badge, Button, ButtonAnchor, ButtonLink, Cluster, ContentGrid, EntityActions, EntityContent, EntityList, EntityMeta, EntityTitle, Field, IconButton, IconTile, Page, PageDescription, PageHeader, PageHeaderContent, PageTitle, Panel, PanelDescription, PanelHeader, PanelTitle, Select, Split, Stack, SwipeableEntityRow, Switch } from '../components/ui';
import ConfirmDialog from '../components/ConfirmDialog';
import MatchFormatModal, { type MatchFormatFormData } from '../components/MatchFormatModal';
import FormationModal from '../components/FormationModal';
import StatisticsPeriodModal from '../components/StatisticsPeriodModal';
import { getPositionLabelKey, selectReferencedFormationIds, selectReferencedMatchFormatIds, selectSlotDisplayIndexes } from '../store/selectors/matchPlanningSelectors';
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
  const { activities } = useActivities();
  const periods = useSquadPeriods();
  const sfvCatalog = useSfvCatalog();
  const spondGroupUrl = selectSpondGroupUrl(squad);
  const referencedFormationIds = selectReferencedFormationIds(activities);
  const referencedMatchFormatIds = selectReferencedMatchFormatIds(activities);
  const initializeApp = useStore((state) => state.initializeApp);
  const deactivateSquad = useStore((state) => state.deactivateSquad);
  const deleteSquadPeriod = useStore((state) => state.deleteSquadPeriod);
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

  useEffect(() => {
    setSelectedCategory(squad?.category ?? '');
  }, [squad?.category]);

  const handleDeleteFormation = async () => {
    if (!deletingFormation) return;

    const formationToDelete = deletingFormation;
    setDeletingFormation(null);
    setFormationDeleteError(null);
    const wasDeleted = await deleteFormation(formationToDelete.id);
    if (wasDeleted) {
      return;
    }

    setFormationDeleteError(t('page.matchPlanning.formations.errors.deleteFailed'));
  };

  const handleDeleteMatchFormat = async () => {
    if (!deletingMatchFormat) return;

    const matchFormatToDelete = deletingMatchFormat;
    setDeletingMatchFormat(null);
    setMatchFormatDeleteError(null);
    const wasDeleted = await deleteMatchFormat(matchFormatToDelete.id);
    if (wasDeleted) return;

    setMatchFormatDeleteError(t('page.matchPlanning.matchFormats.errors.deleteFailed'));
  };

  const handleSaveCategory = async () => {
    setCategorySaveError(null);
    setIsSavingCategory(true);
    try {
      const success = await configureSquadCategory(selectedCategory || null);
      if (!success) {
        setCategorySaveError(t('page.matchPlanning.category.saveFailed'));
      }
    } catch {
      setCategorySaveError(t('page.matchPlanning.category.saveFailed'));
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

  const handleDeletePeriod = async () => {
    if (!deletingPeriod) return;
    await deleteSquadPeriod(deletingPeriod.id);
    setDeletingPeriod(null);
  };

  return (
    <Page>
      <SpondSyncResultBanner className="settings-banner" />
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>{t('page.squadSettings.title')}</PageTitle>
          <PageDescription>{t('page.squadSettings.description')}</PageDescription>
        </PageHeaderContent>
      </PageHeader>

      <ContentGrid variant="equal">
        <Stack>
          <Panel>
            <Cluster align="start" gap="sm" wrap={false}>
              <IconTile tone="brand">
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12.75 10.5 15l5.25-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </IconTile>
              <EntityContent>
                <PanelTitle>{t('page.squadSettings.spond.title')}</PanelTitle>
                <p className="field-help">{t('page.squadSettings.spond.description')}</p>
              </EntityContent>
            </Cluster>
            {unlinkSpondError && <Alert className="settings-panel-alert">{unlinkSpondError}</Alert>}
            <Cluster gap="sm" className="settings-panel-actions">
            {spondGroupUrl ? (
              <>
                <ButtonAnchor
                  size="sm"
                  href={spondGroupUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('page.squadSettings.spond.openGroup')}
                </ButtonAnchor>
                <Button variant="danger" size="sm" onClick={() => setIsUnlinkSpondDialogOpen(true)}>
                  {t('page.squadSettings.spond.unlinkGroup')}
                </Button>
              </>
            ) : (
              <ButtonLink size="sm" to="/spond-import">
                {t('page.squadSettings.spond.linkGroup')}
              </ButtonLink>
            )}
            </Cluster>
          </Panel>

          <Panel>
            <PanelHeader>
              <Cluster align="start" gap="sm" wrap={false}>
                <IconTile tone="info">
                  <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 9.75h16.5m-15-4.5h13.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z" />
                  </svg>
                </IconTile>
                <EntityContent>
                  <PanelTitle>{t('page.squadSettings.periods.title')}</PanelTitle>
                  <p className="field-help">{t('page.squadSettings.periods.description')}</p>
                </EntityContent>
              </Cluster>
            </PanelHeader>
            <EntityList>
              {periods.map((period) => (
                <SwipeableEntityRow
                  key={period.id}
                  onEdit={() => {
                    setPeriodToEdit(period);
                    setIsPeriodModalOpen(true);
                  }}
                  onDelete={() => setDeletingPeriod(period)}
                >
                  <EntityContent>
                    <EntityTitle>{period.name}</EntityTitle>
                    <EntityMeta>
                      {t('page.squadSettings.periods.range', { startDate: period.startDate, endDate: period.endDate })}
                    </EntityMeta>
                  </EntityContent>
                </SwipeableEntityRow>
              ))}
              <AddCardButton
                cardSize="sm"
                label={t('page.squadSettings.periods.add')}
                onClick={() => {
                  setPeriodToEdit(null);
                  setIsPeriodModalOpen(true);
                }}
              />
            </EntityList>
          </Panel>
        </Stack>

        <Stack>
          <Panel>
            <Cluster align="start" gap="sm" wrap={false}>
              <IconTile tone="brand">
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75c-4.5 0-8.25 2.1-8.25 4.5S7.5 12.75 12 12.75s8.25-2.1 8.25-4.5S16.5 3.75 12 3.75Zm-8.25 4.5v7.5c0 2.4 3.75 4.5 8.25 4.5s8.25-2.1 8.25-4.5v-7.5" />
                </svg>
              </IconTile>
              <EntityContent>
                <PanelTitle>{t('page.matchPlanning.category.title')}</PanelTitle>
                <p className="field-help">{t('page.matchPlanning.category.description')}</p>
              </EntityContent>
            </Cluster>
            <div className="settings-category-form">
              <Field className="settings-category-field" label={t('page.matchPlanning.category.label')} htmlFor="squad-category">
                <Select
                  id="squad-category"
                  controlSize="sm"
                  className={'settings-category-select'}
                  value={selectedCategory}
                  onChange={(event) => {
                    setSelectedCategory(event.target.value as SquadCategory | '');
                    setCategorySaveError(null);
                  }}
                >
                  <option value="">{t('page.matchPlanning.category.none')}</option>
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
                {isSavingCategory ? t('page.matchPlanning.category.saving') : t('common.actions.save')}
              </Button>
            </div>
            {categorySaveError && <Alert className="settings-category-alert">{categorySaveError}</Alert>}
            {selectedCategory && selectedOfficialFormat(selectedCategory) && (
              <Alert tone="warning" className="settings-category-alert">
                {t('page.matchPlanning.category.officialModeHint', { mode: selectedOfficialFormat(selectedCategory)?.name })}
              </Alert>
            )}
            {selectedCategory && selectIsTournamentOnlyCategory(sfvCatalog, selectedCategory) && (
              <Alert tone="info" className="settings-category-alert">{t('page.matchPlanning.category.tournamentOnlyHint')}</Alert>
            )}
            {selectedCategory === 'FF14' && (
              <Alert tone="info" className="settings-category-alert">{t('page.matchPlanning.category.ff14Hint')}</Alert>
            )}
          </Panel>

          <Panel>
            <Split align="start">
              <Cluster align="start" gap="sm" wrap={false}>
                <IconTile tone="success">
                  <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18M3 12h18M5.64 5.64l12.72 12.72m0-12.72L5.64 18.36" />
                  </svg>
                </IconTile>
                <EntityContent>
                  <PanelTitle>{t('page.matchPlanning.title')}</PanelTitle>
                  <p className="field-help">{t('page.matchPlanning.description')}</p>
                </EntityContent>
              </Cluster>
            <Switch
              checked={matchPlanningEnabled}
              label={t('page.matchPlanning.title')}
              disabled={isTogglingEnabled}
              onClick={handleToggleEnabled}
            />
            </Split>
            {!matchPlanningEnabled && (
              <Alert tone="info" className="settings-disabled-alert">
                {t('page.matchPlanning.disabledState')}
              </Alert>
            )}
          </Panel>
        </Stack>
      </ContentGrid>

      {matchPlanningEnabled && (
        <ContentGrid variant="equal" className="settings-grid--secondary">
          <Panel>
              <PanelHeader>
                <PanelTitle>{t('page.matchPlanning.matchFormats.title')}</PanelTitle>
              </PanelHeader>

              {matchFormatDeleteError && <Alert>{matchFormatDeleteError}</Alert>}

              <EntityList>
                {matchFormats.map((matchFormat) => {
                    const canDeleteMatchFormat = !referencedMatchFormatIds.has(matchFormat.id);
                    return (
                    <SwipeableEntityRow
                      key={matchFormat.id}
                      align="start"
                      onDelete={canDeleteMatchFormat ? () => setDeletingMatchFormat(matchFormat) : undefined}
                      showDesktopDelete={false}
                    >
                      <EntityContent>
                        <Cluster gap="sm">
                          <EntityTitle>{matchFormat.name}</EntityTitle>
                          {matchFormat.isDefault && (
                            <Badge tone="brand" size="sm">
                              {t('page.matchPlanning.matchFormats.defaultBadge')}
                            </Badge>
                          )}
                          {selectIsOfficialMatchFormat(matchFormat) && (
                            <Badge tone="info" size="sm">
                              {t('page.matchPlanning.matchFormats.officialBadge')}
                            </Badge>
                          )}
                        </Cluster>
                        {matchFormat.playersOnField !== undefined && (
                          <EntityMeta>
                            {t('page.matchPlanning.matchFormats.players', {
                              onField: matchFormat.playersOnField,
                              min: matchFormat.minPlayersPerTeam ?? '-',
                              max: matchFormat.maxPlayersPerTeam ?? '-',
                            })}
                          </EntityMeta>
                        )}
                        <EntityMeta>
                          {t('page.matchPlanning.matchFormats.summary', {
                            periods: matchFormat.numberOfPeriods,
                            minutes: matchFormat.periodLengthMinutes,
                          })}
                        </EntityMeta>
                        <EntityMeta>
                          {t('page.matchPlanning.matchFormats.minimumPeriods', {
                            count: matchFormat.minimumPeriodsPerPlayer ?? 0,
                          })}
                        </EntityMeta>
                      </EntityContent>
                      <EntityActions className={'ui-entity-actions--separated'}>
                        {!matchFormat.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDefaultMatchFormat(matchFormat.id)}
                          >
                            {t('page.matchPlanning.matchFormats.setDefault')}
                          </Button>
                        )}
                        {!selectIsOfficialMatchFormat(matchFormat) && <IconButton
                          label={t('common.actions.edit')}
                          onClick={() => {
                            setEditingMatchFormat(matchFormat);
                            setIsMatchFormatModalOpen(true);
                          }}
                        >
                          <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </IconButton>}
                        {canDeleteMatchFormat && <IconButton
                          label={t('common.actions.delete')}
                          variant="danger"
                          onClick={() => setDeletingMatchFormat(matchFormat)}
                        >
                          <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </IconButton>}
                      </EntityActions>
                    </SwipeableEntityRow>
                    );
                })}
                <AddCardButton
                  cardSize="sm"
                  label={t('common.actions.add')}
                  onClick={() => {
                    setEditingMatchFormat(null);
                    setIsMatchFormatModalOpen(true);
                  }}
                />
              </EntityList>
          </Panel>

          <Panel>
              <PanelHeader>
                <PanelTitle>{t('page.matchPlanning.formations.title')}</PanelTitle>
              </PanelHeader>

              {formationDeleteError && <Alert>{formationDeleteError}</Alert>}

              <EntityList>
                {formations.map((formation) => {
                    const displayIndexes = selectSlotDisplayIndexes(formation.slots);
                    const canDeleteFormation = !referencedFormationIds.has(formation.id);
                    return (
                      <SwipeableEntityRow key={formation.id} align="start" onDelete={canDeleteFormation ? () => setDeletingFormation(formation) : undefined} showDesktopDelete={false}>
                        <EntityContent>
                          <EntityTitle>{formation.name}</EntityTitle>
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
                        </EntityContent>
                        <EntityActions className={'ui-entity-actions--separated'}>
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
                            {canDeleteFormation && (
                              <IconButton
                                label={t('common.actions.delete')}
                                variant="danger"
                                onClick={() => setDeletingFormation(formation)}
                              >
                                <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244-2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                              </IconButton>
                            )}
                        </EntityActions>
                      </SwipeableEntityRow>
                    );
                })}
                <AddCardButton
                  cardSize="sm"
                  label={t('common.actions.add')}
                  onClick={() => {
                    setEditingFormation(null);
                    setIsFormationModalOpen(true);
                  }}
                />
              </EntityList>
          </Panel>
        </ContentGrid>
      )}

      <Panel tone="danger" className="settings-danger-panel">
        <PanelTitle>{t('page.squadSettings.deactivate.title')}</PanelTitle>
        <PanelDescription>{t('page.squadSettings.deactivate.description')}</PanelDescription>
        {deactivateError && <Alert className="settings-danger-alert">{deactivateError}</Alert>}
        <Button className="settings-danger-action" variant="danger" size="sm" onClick={() => setIsDeactivateDialogOpen(true)}>
          {t('page.squadSettings.deactivate.action')}
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

      {deletingPeriod && (
        <ConfirmDialog
          isOpen={true}
          title={t('page.statistics.period.deleteTitle')}
          message={t('page.statistics.period.deleteMessage', { period: deletingPeriod.name })}
          confirmText={t('common.actions.delete')}
          onConfirm={() => void handleDeletePeriod()}
          onCancel={() => setDeletingPeriod(null)}
          confirmButtonColor="red"
        />
      )}

      {deletingMatchFormat && (
        <ConfirmDialog
          isOpen={true}
          title={t('page.matchPlanning.matchFormats.deleteTitle')}
          message={t('page.matchPlanning.matchFormats.deleteMessage', { name: deletingMatchFormat.name })}
          confirmText={t('common.actions.delete')}
          onConfirm={() => void handleDeleteMatchFormat()}
          onCancel={() => {
            setDeletingMatchFormat(null);
            setMatchFormatDeleteError(null);
          }}
        />
      )}

      {deletingFormation && (
        <ConfirmDialog
          isOpen={true}
          title={t('page.matchPlanning.formations.deleteTitle')}
          message={t('page.matchPlanning.formations.deleteMessage', { name: deletingFormation.name })}
          confirmText={t('common.actions.delete')}
          onConfirm={() => void handleDeleteFormation()}
          onCancel={() => {
            setDeletingFormation(null);
            setFormationDeleteError(null);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={isUnlinkSpondDialogOpen}
        title={t('page.squadSettings.spond.unlinkTitle')}
        message={t('page.squadSettings.spond.unlinkMessage')}
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
        onClose={() => {
          setIsPeriodModalOpen(false);
          setPeriodToEdit(null);
        }}
        periodToEdit={periodToEdit}
      />
    </Page>
  );
}
