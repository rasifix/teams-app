import type { MouseEvent } from 'react';
import type { Player } from '../types';
import Level from './Level';
import { getBirthYear } from '../utils/birthDate';
import MemberCardShell from './MemberCardShell';

interface PlayerCardProps {
  player: Player;
  isSwiped: boolean;
  onSwipeChange: (isSwiped: boolean) => void;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
  onDelete?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export default function PlayerCard({ player, isSwiped, onSwipeChange, onClick, onDelete }: PlayerCardProps) {
  const status = player.status || 'active';
  const cardClassName = status === 'inactive' ? ' member-card--inactive' : status === 'trial' ? ' member-card--trial' : '';
  const birthYear = getBirthYear(player.birthDate);
  return <MemberCardShell
    name={`${player.firstName} ${player.lastName}`}
    details={<div className="member-card-details">{birthYear && <span className="member-meta-text">{birthYear}</span>}<Level level={player.level} className="member-card-level" /></div>}
    isSwiped={isSwiped}
    onSwipeChange={onSwipeChange}
    onClick={onClick}
    onDelete={onDelete}
    cardClassName={cardClassName}
  />;
}
