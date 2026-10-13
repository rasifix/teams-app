import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivities, usePlayers } from '../store';
import { selectAvailablePlayersForTeamSelection } from '../store/selectors/teamPlayerSelectors';
import { Button } from '../components/ui';
import Level from '../components/Level';
import LevelRangeSelector from '../components/LevelRangeSelector';
import { getBirthYear } from '../utils/birthDate';

export default function TeamPlayerSelectionPage() {
  const { t } = useTranslation();
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const navigate = useNavigate();
  
  const { getActivityById, updateActivitySelection } = useActivities();
  const { players } = usePlayers();
  
  const event = eventId ? getActivityById(eventId) : null;
  const team = event?.teams.find(t => t.id === teamId);
  
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [removedPlayerIds, setRemovedPlayerIds] = useState<string[]>([]);
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

  const handleSave = async () => {
    if (!event || !eventId || !team) return;
    
    const updatedPlayers = [
      ...currentPlayers.filter((playerId) => !removedPlayerIds.includes(playerId)),
      ...selectedPlayerIds,
    ];
    
    const updatedTeams = event.teams.map(t =>
      t.id === teamId
        ? { ...t, selectedPlayers: updatedPlayers }
        : t
    );
    
    await updateActivitySelection(eventId, updatedTeams);
    navigate(`/events/${eventId}/teams/${teamId}`);
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
  
  return (
    <div className="page-container pb-24">
      <div className="page-header">
        <button 
          onClick={() => navigate(`/events/${eventId}/teams/${teamId}`)}
          className="text-blue-600 hover:text-blue-700 mb-2 text-sm font-medium"
        >
          ← {t('common.actions.cancel')}
        </button>
        
        <h1 className="page-title">{t('teamPlayerSelection.addPlayersToTeam', { team: team.name })}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('teamPlayerSelection.slotsSummary', {
            current: currentPlayerCount,
            max: maxPlayersPerTeam,
            remaining: remainingSlots,
          })}
        </p>
      </div>
      
      {/* Level Filter */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <LevelRangeSelector
          minLevel={1}
          maxLevel={5}
          defaultRange={levelRange}
          onChange={setLevelRange}
        />
      </div>

      {currentPlayers.length > 0 && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">{t('teamPlayerSelection.currentPlayers')}</h2>
          <div className="space-y-2">
            {currentPlayers.map((playerId) => {
              const player = players.find((candidate) => candidate.id === playerId);
              if (!player) return null;
              const isRemoved = removedPlayerIds.includes(playerId);
              return (
                <div key={playerId} className={`flex items-center justify-between rounded border p-2 text-sm ${isRemoved ? 'border-red-200 bg-red-50 text-gray-500' : 'border-gray-200'}`}>
                  <span className={isRemoved ? 'line-through' : ''}>{player.firstName} {player.lastName}</span>
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => setRemovedPlayerIds((current) => isRemoved
                      ? current.filter((id) => id !== playerId)
                      : [...current, playerId])}
                  >
                    {isRemoved ? t('teamPlayerSelection.undoRemove') : t('teamPlayerSelection.removePlayer')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Selection Controls */}
      {availablePlayers.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            {t('common.actions.selectAll')}
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            {t('common.actions.deselectAll')}
          </button>
          <span className="ml-auto text-sm text-gray-600">
            {t('teamPlayerSelection.selectedCount', { count: selectedPlayerIds.length })}
          </span>
        </div>
      )}
      
      {/* Available Players List */}
      <div className="space-y-2">
        {availablePlayers.length === 0 ? (
          <div className="empty-state">
            {t('teamPlayerSelection.noPlayersInRange')}
          </div>
        ) : (
          availablePlayers.map(player => {
            const isSelected = selectedPlayerIds.includes(player.id);
            const isDisabled = !isSelected && !canAddMore;
            
            return (
              <button
                key={player.id}
                onClick={() => !isDisabled && handleTogglePlayer(player.id)}
                disabled={isDisabled}
                className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">
                      {player.firstName} {player.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getBirthYear(player.birthDate)}
                    </div>
                  </div>
                </div>
                <Level level={player.level} />
              </button>
            );
          })
        )}
      </div>
      
      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
        <div className="max-w-screen-lg mx-auto flex items-center justify-between gap-4">
          <div className="text-sm">
            {t('teamPlayerSelection.selectedPlayersSummary', { count: selectedPlayerIds.length })}
            {!canAddMore && selectedPlayerIds.length > 0 && (
              <div className="text-red-600 text-xs mt-1">
                {t('teamPlayerSelection.tooManySelected', { max: remainingSlots })}
              </div>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={(selectedPlayerIds.length === 0 && removedPlayerIds.length === 0) || !canAddMore}
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
