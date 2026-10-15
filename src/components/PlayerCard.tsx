import type { MouseEvent, TouchEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player } from '../types';
import Level from './Level';
import { getBirthYear } from '../utils/birthDate';

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
  const cardStatusClassName = isInactive
    ? 'bg-slate-50 border-slate-200'
    : isTrial
      ? 'bg-orange-50/70 border-orange-200'
      : 'bg-white border-slate-200';
  const nameClassName = isInactive
    ? 'text-slate-500'
    : isTrial
      ? 'text-orange-900'
      : 'text-slate-900';
  const detailTextClassName = isInactive
    ? 'text-slate-400'
    : isTrial
      ? 'text-orange-800'
      : 'text-slate-500';
  const arrowIconClassName = isInactive
    ? 'text-slate-300'
    : isTrial
      ? 'text-orange-700'
      : 'text-slate-300';

  return (
    <div className={`member-card group relative overflow-hidden rounded-2xl border transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${cardStatusClassName}`}>
      <div
        className={`flex cursor-pointer items-center justify-between gap-3 p-3 transition-transform duration-200 ${isSwiped ? '-translate-x-20' : 'translate-x-0'
          } active:bg-slate-50`}
        onClick={onClick}
        onTouchStart={onTouchStart}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isTrial ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold ${nameClassName}`}>
            {player.firstName} {player.lastName}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            {birthYear && <span className={`text-xs ${detailTextClassName}`}>{birthYear}</span>}
            <Level level={player.level} className="text-[10px] tracking-[-0.08em]" />
          </div>
        </div>
        <svg className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:text-orange-500 ${arrowIconClassName}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>

      {onDelete && (
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
      )}
    </div>
  );
}
