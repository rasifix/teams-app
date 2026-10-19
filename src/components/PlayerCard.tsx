import type { MouseEvent, TouchEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player } from '../types';
import Level from './Level';
import { getBirthYear } from '../utils/birthDate';
import { EntityContent, EntityTitle } from './ui';

interface PlayerCardProps {
  player: Player;
  isSwiped: boolean;
  onClick: (e: MouseEvent<HTMLDivElement>) => void;
  onTouchStart?: (e: TouchEvent<HTMLDivElement>) => void;
  onDelete?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function PlayerCard({
  player,
  isSwiped,
  onClick,
  onTouchStart,
  onDelete,
}: PlayerCardProps) {
  const { t } = useTranslation();
  const birthYear = getBirthYear(player.birthDate);
  const playerStatus = player.status || 'active';
  const isInactive = playerStatus === 'inactive';
  const isTrial = playerStatus === 'trial';
  const statusClassName = isInactive ? ' member-card--inactive' : isTrial ? ' member-card--trial' : '';

  return (
    <div className={`member-card${statusClassName}`}>
      <div
        className={`member-card-main${isSwiped ? ' member-card-main--swiped' : ''}`}
        onClick={onClick}
        onTouchStart={onTouchStart}
      >
        <span className="member-card-icon">
          <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0" />
          </svg>
        </span>
        <EntityContent>
          <EntityTitle>
            {player.firstName} {player.lastName}
          </EntityTitle>
          <div className="member-card-details">
            {birthYear && <span className="member-meta-text">{birthYear}</span>}
            <Level level={player.level} className="member-card-level" />
          </div>
        </EntityContent>
        <svg className="member-card-chevron" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>

      {onDelete && (
        <div
          className={`ui-swipe-action-tray${isSwiped ? ' ui-swipe-action-tray--visible' : ''}`}
        >
          <button
            type="button"
            data-ui-control="composite"
            className="delete-button member-delete-action"
            onClick={onDelete}
          >
            {t('common.actions.delete')}
          </button>
        </div>
      )}
    </div>
  );
}
