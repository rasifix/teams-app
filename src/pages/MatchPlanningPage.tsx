import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useSquad, useSquadPeriods, useMatchPlanning, useSfvCatalog, useStore } from '../store';
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
      setUnlinkSpondError(t('groupSettings.spond.unlinkFailed'));
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
      setDeactivateError(t('groupSettings.deactivate.failed'));
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <SpondSyncResultBanner className="mb-4" />
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t('groupSettings.title')}</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">{t('groupSettings.description')}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12.75 10.5 15l5.25-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">{t('groupSettings.spond.title')}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{t('groupSettings.spond.description')}</p>
              </div>
            </div>
            {unlinkSpondError && <p className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{unlinkSpondError}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
            {spondGroupUrl ? (
              <>
                <a
                  className="btn-primary inline-flex items-center"
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
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 9.75h16.5m-15-4.5h13.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-950">{t('groupSettings.periods.title')}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{t('groupSettings.periods.description')}</p>
                </div>
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
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{t('groupSettings.periods.empty')}</div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                {periods.map((period) => (
                  <div key={period.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{period.name}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
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
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75c-4.5 0-8.25 2.1-8.25 4.5S7.5 12.75 12 12.75s8.25-2.1 8.25-4.5S16.5 3.75 12 3.75Zm-8.25 4.5v7.5c0 2.4 3.75 4.5 8.25 4.5s8.25-2.1 8.25-4.5v-7.5" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">{t('matchPlanning.category.title')}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{t('matchPlanning.category.description')}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="squad-category" className="form-label">{t('matchPlanning.category.label')}</label>
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
            {categorySaveError && <p className="mt-3 text-sm text-red-600" role="alert">{categorySaveError}</p>}
            {selectedCategory && selectedOfficialFormat(selectedCategory) && (
              <p className="mt-3 rounded-xl bg-orange-50 px-3.5 py-2.5 text-sm text-orange-800">
                {t('matchPlanning.category.officialModeHint', { mode: selectedOfficialFormat(selectedCategory)?.name })}
              </p>
            )}
            {selectedCategory && selectIsTournamentOnlyCategory(sfvCatalog, selectedCategory) && (
              <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">{t('matchPlanning.category.tournamentOnlyHint')}</p>
            )}
            {selectedCategory === 'FF14' && (
              <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">{t('matchPlanning.category.ff14Hint')}</p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
            <div className="flex items-start justify-between gap-5">
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18M3 12h18M5.64 5.64l12.72 12.72m0-12.72L5.64 18.36" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-950">{t('matchPlanning.title')}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{t('matchPlanning.description')}</p>
                </div>
              </div>
            <button
              type="button"
              role="switch"
              aria-checked={matchPlanningEnabled}
              aria-label={t('matchPlanning.title')}
              disabled={isTogglingEnabled}
              onClick={handleToggleEnabled}
              className={`relative mt-1 inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full shadow-inner transition-colors focus:outline-none focus:ring-4 focus:ring-orange-100 ${
                matchPlanningEnabled ? 'bg-orange-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  matchPlanningEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
            {!matchPlanningEnabled && (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                {t('matchPlanning.disabledState')}
              </div>
            )}
          </section>
        </div>
      </div>

      {matchPlanningEnabled && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:items-start">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">{t('matchPlanning.matchFormats.title')}</h2>
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
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{t('matchPlanning.matchFormats.emptyState')}</div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                  {matchFormats.map((matchFormat) => (
                    <div
                      key={matchFormat.id}
                      className="flex items-start justify-between gap-4 px-4 py-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">{matchFormat.name}</span>
                          {matchFormat.isDefault && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-orange-700">
                              {t('matchPlanning.matchFormats.defaultBadge')}
                            </span>
                          )}
                          {selectIsOfficialMatchFormat(matchFormat) && (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sky-700">
                              {t('matchPlanning.matchFormats.officialBadge')}
                            </span>
                          )}
                        </div>
                        {matchFormat.playersOnField !== undefined && (
                          <div className="mt-1 text-sm text-slate-500">
                            {t('matchPlanning.matchFormats.players', {
                              onField: matchFormat.playersOnField,
                              min: matchFormat.minPlayersPerTeam ?? '-',
                              max: matchFormat.maxPlayersPerTeam ?? '-',
                            })}
                          </div>
                        )}
                        <div className="text-sm text-slate-500">
                          {t('matchPlanning.matchFormats.summary', {
                            periods: matchFormat.numberOfPeriods,
                            minutes: matchFormat.periodLengthMinutes,
                          })}
                        </div>
                        <div className="text-sm text-slate-500">
                          {t('matchPlanning.matchFormats.minimumPeriods', {
                            count: matchFormat.minimumPeriodsPerPlayer ?? 0,
                          })}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {!matchFormat.isDefault && (
                          <button
                            type="button"
                            onClick={() => setDefaultMatchFormat(matchFormat.id)}
                            className="mr-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-50"
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
                            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
                          title={t('common.actions.edit')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingMatchFormat(matchFormat)}
                          className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
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
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">{t('matchPlanning.formations.title')}</h2>
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
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{t('matchPlanning.formations.emptyState')}</div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                  {formations.map((formation) => {
                    const displayIndexes = selectSlotDisplayIndexes(formation.slots);
                    return (
                      <div key={formation.id} className="px-4 py-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{formation.name}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFormation(formation);
                                setIsFormationModalOpen(true);
                              }}
                              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
                              title={t('common.actions.edit')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingFormation(formation)}
                              className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              title={t('common.actions.delete')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {formation.slots.map((slot) => {
                            const displayIndex = displayIndexes.get(slot.id);
                            return (
                              <span key={slot.id} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
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
          </section>
        </div>
      )}

      <section className="mt-5 rounded-3xl border border-red-200 bg-red-50/60 p-5 shadow-[0_16px_40px_-32px_rgba(15,29,38,.25)] sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-red-950">{t('groupSettings.deactivate.title')}</h2>
        <p className="mt-1 text-sm leading-6 text-red-800/80">{t('groupSettings.deactivate.description')}</p>
        {deactivateError && <p className="mt-3 text-sm text-red-700" role="alert">{deactivateError}</p>}
        <Button className="mt-4" variant="danger" onClick={() => setIsDeactivateDialogOpen(true)}>
          {t('groupSettings.deactivate.action')}
        </Button>
      </section>

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

      <ConfirmDialog
        isOpen={isDeactivateDialogOpen}
        title={t('groupSettings.deactivate.confirmTitle')}
        message={t('groupSettings.deactivate.confirmMessage')}
        confirmText={isDeactivating ? t('common.states.processing') : t('groupSettings.deactivate.action')}
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
    </div>
  );
}
