import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEvents, usePlayers } from '../store';
import { Button } from '../components/ui';
import Level from '../components/Level';
import LevelRangeSelector from '../components/LevelRangeSelector';

export default function TeamPlayerSelectionPage() {
  const { t } = useTranslation();
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const navigate = useNavigate();
  
  const { getEventById, updateEvent } = useEvents();
  const { players } = usePlayers();
  
  const event = eventId ? getEventById(eventId) : null;
  const team = event?.teams.find(t => t.id === teamId);
  
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 5]);
  
  // Get available players (invited and accepted, not already in any team)
  const assignedPlayerIds = event?.teams.flatMap(t => t.selectedPlayers || []) || [];
  const invitedAcceptedPlayerIds = event?.invitations
    .filter(inv => inv.status === 'accepted')
    .map(inv => inv.playerId) || [];
  
  const availablePlayers = useMemo(() => {
    return players
      .filter(p => 
        invitedAcceptedPlayerIds.includes(p.id) &&
        !assignedPlayerIds.includes(p.id) &&
        p.level >= levelRange[0] &&
        p.level <= levelRange[1]
      )
      .sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [players, invitedAcceptedPlayerIds, assignedPlayerIds, levelRange]);
  
  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };
  
  const handleSelectAll = () => {
    const currentPlayerCount = team?.selectedPlayers?.length || 0;
    const remainingSlots = event ? event.maxPlayersPerTeam - currentPlayerCount : 0;
    const playersToSelect = availablePlayers.slice(0, remainingSlots).map(p => p.id);
    setSelectedPlayerIds(playersToSelect);
  };
  
  const handleDeselectAll = () => {
    setSelectedPlayerIds([]);
  };
  
  const handleSave = async () => {
    if (!event || !eventId || !team) return;
    
    const currentPlayers = team.selectedPlayers || [];
    const updatedPlayers = [...currentPlayers, ...selectedPlayerIds];
    
    const updatedTeams = event.teams.map(t =>
      t.id === teamId
        ? { ...t, selectedPlayers: updatedPlayers }
        : t
    );
    
    await updateEvent(eventId, { teams: updatedTeams });
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
  const remainingSlots = event.maxPlayersPerTeam - currentPlayerCount;
  const canAddMore = selectedPlayerIds.length <= remainingSlots;
  
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
            max: event.maxPlayersPerTeam,
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
                      {player.birthDate ? new Date(player.birthDate).getFullYear() : player.birthYear}
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
            disabled={selectedPlayerIds.length === 0 || !canAddMore}
          >
            {t('teamPlayerSelection.addPlayersAction', { count: selectedPlayerIds.length })}
          </Button>
        </div>
      </div>
    </div>
  );
}
