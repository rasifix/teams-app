import { useTranslation } from 'react-i18next';
import { getPlayerStats } from '../utils/playerStats';
import type { Activity, Team, Player, Trainer, ShirtSet } from '../types';
import { getActivityTime } from '../store/selectors/activitySelectors';
import Level from './Level';
import Strength from './Strength';
import { selectTeamResponsiblePeople } from '../store/selectors/teamTrainerSelectors';
import { Badge, Button, IconButton } from './ui';

interface TeamCardProps {
  team: Team;
  activity: Activity;
  inactiveFutureEventPlayerIds: Set<string>;
  players: Player[];
  trainers: Trainer[];
  shirtSets: ShirtSet[];
  activities: Activity[];
  maxPlayersPerTeam: number;
  isDragOver: boolean;
  dragOverPlayerId: string | null;
  onOpenTeam: (teamId: string) => void;
  onEditTeam: (teamId: string, currentName: string, currentStrength: number, currentStartTime: string | undefined, currentResponsiblePersonIds: string[], currentLocation?: string) => void;
  onDeleteTeam: (teamId: string) => void;
  onAssignShirts: (team: Team) => void;
  onRemovePlayer: (teamId: string, playerId: string) => void;
  onSwitchPlayers: (sourceTeamId: string, sourcePlayerId: string, targetTeamId: string, targetPlayerId: string) => void;
  onAddPlayerToTeam: (teamId: string, playerId: string, allowMove?: boolean) => void;
  onReplacePlayer: (teamId: string, oldPlayerId: string, newPlayerId: string) => void;
  onDragOverTeam: (teamId: string | null) => void;
  onDragOverPlayer: (playerId: string | null) => void;
}

