import type { MouseEvent, TouchEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player } from '../types';
import Level from './Level';

interface PlayerCardProps {
  player: Player;
  isSwiped: boolean;
  onClick: (e: MouseEvent<HTMLDivElement>) => void;
  onTouchStart: (e: TouchEvent<HTMLDivElement>) => void;
  onDelete: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function PlayerCard({
  player,
  isSwiped,
  onClick,
  onTouchStart,
  onDelete,
}: PlayerCardProps) {
  const { t } = useTranslation();
  const birthYear = new Date(player.birthDate!).getFullYear();
  const playerStatus = player.status || 'active';
  const isInactive = playerStatus === 'inactive';
  const isTrial = playerStatus === 'trial';
  const cardStatusClassName = isInactive
    ? 'bg-gray-50 border-gray-200'
    : isTrial
      ? 'bg-orange-50 border-orange-700'
      : 'bg-white border-gray-200';
  const nameClassName = isInactive
    ? 'text-gray-500'
    : isTrial
      ? 'text-orange-900'
      : 'text-gray-900';
  const detailTextClassName = isInactive
    ? 'text-gray-500'
    : isTrial
      ? 'text-orange-800'
      : 'text-gray-500';
  const arrowIconClassName = isInactive
    ? 'text-gray-400'
    : isTrial
      ? 'text-orange-700'
      : 'text-gray-400';

  return (
    <div className={`member-card relative overflow-hidden border rounded-lg hover:shadow-md transition-shadow ${cardStatusClassName}`}>
      <div
        className={`flex items-center justify-between p-3 cursor-pointer transition-transform duration-200 ${isSwiped ? '-translate-x-20' : 'translate-x-0'
          } active:bg-gray-50`}
        onClick={onClick}
        onTouchStart={onTouchStart}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className={`text-sm font-medium truncate ${nameClassName}`}>
                {player.firstName} {player.lastName}
                <span className={`text-xs ml-1 ${detailTextClassName}`}>{birthYear}</span>
              </p>
            </div>
            <div className="ml-2 flex-shrink-0 flex items-center gap-2">
              <Level level={player.level} className="text-xs" />
              <svg className={`w-5 h-5 ${arrowIconClassName}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-600 transition-opacity duration-200 ${isSwiped ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        <button
          className="delete-button flex items-center justify-center w-full h-full text-white font-medium"
          onClick={onDelete}
        >
          {t('common.actions.delete')}
        </button>
      </div>
    </div>
  );
}
