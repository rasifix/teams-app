import type { MouseEvent, TouchEvent } from 'react';
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
  const birthYear = player.birthDate
    ? new Date(player.birthDate).getFullYear()
    : player.birthYear;
  const playerStatus = player.status || 'active';
  const statusBadgeClassName = playerStatus === 'active'
    ? 'bg-green-50 text-green-700'
    : playerStatus === 'trial'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-gray-100 text-gray-700';
  const statusLabel = playerStatus.charAt(0).toUpperCase() + playerStatus.slice(1);

  return (
    <div className="member-card relative overflow-hidden bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div
        className={`flex items-center justify-between p-3 cursor-pointer transition-transform duration-200 ${
          isSwiped ? '-translate-x-20' : 'translate-x-0'
        } active:bg-gray-50`}
        onClick={onClick}
        onTouchStart={onTouchStart}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-medium text-gray-900 truncate">
                {player.firstName} {player.lastName}
                <span className="text-xs text-gray-500 ml-1">{birthYear}</span>
                { player.preferredShirtNumber ? (
                    <span className="text-xs text-gray-500 ml-1">#{player.preferredShirtNumber}</span>
                ) : null }
              </p>
              <p className="mt-1">
                <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClassName}`}>
                  {statusLabel}
                </span>
              </p>
            </div>
            <div className="ml-2 flex-shrink-0 flex items-center gap-2">
              <Level level={player.level} className="text-xs" />
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-600 transition-opacity duration-200 ${
          isSwiped ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          className="delete-button flex items-center justify-center w-full h-full text-white font-medium"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
