import { getPlayerById } from '../services/playerService';
import { getTrainerById } from '../services/trainerService';
import { getShirtSetById } from '../services/shirtService';
import { getPlayerStats } from '../utils/playerStats';
import type { Team } from '../types';
import Level from './Level';
import Strength from './Strength';
import { useEvents } from '../hooks/useEvents';

interface TeamCardProps {
  team: Team;
  maxPlayersPerTeam: number;
  isDragOver: boolean;
  dragOverPlayerId: string | null;
  onEditTeam: (teamId: string, currentName: string, currentStrength: number, currentTrainerId?: string, currentShirtSetId?: string) => void;
  onRemovePlayer: (teamId: string, playerId: string) => void;
  onSwitchPlayers: (sourceTeamId: string, sourcePlayerId: string, targetTeamId: string, targetPlayerId: string) => void;
  onAddPlayerToTeam: (teamId: string, playerId: string, allowMove?: boolean) => void;
  onDragOverTeam: (teamId: string | null) => void;
  onDragOverPlayer: (playerId: string | null) => void;
}

export default function TeamCard({
  team,
  maxPlayersPerTeam,
  isDragOver,
  dragOverPlayerId,
  onEditTeam,
  onRemovePlayer,
  onSwitchPlayers,
  onAddPlayerToTeam,
  onDragOverTeam,
  onDragOverPlayer
}: TeamCardProps) {
  const selectedPlayers = team.selectedPlayers || [];
  const hasCapacity = selectedPlayers.length < maxPlayersPerTeam;
  const trainer = team.trainerId ? getTrainerById(team.trainerId) : null;
  const shirtSet = team.shirtSetId ? getShirtSetById(team.shirtSetId) : null;

  const { events } = useEvents();

  return (
    <div 
      className={`border rounded-lg p-4 transition-colors ${
        isDragOver && hasCapacity 
          ? 'border-green-500 bg-green-50' 
          : isDragOver 
            ? 'border-red-500 bg-red-50'
            : 'border-gray-200'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = hasCapacity ? 'move' : 'none';
        onDragOverTeam(team.id);
      }}
      onDragLeave={() => {
        onDragOverTeam(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDragOverTeam(null);
        
        if (!hasCapacity) return;
        
        // Check if it's a player from invitations list
        const playerId = e.dataTransfer.getData('playerId');
        if (playerId) {
          onAddPlayerToTeam(team.id, playerId);
          return;
        }
        
        // Check if it's a selected player from another team
        const selectedPlayerId = e.dataTransfer.getData('selectedPlayerId');
        const sourceTeamId = e.dataTransfer.getData('sourceTeamId');
        
        if (selectedPlayerId && sourceTeamId && sourceTeamId !== team.id) {
          // Move player from source team to target team
          onAddPlayerToTeam(team.id, selectedPlayerId, true);
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            {team.name} <Strength level={team.strength || 2} />
          </h3>
          <p className="text-sm text-gray-600">
            Selected: {selectedPlayers.length}/{maxPlayersPerTeam}
          </p>
          {trainer && (
            <p className="text-sm text-blue-600">
              👨‍🏫 {trainer.firstName} {trainer.lastName}
            </p>
          )}
          {shirtSet && (
            <p className="text-sm text-gray-600">
              👕 {shirtSet.sponsor}
            </p>
          )}
        </div>
        <button 
          onClick={() => onEditTeam(team.id, team.name, team.strength || 2, team.trainerId, team.shirtSetId)}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          Edit
        </button>
      </div>
      {selectedPlayers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-500 mb-2">Players:</h4>
          <div className="space-y-1">
            {selectedPlayers
              .map(playerId => ({ playerId, player: getPlayerById(playerId) }))
              .sort((a, b) => {
                if (!a.player || !b.player) return 0;
                const lastNameCompare = a.player.lastName.toLowerCase().localeCompare(b.player.lastName.toLowerCase());
                if (lastNameCompare !== 0) return lastNameCompare;
                return a.player.firstName.toLowerCase().localeCompare(b.player.firstName.toLowerCase());
              })
              .map(({ playerId, player }) => {
              const isDragOverPlayer = dragOverPlayerId === playerId;
              const stats = getPlayerStats(playerId, events);
              return player ? (
                <div 
                  key={playerId} 
                  className={`text-sm text-gray-700 flex justify-between items-center gap-2 p-1 rounded cursor-move transition-colors ${
                    isDragOverPlayer ? 'bg-blue-100 border border-blue-400' : 'hover:bg-gray-50'
                  }`}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('selectedPlayerId', playerId);
                    e.dataTransfer.setData('sourceTeamId', team.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    onDragOverPlayer(playerId);
                  }}
                  onDragLeave={(e) => {
                    e.stopPropagation();
                    onDragOverPlayer(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDragOverPlayer(null);
                    
                    const draggedPlayerId = e.dataTransfer.getData('selectedPlayerId');
                    const sourceTeamId = e.dataTransfer.getData('sourceTeamId');
                    
                    if (draggedPlayerId && sourceTeamId && draggedPlayerId !== playerId) {
                      onSwitchPlayers(sourceTeamId, draggedPlayerId, team.id, playerId);
                    }
                  }}
                >
                  <span className="flex-1">{player.firstName} {player.lastName}</span>
                  <Level level={player.level} className="text-sm" />
                  <span 
                    className="text-xs text-gray-500 font-mono"
                    title={`Accepted invitations: ${stats.acceptedCount}, Selected for teams: ${stats.selectedCount}`}
                  >
                    {stats.acceptedCount}/{stats.selectedCount}
                  </span>
                  <button
                    onClick={() => onRemovePlayer(team.id, playerId)}
                    className="text-red-600 hover:text-red-800 text-xs"
                    title="Remove player"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div key={playerId} className="text-sm text-gray-400 italic flex justify-between items-center gap-2">
                  <span className="flex-1">Unknown player</span>
                  <span 
                    className="text-xs text-gray-400 font-mono"
                    title={`Accepted invitations: 0, Selected for teams: 0`}
                  >
                    0/0
                  </span>
                  <button
                    onClick={() => onRemovePlayer(team.id, playerId)}
                    className="text-red-600 hover:text-red-800 text-xs"
                    title="Remove player"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}