import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatchPlanning } from '../store';
import { Card, CardBody, CardTitle } from '../components/ui';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import PlayingModeModal from '../components/PlayingModeModal';
import FormationModal from '../components/FormationModal';
import { getPositionLabelKey, selectSlotDisplayIndexes } from '../store/selectors/matchPlanningSelectors';
import type { Formation, PlayingMode } from '../types';

export default function MatchPlanningPage() {
  const { t } = useTranslation();
  const {
    matchPlanningEnabled,
    playingModes,
    formations,
    setMatchPlanningEnabled,
    addPlayingMode,
    updatePlayingMode,
    deletePlayingMode,
    setDefaultPlayingMode,
    addFormation,
    updateFormation,
    deleteFormation,
  } = useMatchPlanning();

  const [isTogglingEnabled, setIsTogglingEnabled] = useState(false);
  const [isPlayingModeModalOpen, setIsPlayingModeModalOpen] = useState(false);
  const [editingPlayingMode, setEditingPlayingMode] = useState<PlayingMode | null>(null);
  const [deletingPlayingMode, setDeletingPlayingMode] = useState<PlayingMode | null>(null);
  const [isFormationModalOpen, setIsFormationModalOpen] = useState(false);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  const [deletingFormation, setDeletingFormation] = useState<Formation | null>(null);

  const handleToggleEnabled = async () => {
    setIsTogglingEnabled(true);
    await setMatchPlanningEnabled(!matchPlanningEnabled);
    setIsTogglingEnabled(false);
  };

  const handleSavePlayingMode = async (data: { name: string; numberOfPeriods: number; periodLengthMinutes: number }) => {
    if (editingPlayingMode) {
      return updatePlayingMode(editingPlayingMode.id, data);
    }
    const created = await addPlayingMode(data);
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
                <CardTitle>{t('matchPlanning.playingModes.title')}</CardTitle>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingPlayingMode(null);
                    setIsPlayingModeModalOpen(true);
                  }}
                >
                  {t('common.actions.add')}
                </Button>
              </div>

              {playingModes.length === 0 ? (
                <div className="empty-state">{t('matchPlanning.playingModes.emptyState')}</div>
              ) : (
                <div className="space-y-2">
                  {playingModes.map((playingMode) => (
                    <div
                      key={playingMode.id}
                      className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{playingMode.name}</span>
                          {playingMode.isDefault && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              {t('matchPlanning.playingModes.defaultBadge')}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {t('matchPlanning.playingModes.summary', {
                            periods: playingMode.numberOfPeriods,
                            minutes: playingMode.periodLengthMinutes,
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!playingMode.isDefault && (
                          <button
                            type="button"
                            onClick={() => setDefaultPlayingMode(playingMode.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {t('matchPlanning.playingModes.setDefault')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlayingMode(playingMode);
                            setIsPlayingModeModalOpen(true);
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
                          onClick={() => setDeletingPlayingMode(playingMode)}
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

      {isPlayingModeModalOpen && (
        <PlayingModeModal
          isOpen={isPlayingModeModalOpen}
          onClose={() => setIsPlayingModeModalOpen(false)}
          playingModeToEdit={editingPlayingMode}
          onSave={handleSavePlayingMode}
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

      {deletingPlayingMode && (
        <ConfirmDialog
          isOpen={true}
          title={t('matchPlanning.playingModes.deleteTitle')}
          message={t('matchPlanning.playingModes.deleteMessage', { name: deletingPlayingMode.name })}
          confirmText={t('common.actions.delete')}
          onConfirm={async () => {
            await deletePlayingMode(deletingPlayingMode.id);
            setDeletingPlayingMode(null);
          }}
          onCancel={() => setDeletingPlayingMode(null)}
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
    </div>
  );
}
