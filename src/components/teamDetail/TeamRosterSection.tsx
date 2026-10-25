import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player, Team } from '../../types';
import { Alert, Button, EmptyState, ListFrame, Panel, PanelActions, PanelHeader, PanelTitle } from '../ui';
import Level from '../Level';
import { getBirthYear } from '../../utils/birthDate';

interface Props {
  team: Team;
  players: Player[];
  maxPlayers: number;
  canEditSelection: boolean;
  isCancelled: boolean;
  shirtSetColor: string | null;
  onEditPlayers: () => void;
  onRemovePlayer: (playerId: string) => void;
}

export default function TeamRosterSection({ team, players, maxPlayers, canEditSelection, isCancelled, shirtSetColor, onEditPlayers, onRemovePlayer }: Props) {
  const { t } = useTranslation();
  const [swipedPlayerId, setSwipedPlayerId] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  const handleTouchEnd = (playerId: string, endX: number) => {
    if (touchStartX.current === null) return;
    const distance = touchStartX.current - endX;
    if (distance > 50) setSwipedPlayerId(playerId);
    if (distance < -30 && swipedPlayerId === playerId) setSwipedPlayerId(null);
    touchStartX.current = null;
  };

  return <Panel>
    <PanelHeader>
      <PanelTitle>{t('domain.player.plural')} ({players.length}/{maxPlayers})</PanelTitle>
      <PanelActions><Button onClick={onEditPlayers} disabled={!canEditSelection} size="sm">{t('common.actions.edit')}</Button></PanelActions>
    </PanelHeader>
    {!canEditSelection && <Alert className="team-detail-player-alert">{t('page.teamPlayerSelection.eventPassedWarning')}</Alert>}
    {players.length === 0 ? <EmptyState>{t('page.teamDetail.noPlayersSelected')}</EmptyState> : <ListFrame>
      {players.map((player) => {
        const shirtAssignment = team.shirtAssignments?.find((assignment) => assignment.playerId === player.id);
        return <div key={player.id} className="team-player-row">
          <div
            className={`team-player-main${swipedPlayerId === player.id ? ' team-player-main--swiped' : ''}`}
            onTouchStart={(event) => { if (canEditSelection) touchStartX.current = event.touches[0]?.clientX ?? null; }}
            onTouchEnd={(event) => handleTouchEnd(player.id, event.changedTouches[0]?.clientX ?? touchStartX.current ?? 0)}
          >
            <div className="team-player-identity">
              {shirtAssignment && shirtSetColor && <span className="team-player-shirt" style={{ backgroundColor: shirtSetColor }}>{shirtAssignment.shirtNumber}</span>}
              <span className="team-player-name">{player.firstName} {player.lastName}</span>
              <span className="team-player-year">{getBirthYear(player.birthDate)}</span>
            </div>
            <Level level={player.level} />
          </div>
          <div className={`ui-swipe-action-tray${swipedPlayerId === player.id ? ' ui-swipe-action-tray--visible' : ''}`}>
            <button type="button" data-ui-control="composite" className="team-player-remove-button" onClick={() => { if (!isCancelled) onRemovePlayer(player.id); setSwipedPlayerId(null); }}>
              {t('page.teamDetail.removeAction')}
            </button>
          </div>
        </div>;
      })}
    </ListFrame>}
  </Panel>;
}
