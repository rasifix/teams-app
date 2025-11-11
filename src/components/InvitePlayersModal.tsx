import { useState, useEffect } from 'react';
import type { Player } from '../types';
import Level from './Level';
import LevelRangeSelector from './LevelRangeSelector';

interface InvitePlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (playerIds: string[]) => void;
  alreadyInvitedPlayerIds: string[];
  players: Player[];
}

export default function InvitePlayersModal({ 
  isOpen, 
  onClose, 
  onInvite,
  alreadyInvitedPlayerIds,
  players
}: InvitePlayersModalProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 5]);

  useEffect(() => {
    if (isOpen) {
      setSelectedPlayerIds(new Set());
      setLevelRange([1, 5]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePlayer = (playerId: string) => {
    const newSelected = new Set(selectedPlayerIds);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayerIds(newSelected);
  };

  const handleSelectAll = () => {
    const availablePlayerIds = players
      .filter(p => !alreadyInvitedPlayerIds.includes(p.id))
      .filter(p => p.level >= levelRange[0] && p.level <= levelRange[1])
      .map(p => p.id);
    setSelectedPlayerIds(new Set(availablePlayerIds));
  };

  const handleDeselectAll = () => {
    setSelectedPlayerIds(new Set());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPlayerIds.size === 0) {
      return;
    }

    onInvite(Array.from(selectedPlayerIds));
    setSelectedPlayerIds(new Set());
    onClose();
  };

  const handleClose = () => {
    setSelectedPlayerIds(new Set());
    onClose();
  };

  const availablePlayers = players
    .filter(p => !alreadyInvitedPlayerIds.includes(p.id))
    .filter(p => p.level >= levelRange[0] && p.level <= levelRange[1]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Invite Players</h2>
          <p className="mt-1 text-sm text-gray-600">
            Select players to invite to this event
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <LevelRangeSelector
                    minLevel={1}
                    maxLevel={5}
                    defaultRange={levelRange}
                    onChange={setLevelRange}
                  />
                </div>
            {availablePlayers.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <p>No players available to invite.</p>
                <p className="text-sm mt-2">All players have already been invited or no players exist.</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Deselect All
                  </button>
                  <span className="ml-auto text-sm text-gray-600">
                    {selectedPlayerIds.size} selected
                  </span>
                </div>

                <div className="space-y-2">
                  {availablePlayers.map((player) => (
                    <label
                      key={player.id}
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlayerIds.has(player.id)}
                        onChange={() => handleTogglePlayer(player.id)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            {player.firstName} {player.lastName}
                          </span>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>Born: {player.birthYear}</span>
                            <Level level={player.level} />
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedPlayerIds.size === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Invite {selectedPlayerIds.size > 0 ? `(${selectedPlayerIds.size})` : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
