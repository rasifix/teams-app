import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player, Team } from '../../types';
import { Alert, Button, EmptyState, EntityList, Panel, PanelActions, PanelHeader, PanelTitle } from '../ui';
import PlayerRow from '../PlayerRow';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { updateActiveSwipeId } from '../../hooks/swipeGesture';

interface Props {
  team: Team;
  players: Player[];
  maxPlayers: number;
  canEditSelection: boolean;
  isCancelled: boolean;
  onEditPlayers: () => void;
  onRemovePlayer: (playerId: string) => void;
}

interface TeamRosterRowProps {
  player: Player;
  shirtNumber?: number;
  isSwiped: boolean;
  canSwipe: boolean;
  isCancelled: boolean;
  removeLabel: string;
  onSwipeChange: (isSwiped: boolean) => void;
  onRemove: () => void;
}

function TeamRosterPlayerRow({ player, shirtNumber, isSwiped, canSwipe, isCancelled, removeLabel, onSwipeChange, onRemove }: TeamRosterRowProps) {
  const swipeHandlers = useSwipeGesture({ isOpen: isSwiped, onOpenChange: onSwipeChange, disabled: !canSwipe });
  return <div className="team-player-row">
    <PlayerRow
      {...swipeHandlers}
      className={`team-player-main${isSwiped ? ' team-player-main--swiped' : ''}`}
      player={player}
      fallbackName=""
      shirtNumber={shirtNumber}
      density="compact"
      levelClassName="invitation-player-level"
    />
    <div className={`ui-swipe-action-tray${isSwiped ? ' ui-swipe-action-tray--visible' : ''}`}>
      <button type="button" data-ui-control="composite" className="team-player-remove-button" onClick={() => { if (!isCancelled) onRemove(); onSwipeChange(false); }}>
        {removeLabel}
      </button>
    </div>
  </div>;
}

export default function TeamRosterSection({ team, players, maxPlayers, canEditSelection, isCancelled, onEditPlayers, onRemovePlayer }: Props) {
  const { t } = useTranslation();
  const [swipedPlayerId, setSwipedPlayerId] = useState<string | null>(null);

  return <Panel>
    <PanelHeader>
      <PanelTitle>{t('domain.player.plural')} ({players.length}/{maxPlayers})</PanelTitle>
      <PanelActions><Button onClick={onEditPlayers} disabled={!canEditSelection} size="sm">{t('common.actions.edit')}</Button></PanelActions>
    </PanelHeader>
    {!canEditSelection && <Alert className="team-detail-player-alert">{t('page.teamPlayerSelection.eventPassedWarning')}</Alert>}
    {players.length === 0 ? <EmptyState>{t('page.teamDetail.noPlayersSelected')}</EmptyState> : <EntityList variant="bare" onClick={(event) => {
      const target = event.target as HTMLElement;
      if (swipedPlayerId && !target.closest('.team-player-row')) setSwipedPlayerId(null);
    }}>
      {players.map((player) => {
        const shirtAssignment = team.shirtAssignments?.find((assignment) => assignment.playerId === player.id);
        return <TeamRosterPlayerRow
          key={player.id} player={player} shirtNumber={shirtAssignment?.shirtNumber}
          isSwiped={swipedPlayerId === player.id} canSwipe={canEditSelection} isCancelled={isCancelled}
          removeLabel={t('page.teamDetail.removeAction')}
          onSwipeChange={(isSwiped) => setSwipedPlayerId((current) => updateActiveSwipeId(current, player.id, isSwiped))}
          onRemove={() => onRemovePlayer(player.id)}
        />;
      })}
    </EntityList>}
  </Panel>;
}