export default function TeamCard({
  team,
  activity,
  inactiveFutureEventPlayerIds,
  players,
  trainers,
  shirtSets,
  activities,
  maxPlayersPerTeam,
  isDragOver,
  dragOverPlayerId,
  onOpenTeam,
  onEditTeam,
  onDeleteTeam,
  onAssignShirts,
  onRemovePlayer,
  onSwitchPlayers,
  onAddPlayerToTeam,
  onReplacePlayer,
  onDragOverTeam,
  onDragOverPlayer
}: TeamCardProps) {
  const { t } = useTranslation();
  const selectedPlayers = team.selectedPlayers || [];
  const hasCapacity = selectedPlayers.length < maxPlayersPerTeam;
  
  // Calculate average player level
  const averageLevel = selectedPlayers.length > 0 
    ? selectedPlayers.reduce((sum, playerId) => {
        const player = players.find(p => p.id === playerId);
        return sum + (player?.level || 0);
      }, 0) / selectedPlayers.length
    : 0;
  const responsiblePeople = selectTeamResponsiblePeople(team.responsiblePersonIds, trainers, players);
  const shirtSet = team.shirtSetId ? shirtSets.find(s => s.id === team.shirtSetId) : null;
  const displayLocation = activity.kind === 'match' ? activity.location : team.location || activity.location;
  const displayTime = activity.kind === 'match' ? getActivityTime(activity) : team.startTime || getActivityTime(activity);

  return (
    <div 
      className={`border rounded-lg p-4 transition-colors ${
        isDragOver && hasCapacity 
          ? 'border-success bg-success-subtle'
          : isDragOver 
            ? 'border-danger bg-danger-subtle'
            : 'border-edge'
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
      <div className="flex justify-between items-start">
        <div className="flex items-center flex-1 min-w-0">
          <div className="flex-1">
          <h3 className="font-semibold text-content-strong flex items-center gap-2">
            {team.name}
            <Strength level={team.strength || 2} className="text-xs" /> 
          </h3>
          <p className="body-muted">
            👥 {selectedPlayers.length}/{maxPlayersPerTeam} <span className="text-warning">★</span> {averageLevel.toFixed(1)}
          </p>
          {(displayTime || displayLocation) && (
            <p className="body-muted">
              {displayTime && <>🕐 {displayTime}</>}
              {displayLocation && <span className="ml-3">📍{displayLocation}</span>}
            </p>
          )}
          {responsiblePeople.length > 0 && (
            <p className="text-sm text-info-text">
              👤 {responsiblePeople.map((person) => person.firstName + ' ' + person.lastName + (person.isLead ? ' (' + t('teamModal.leadPerson') + ')' : '')).join(', ')}
            </p>
          )}
          {shirtSet && (
            <p className="body-muted">
              👕 {shirtSet.sponsor} {team.shirtAssignments && team.shirtAssignments.length > 0 && '(' + t('teamCard.assignedShirtsCount', { count: team.shirtAssignments.length }) + ')'}
            </p>
          )}
          </div>
        </div>
        <div className="flex gap-2 self-start mr-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditTeam(team.id, team.name, team.strength || 2, activity.kind === 'match' ? undefined : team.startTime, team.responsiblePersonIds || [], activity.kind === 'match' ? undefined : team.location)}
          >
            {t('common.actions.edit')}
          </Button>
          <Button
            variant="dangerGhost"
            size="sm"
            onClick={() => onDeleteTeam(team.id)}
          >
            {t('common.actions.delete')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAssignShirts(team)}
          >
            👕 {t('nav.shirts')}
          </Button>
          <IconButton
            label={t('events.openTeamDetails', { team: team.name })}
            onClick={() => onOpenTeam(team.id)}
            className="ml-1 self-center"
          >
            <svg className="icon-sm" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
            </svg>
          </IconButton>
        </div>
      </div>
      {selectedPlayers.length > 0 && (
        <>
        <div className="my-3 -mx-4 border-t border-edge" />
        <div className="lg:pl-8">
          <div className="space-y-1">
            {selectedPlayers
              .map(playerId => ({ playerId, player: players.find(p => p.id === playerId) }))
              .sort((a, b) => {
                if (!a.player || !b.player) return 0;
                const lastNameCompare = a.player.lastName.toLowerCase().localeCompare(b.player.lastName.toLowerCase());
                if (lastNameCompare !== 0) return lastNameCompare;
                return a.player.firstName.toLowerCase().localeCompare(b.player.firstName.toLowerCase());
              })
              .map(({ playerId, player }) => {
              const isDragOverPlayer = dragOverPlayerId === playerId;
              const stats = getPlayerStats(playerId, activities);
              const hasInactiveFutureError = inactiveFutureEventPlayerIds.has(playerId);
              return player ? (
                <div 
                  key={playerId} 
                  className={`text-sm text-content flex justify-between items-center gap-2 p-1 rounded cursor-move transition-colors ${
                    isDragOverPlayer ? 'bg-info-subtle border border-info-border' : 'hover:bg-surface-subtle'
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
                    
                    // Check if it's a player from invitations list being dropped on existing player
                    const invitationPlayerId = e.dataTransfer.getData('playerId');
                    if (invitationPlayerId && invitationPlayerId !== playerId) {
                      // Replace the existing player with the invitation player
                      onReplacePlayer(team.id, playerId, invitationPlayerId);
                      return;
                    }
                    
                    // Handle switching players between teams (existing functionality)
                    const draggedPlayerId = e.dataTransfer.getData('selectedPlayerId');
                    const sourceTeamId = e.dataTransfer.getData('sourceTeamId');
                    
                    if (draggedPlayerId && sourceTeamId && draggedPlayerId !== playerId) {
                      onSwitchPlayers(sourceTeamId, draggedPlayerId, team.id, playerId);
                    }
                  }}
                >
                  <span className="flex-1">
                    {(() => {
                      // Get shirt number if assigned
                      const shirtAssignment = team.shirtAssignments?.find(a => a.playerId === playerId);
                      const shirtNumber = shirtAssignment?.shirtNumber;
                      
                      return (
                        <div className="flex flex-col">
                          <div className="layout-cluster">
                            {shirtNumber && shirtNumber > 0 && <span className="text-content-strong text-xs mr-1 font-extrabold">{shirtNumber}</span>}
                            <span className="text-sm">{player.firstName} {player.lastName}</span>
                            {hasInactiveFutureError && (
                              <Badge tone="danger" size="sm" title={t('teamCard.inactiveIndicatorTooltip')}>
                                {t('teamCard.inactiveIndicator')}
                              </Badge>
                            )}
                            <Level level={player.level} className="text-sm" />
                            <span 
                              className="text-xs text-content-subtle font-mono"
                              title={t('teamCard.statsTooltip', { accepted: stats.acceptedCount, selected: stats.selectedCount })}
                            >
                              {stats.selectedCount}/{stats.acceptedCount}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </span>
                  
                  <IconButton
                    variant="danger"
                    label={t('teamCard.removePlayer')}
                    onClick={() => onRemovePlayer(team.id, playerId)}
                  >
                    <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </IconButton>
                </div>
              ) : (
                <div key={playerId} className="text-sm text-content-disabled italic flex justify-between items-center gap-2">
                  <span className="flex-1">{t('teamCard.unknownPlayer')}</span>
                  <span 
                    className="text-xs text-content-disabled font-mono"
                    title={t('teamCard.statsTooltip', { accepted: 0, selected: 0 })}
                  >
                    0/0
                  </span>
                  <IconButton
                    variant="danger"
                    label={t('teamCard.removePlayer')}
                    onClick={() => onRemovePlayer(team.id, playerId)}
                  >
                    <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </IconButton>
                </div>
              );
            })}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
