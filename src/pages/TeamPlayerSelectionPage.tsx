import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivities, usePlayers } from '../store';
import { selectAvailablePlayersForTeamSelection } from '../store/selectors/teamPlayerSelectors';
import { selectSelectionEditState, selectTeamsWithSelectionChanges } from '../store/selectors/selectionSelectors';
import { Button } from '../components/ui';
import Level from '../components/Level';
import LevelRangeSelector from '../components/LevelRangeSelector';
import { getBirthYear } from '../utils/birthDate';
import { formatInstantDateTime } from '../utils/dateFormatter';
import type { SelectionRemovalReason } from '../types';

export default function TeamPlayerSelectionPage() {
  const { t, i18n } = useTranslation();
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const navigate = useNavigate();
  
  const { getActivityById, updateActivitySelection } = useActivities();
  const { players } = usePlayers();
  
  const event = eventId ? getActivityById(eventId) : null;
  const team = event?.teams.find(t => t.id === teamId);
  
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [removedPlayerIds, setRemovedPlayerIds] = useState<string[]>([]);
  const [removalReasons, setRemovalReasons] = useState<Record<string, SelectionRemovalReason | ''>>({});
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 5]);
  
  const availablePlayers = useMemo(() => event && team
    ? selectAvailablePlayersForTeamSelection(event, team.id, players, levelRange)
    : [], [event, team, players, levelRange]);
  const maxPlayersPerTeam = event?.maxPlayersPerTeam ?? players.length;
  
  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };
  
  const handleSelectAll = () => {
    const currentPlayerCount = (team?.selectedPlayers?.length || 0) - removedPlayerIds.length;
    const remainingSlots = event ? maxPlayersPerTeam - currentPlayerCount : 0;
    const playersToSelect = availablePlayers.slice(0, remainingSlots).map(p => p.id);
    setSelectedPlayerIds(playersToSelect);
  };
  
  const handleDeselectAll = () => {
    setSelectedPlayerIds([]);
  };
  
  const currentPlayers = team?.selectedPlayers || [];
  const editState = event ? selectSelectionEditState(event) : null;

  const handleSave = async () => {
    if (!event || !eventId || !team || !editState?.canEdit) return;
    
    const updatedPlayers = [
      ...currentPlayers.filter((playerId) => !removedPlayerIds.includes(playerId)),
      ...selectedPlayerIds,
    ];
    
    const reasons = Object.fromEntries(
      Object.entries(removalReasons).filter((entry): entry is [string, SelectionRemovalReason] => Boolean(entry[1])),
    );
    const updatedTeams = selectTeamsWithSelectionChanges(
      event.teams, team.id, updatedPlayers, editState.requiresRemovalReason ? reasons : {}, new Date().toISOString(),
    );

    if (await updateActivitySelection(eventId, updatedTeams)) {
      navigate(`/events/${eventId}/teams/${teamId}`);
    }
  };
  
  if (!event || !team) {
    return (
      <div className="page-container">
        <div className="empty-state">{t('teamPlayerSelection.teamNotFound')}</div>
      </div>
    );
  }
  
  const currentPlayerCount = team.selectedPlayers?.length || 0;
  const remainingSlots = maxPlayersPerTeam - currentPlayerCount;
  const canAddMore = selectedPlayerIds.length <= remainingSlots + removedPlayerIds.length;
  const hasMissingRemovalReasons = Boolean(editState?.requiresRemovalReason
    && removedPlayerIds.some((playerId) => !removalReasons[playerId]));
  
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-32 sm:px-6 sm:py-10 sm:pb-32 lg:px-8">
      <header className="mb-6">
        <button 
          onClick={() => navigate(`/events/${eventId}/teams/${teamId}`)}
          className="mb-5 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          ← {t('common.actions.cancel')}
        </button>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.075em] text-orange-600">{event.name}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t('teamPlayerSelection.addPlayersToTeam', { team: team.name })}</h1>
          </div>
          <p className="text-sm font-medium text-slate-500 sm:text-right">
          {t('teamPlayerSelection.slotsSummary', {
            current: currentPlayerCount,
            max: maxPlayersPerTeam,
            remaining: remainingSlots,
          })}
          </p>
        </div>
      </header>

      {!editState?.canEdit && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {t('teamPlayerSelection.eventPassedWarning')}
        </div>
      )}

      {editState?.isSent && editState.canEdit && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          {t('teamPlayerSelection.sentWarning', {
            dateTime: event.selectionSentAt ? formatInstantDateTime(event.selectionSentAt, i18n.language) : '',
          })}
        </div>
      )}
      
      <LevelRangeSelector
        minLevel={1}
        maxLevel={5}
        defaultRange={levelRange}
        onChange={setLevelRange}
        className="mb-4"
      />

      {currentPlayers.length > 0 && (
        <section className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-5">
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-slate-950">{t('teamPlayerSelection.currentPlayers')}</h2>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
            {currentPlayers.map((playerId) => {
              const player = players.find((candidate) => candidate.id === playerId);
              if (!player) return null;
              const isRemoved = removedPlayerIds.includes(playerId);
              return (
                <div key={playerId} className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm ${isRemoved ? 'bg-red-50 text-slate-500' : 'bg-white'}`}>
                  <span className={`font-medium ${isRemoved ? 'line-through' : 'text-slate-900'}`}>{player.firstName} {player.lastName}</span>
                  <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600 transition hover:text-red-800"
                    disabled={!editState?.canEdit}
                    onClick={() => setRemovedPlayerIds((current) => isRemoved
                      ? current.filter((id) => id !== playerId)
                      : [...current, playerId])}
                  >
                    {isRemoved ? t('teamPlayerSelection.undoRemove') : t('teamPlayerSelection.removePlayer')}
                  </button>
                  {isRemoved && editState?.requiresRemovalReason && (
                    <select
                      value={removalReasons[playerId] ?? ''}
                      onChange={(changeEvent) => setRemovalReasons((current) => ({
                        ...current,
                        [playerId]: changeEvent.target.value as SelectionRemovalReason | '',
                      }))}
                      className="form-input !min-h-8 !w-auto !rounded-lg !py-1 !text-xs"
                      aria-label={t('teamPlayerSelection.removalReasonFor', { name: `${player.firstName} ${player.lastName}` })}
                      required
                    >
                      <option value="">{t('teamPlayerSelection.selectRemovalReason')}</option>
                      {(['sick', 'injured', 'noShow', 'other'] as SelectionRemovalReason[]).map((reason) => (
                        <option key={reason} value={reason}>{t(`attendance.reasons.${reason}`)}</option>
                      ))}
                    </select>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      
      {/* Selection Controls */}
      {availablePlayers.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={!editState?.canEdit}
            className="btn-secondary btn-sm"
          >
            {t('common.actions.selectAll')}
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            disabled={!editState?.canEdit}
            className="btn-secondary btn-sm"
          >
            {t('common.actions.deselectAll')}
          </button>
          <span className="ml-auto rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {t('teamPlayerSelection.selectedCount', { count: selectedPlayerIds.length })}
          </span>
        </div>
      )}
      
      {/* Available Players List */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)]">
        {availablePlayers.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            {t('teamPlayerSelection.noPlayersInRange')}
          </div>
        ) : (
          availablePlayers.map(player => {
            const isSelected = selectedPlayerIds.includes(player.id);
            const isDisabled = !editState?.canEdit || (!isSelected && !canAddMore);
            
            return (
              <button
                key={player.id}
                onClick={() => !isDisabled && handleTogglePlayer(player.id)}
                disabled={isDisabled}
                className={`flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3.5 text-left transition-all last:border-b-0 ${
                  isSelected
                    ? 'bg-orange-50'
                    : 'bg-white hover:bg-slate-50'
                } ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                    isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-900">
                      {player.firstName} {player.lastName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {getBirthYear(player.birthDate)}
                    </div>
                  </div>
                </div>
                <Level level={player.level} />
              </button>
            );
          })
        )}
      </section>
      
      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-16px_40px_-30px_rgba(15,23,42,.45)] backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-700">
            {t('teamPlayerSelection.selectedPlayersSummary', { count: selectedPlayerIds.length })}
            {!canAddMore && selectedPlayerIds.length > 0 && (
              <div className="mt-1 text-xs text-red-600">
                {t('teamPlayerSelection.tooManySelected', { max: remainingSlots })}
              </div>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={!editState?.canEdit || (selectedPlayerIds.length === 0 && removedPlayerIds.length === 0) || !canAddMore || hasMissingRemovalReasons}
          >
            {selectedPlayerIds.length > 0
              ? t('teamPlayerSelection.addPlayersAction', { count: selectedPlayerIds.length })
              : t('teamPlayerSelection.saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
}
