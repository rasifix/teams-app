import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSquad, useSquadPeriods, useMatchPlanning, useSfvCatalog, useStore } from '../store';
import { Card, CardBody, CardTitle } from '../components/ui';
import Button from '../components/ui/Button';
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
import { selectSpondGroupUrl } from '../store/selectors/groupSettingsSelectors';
import { unlinkSquadFromSpond } from '../services/squadService';
import SpondSyncResultBanner from '../components/SpondSyncResultBanner';

export default function MatchPlanningPage() {
  const { t } = useTranslation();
  const squad = useSquad();
  const periods = useSquadPeriods();
  const sfvCatalog = useSfvCatalog();
  const spondGroupUrl = selectSpondGroupUrl(squad);
  const initializeApp = useStore((state) => state.initializeApp);
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
      setUnlinkSpondError(t('groupSettings.spond.unlinkFailed'));
    } finally {
      setIsUnlinkingSpond(false);
    }
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
    <div className="page-container">
      <SpondSyncResultBanner className="mb-4" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('groupSettings.title')}</h1>
        <p className="mt-1 text-sm text-gray-600">{t('groupSettings.description')}</p>
      </div>

      <Card className="mb-4">
        <CardBody>
          <CardTitle>{t('groupSettings.spond.title')}</CardTitle>
          <p className="mt-1 text-sm text-gray-600">{t('groupSettings.spond.description')}</p>
          {unlinkSpondError && <p className="mt-3 text-sm text-red-700">{unlinkSpondError}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {spondGroupUrl ? (
              <>
                <a
                  className="btn-primary inline-block"
                  href={spondGroupUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('groupSettings.spond.openGroup')}
                </a>
                <Button variant="danger" onClick={() => setIsUnlinkSpondDialogOpen(true)}>
                  {t('groupSettings.spond.unlinkGroup')}
                </Button>
              </>
            ) : (
              <Link className="btn-primary inline-block" to="/spond-import">
                {t('groupSettings.spond.linkGroup')}
              </Link>
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardBody>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <CardTitle>{t('groupSettings.periods.title')}</CardTitle>
              <p className="mt-1 text-sm text-gray-600">{t('groupSettings.periods.description')}</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setPeriodToEdit(null);
                setIsPeriodModalOpen(true);
              }}
            >
              {t('groupSettings.periods.add')}
            </Button>
          </div>
          {periods.length === 0 ? (
            <div className="empty-state">{t('groupSettings.periods.empty')}</div>
          ) : (
            <div className="space-y-2">
              {periods.map((period) => (
                <div key={period.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{period.name}</p>
                    <p className="text-sm text-gray-500">
                      {t('groupSettings.periods.range', { startDate: period.startDate, endDate: period.endDate })}
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
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardBody>
          <CardTitle>{t('matchPlanning.category.title')}</CardTitle>
          <p className="text-sm text-gray-600 mt-1 mb-4">{t('matchPlanning.category.description')}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label htmlFor="group-category" className="form-label">{t('matchPlanning.category.label')}</label>
              <select
                id="squad-category"
                value={selectedCategory}
                onChange={(event) => {
                  setSelectedCategory(event.target.value as SquadCategory | '');
                  setCategorySaveError(null);
                }}
                className="form-input"
              >
                <option value="">{t('matchPlanning.category.none')}</option>
                {GROUP_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              onClick={handleSaveCategory}
              disabled={isSavingCategory || selectedCategory === (squad?.category ?? '')}
            >
              {isSavingCategory ? t('matchPlanning.category.saving') : t('common.actions.save')}
            </Button>
          </div>
          {categorySaveError && (
            <p className="mt-3 text-sm text-red-600" role="alert">{categorySaveError}</p>
          )}
          {selectedCategory && selectedOfficialFormat(selectedCategory) && (
            <p className="mt-3 text-sm text-orange-700">
              {t('matchPlanning.category.officialModeHint', {
                mode: selectedOfficialFormat(selectedCategory)?.name,
              })}
            </p>
          )}
          {selectedCategory && selectIsTournamentOnlyCategory(sfvCatalog, selectedCategory) && (
            <p className="mt-3 text-sm text-gray-600">{t('matchPlanning.category.tournamentOnlyHint')}</p>
          )}
          {selectedCategory === 'FF14' && (
            <p className="mt-3 text-sm text-gray-600">{t('matchPlanning.category.ff14Hint')}</p>
          )}
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('matchPlanning.title')}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{t('matchPlanning.description')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={matchPlanningEnabled}
              disabled={isTogglingEnabled}
              onClick={handleToggleEnabled}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                matchPlanningEnabled ? 'bg-orange-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  matchPlanningEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardBody>
      </Card>

      {!matchPlanningEnabled ? (
        <div className="empty-state">{t('matchPlanning.disabledState')}</div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardBody>
              <div className="flex justify-between items-center mb-4">
                <CardTitle>{t('matchPlanning.matchFormats.title')}</CardTitle>
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
              </div>

              {matchFormats.length === 0 ? (
                <div className="empty-state">{t('matchPlanning.matchFormats.emptyState')}</div>
              ) : (
                <div className="space-y-2">
                  {matchFormats.map((matchFormat) => (
                    <div
                      key={matchFormat.id}
                      className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{matchFormat.name}</span>
                          {matchFormat.isDefault && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              {t('matchPlanning.matchFormats.defaultBadge')}
                            </span>
                          )}
                          {selectIsOfficialMatchFormat(matchFormat) && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {t('matchPlanning.matchFormats.officialBadge')}
                            </span>
                          )}
                        </div>
                        {matchFormat.playersOnField !== undefined && (
                          <div className="text-sm text-gray-500">
                            {t('matchPlanning.matchFormats.players', {
                              onField: matchFormat.playersOnField,
                              min: matchFormat.minPlayersPerTeam ?? '-',
                              max: matchFormat.maxPlayersPerTeam ?? '-',
                            })}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          {t('matchPlanning.matchFormats.summary', {
                            periods: matchFormat.numberOfPeriods,
                            minutes: matchFormat.periodLengthMinutes,
                          })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {t('matchPlanning.matchFormats.minimumPeriods', {
                            count: matchFormat.minimumPeriodsPerPlayer ?? 0,
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!matchFormat.isDefault && (
                          <button
                            type="button"
                            onClick={() => setDefaultMatchFormat(matchFormat.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {t('matchPlanning.matchFormats.setDefault')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMatchFormat(matchFormat);
                            setIsMatchFormatModalOpen(true);
                          }}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title={t('common.actions.edit')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingMatchFormat(matchFormat)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title={t('common.actions.delete')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex justify-between items-center mb-4">
                <CardTitle>{t('matchPlanning.formations.title')}</CardTitle>
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
              </div>

              {formations.length === 0 ? (
                <div className="empty-state">{t('matchPlanning.formations.emptyState')}</div>
              ) : (
                <div className="space-y-2">
                  {formations.map((formation) => {
                    const displayIndexes = selectSlotDisplayIndexes(formation.slots);
                    return (
                      <div key={formation.id} className="border border-gray-200 rounded-lg px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{formation.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFormation(formation);
                                setIsFormationModalOpen(true);
                              }}
                              className="text-blue-500 hover:text-blue-700 p-1"
                              title={t('common.actions.edit')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingFormation(formation)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title={t('common.actions.delete')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {formation.slots.map((slot) => {
                            const displayIndex = displayIndexes.get(slot.id);
                            return (
                              <span key={slot.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                {t(getPositionLabelKey(slot.positionCode))}
                                {displayIndex !== null && displayIndex !== undefined ? ` ${displayIndex}` : ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

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
        title={t('groupSettings.spond.unlinkTitle')}
        message={t('groupSettings.spond.unlinkMessage')}
        confirmText={isUnlinkingSpond ? t('common.states.processing') : t('groupSettings.spond.unlinkGroup')}
        onConfirm={() => void handleUnlinkSpond()}
        onCancel={() => setIsUnlinkSpondDialogOpen(false)}
      />

      <StatisticsPeriodModal
        isOpen={isPeriodModalOpen}
        onClose={() => {
          setIsPeriodModalOpen(false);
          setPeriodToEdit(null);
        }}
        periodToEdit={periodToEdit}
      />
    </div>
  );
}
