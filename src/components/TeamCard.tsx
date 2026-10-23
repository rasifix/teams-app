import { useTranslation } from 'react-i18next';
import type { Activity, Player, ShirtSet, Team, Trainer } from '../types';
import { selectTeamCardView } from '../store/selectors/teamCardSelectors';
import PlayerRow from './PlayerRow';
import Strength from './Strength';
import {
  Badge,
  Button,
  Card,
  ChevronRightIcon,
  Cluster,
  EntityContent,
  EntityList,
  IconButton,
  MetadataItem,
  Split,
} from './ui';

interface TeamCardProps {
  team: Team;
  activity: Activity;
  inactiveFutureEventPlayerIds: Set<string>;
  players: Player[];
  trainers: Trainer[];
  shirtSets: ShirtSet[];
  activities: Activity[];
  maxPlayersPerTeam: number;
  isDragOver?: boolean;
  dragOverPlayerId?: string | null;
  readOnly?: boolean;
  onOpenTeam: (teamId: string) => void;
  onEditTeam?: (teamId: string, currentName: string, currentStrength: number, currentStartTime: string | undefined, currentResponsiblePersonId: string | undefined, currentLocation?: string) => void;
  onDeleteTeam?: (teamId: string) => void;
  onAssignShirts?: (team: Team) => void;
  onRemovePlayer?: (teamId: string, playerId: string) => void;
  onSwitchPlayers?: (sourceTeamId: string, sourcePlayerId: string, targetTeamId: string, targetPlayerId: string) => void;
  onAddPlayerToTeam?: (teamId: string, playerId: string, allowMove?: boolean) => void;
  onReplacePlayer?: (teamId: string, oldPlayerId: string, newPlayerId: string) => void;
  onDragOverTeam?: (teamId: string | null) => void;
  onDragOverPlayer?: (playerId: string | null) => void;
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
  isDragOver = false,
  dragOverPlayerId = null,
  readOnly = false,
  onOpenTeam,
  onEditTeam,
  onDeleteTeam,
  onAssignShirts,
  onRemovePlayer,
  onSwitchPlayers,
  onAddPlayerToTeam,
  onReplacePlayer,
  onDragOverTeam,
  onDragOverPlayer,
}: TeamCardProps) {
  const { t } = useTranslation();
  const view = selectTeamCardView(
    team,
    activity,
    players,
    trainers,
    shirtSets,
    activities,
    inactiveFutureEventPlayerIds,
    maxPlayersPerTeam,
  );

  const dropStateClass = isDragOver && !readOnly
    ? view.hasCapacity ? ' team-card--drop-valid' : ' team-card--drop-invalid'
    : '';

  return (
    <Card
      className={`team-card${dropStateClass}`}
      onDragOver={!readOnly ? (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = view.hasCapacity ? 'move' : 'none';
        onDragOverTeam?.(team.id);
      } : undefined}
      onDragLeave={!readOnly ? () => onDragOverTeam?.(null) : undefined}
      onDrop={!readOnly ? (event) => {
        event.preventDefault();
        onDragOverTeam?.(null);
        if (!view.hasCapacity) return;

        const invitationPlayerId = event.dataTransfer.getData('playerId');
        if (invitationPlayerId) {
          onAddPlayerToTeam?.(team.id, invitationPlayerId);
          return;
        }

        const selectedPlayerId = event.dataTransfer.getData('selectedPlayerId');
        const sourceTeamId = event.dataTransfer.getData('sourceTeamId');
        if (selectedPlayerId && sourceTeamId && sourceTeamId !== team.id) {
          onAddPlayerToTeam?.(team.id, selectedPlayerId, true);
        }
      } : undefined}
    >
      <div className="team-card-header">
        <Split align="center">
          <EntityContent>
            <Cluster gap="sm">
              <h3 className="team-card-title">{team.name}</h3>
              <Strength level={team.strength || 2} className="team-card-strength" />
              <MetadataItem><span className="team-card-level-symbol">★</span> {view.averageLevel.toFixed(1)}</MetadataItem>
            </Cluster>
          </EntityContent>

          <Cluster gap="sm" align="center" onClick={(event) => event.stopPropagation()}>
            {!readOnly && <Button variant="ghost" size="sm" onClick={() => onEditTeam?.(
              team.id,
              team.name,
              team.strength || 2,
              activity.kind === 'match' ? undefined : team.startTime,
              team.responsiblePersonId,
              activity.kind === 'match' ? undefined : team.location,
            )}>
              {t('common.actions.edit')}
            </Button>}
            {!readOnly && <Button variant="dangerGhost" size="sm" onClick={() => onDeleteTeam?.(team.id)}>
              {t('common.actions.delete')}
            </Button>}
            {!readOnly && <Button variant="ghost" size="sm" onClick={() => onAssignShirts?.(team)}>
              👕 {t('nav.shirts')}
            </Button>}
            <IconButton label={t('page.events.openTeamDetails', { team: team.name })} onClick={() => onOpenTeam(team.id)}>
              <ChevronRightIcon className="icon-sm" />
            </IconButton>
          </Cluster>
        </Split>
      </div>

      {view.playerRows.length > 0 && (
        <EntityList variant="bare" className="team-card-roster">
          {view.playerRows.map((row) => {
            const isDragOverPlayer = dragOverPlayerId === row.playerId;
            return (
              <PlayerRow
                key={row.playerId}
                player={row.player}
                fallbackName={t('page.teamCard.unknownPlayer')}
                shirtNumber={row.shirtNumber}
                density="compact"
                className={`team-card-player${readOnly ? ' team-card-player--read-only' : ''}${isDragOverPlayer ? ' team-card-player--drag-over' : ''}${!row.player ? ' team-card-player--missing' : ''}`}
                draggable={!readOnly && Boolean(row.player)}
                onDragStart={!readOnly ? (event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('selectedPlayerId', row.playerId);
                  event.dataTransfer.setData('sourceTeamId', team.id);
                } : undefined}
                onDragOver={!readOnly ? (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  event.dataTransfer.dropEffect = 'move';
                  onDragOverPlayer?.(row.playerId);
                } : undefined}
                onDragLeave={!readOnly ? (event) => {
                  event.stopPropagation();
                  onDragOverPlayer?.(null);
                } : undefined}
                onDrop={!readOnly ? (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDragOverPlayer?.(null);

                  const invitationPlayerId = event.dataTransfer.getData('playerId');
                  if (invitationPlayerId && invitationPlayerId !== row.playerId) {
                    onReplacePlayer?.(team.id, row.playerId, invitationPlayerId);
                    return;
                  }

                  const draggedPlayerId = event.dataTransfer.getData('selectedPlayerId');
                  const sourceTeamId = event.dataTransfer.getData('sourceTeamId');
                  if (draggedPlayerId && sourceTeamId && draggedPlayerId !== row.playerId) {
                    onSwitchPlayers?.(sourceTeamId, draggedPlayerId, team.id, row.playerId);
                  }
                } : undefined}
                content={row.hasInactiveFutureEvent ? <Badge tone="danger" size="sm" title={t('page.teamCard.inactiveIndicatorTooltip')}>
                  {t('page.teamCard.inactiveIndicator')}
                </Badge> : undefined}
                levelClassName="invitation-player-level"
                actions={!readOnly ? <IconButton variant="danger" label={t('page.teamCard.removePlayer')} onClick={() => onRemovePlayer?.(team.id, row.playerId)}>
                    <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </IconButton> : undefined}
              />
            );
          })}
        </EntityList>
      )}
      <footer>
        <span>
          👤 {view.responsiblePeople.length > 0
            ? view.responsiblePeople.map((person) => `${person.firstName} ${person.lastName}`).join(', ')
            : t('page.teamCard.noResponsiblePerson')}
        </span>
        <span aria-label={t('page.teamCard.playersCount', { selected: view.selectedPlayerCount, max: maxPlayersPerTeam })}>
          {t('page.teamCard.playersCount', { selected: view.selectedPlayerCount, max: maxPlayersPerTeam })}
        </span>
      </footer>
    </Card>
  );
}
