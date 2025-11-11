import type { Player } from '../types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Level from './Level';

interface PlayersListProps {
  players: Player[];
  onDelete: (player: Player) => void;
}

export default function PlayersList({ players, onDelete }: PlayersListProps) {
  const navigate = useNavigate();
  const [swipedPlayerId, setSwipedPlayerId] = useState<string | null>(null);

  if (players.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>No players added yet. Click "Add Player" to get started.</p>
      </div>
    );
  }

  const handleTouchStart = (playerId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const moveTouch = moveEvent.touches[0];
      const diffX = startX - moveTouch.clientX;
      
      // If swiped left more than 50px, show delete button
      if (diffX > 50) {
        setSwipedPlayerId(playerId);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleRowClick = (player: Player, e: React.MouseEvent) => {
    // Don't trigger navigation if clicking on delete button area
    const target = e.target as HTMLElement;
    if (target.closest('.delete-button')) {
      return;
    }
    navigate(`/players/${player.id}`);
  };

  const handleDeleteClick = (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(player);
    setSwipedPlayerId(null);
  };

  // Close swipe state when clicking outside
  const handleBackdropClick = () => {
    if (swipedPlayerId) {
      setSwipedPlayerId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" onClick={handleBackdropClick}>
      {players.map((player) => (
        <div 
          key={player.id}
          className="relative overflow-hidden bg-white border border-gray-200 rounded-lg"
        >
          {/* Main row content */}
          <div 
            className={`flex items-center justify-between p-3 cursor-pointer transition-transform duration-200 ${
              swipedPlayerId === player.id ? '-translate-x-20' : 'translate-x-0'
            } active:bg-gray-50`}
            onClick={(e) => handleRowClick(player, e)}
            onTouchStart={(e) => handleTouchStart(player.id, e)}
          >
            {/* Player info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {player.firstName} {player.lastName} <span className="text-xs text-gray-500">{player.birthYear}</span>
                  </p>
                </div>
                {/* Level - stars */}
                <div className="ml-2 flex-shrink-0">
                  <Level level={player.level} className="text-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Delete button that appears on swipe */}
          <div 
            className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-600 transition-opacity duration-200 ${
              swipedPlayerId === player.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              className="delete-button flex items-center justify-center w-full h-full text-white font-medium"
              onClick={(e) => handleDeleteClick(player, e)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}