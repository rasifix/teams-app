import { useState, useEffect } from 'react';
import { useShirtSets } from '../hooks/useShirtSets';
import { getShirtSetById } from '../services/shirtService';
import type { Team, ShirtSet } from '../types';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './ui/Modal';
import Button from './ui/Button';
import { getPlayerById } from '../services/playerService';

interface AssignShirtsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shirtSetId: string, playerShirtAssignments: Array<{ playerId: string; shirtId: string }>) => void;
  team: Team;
  currentShirtSetId?: string;
  currentShirtAssignments?: Array<{ playerId: string; shirtId: string }>;
}

export default function AssignShirtsModal({
  isOpen,
  onClose,
  onSave,
  team,
  currentShirtSetId,
  currentShirtAssignments,
}: AssignShirtsModalProps) {
  const [selectedShirtSetId, setSelectedShirtSetId] = useState<string>(currentShirtSetId || '');
  const [selectedShirtSet, setSelectedShirtSet] = useState<ShirtSet | null>(null);
  const [playerShirtAssignments, setPlayerShirtAssignments] = useState<Array<{ playerId: string; shirtId: string }>>([]);

  const { shirtSets } = useShirtSets();

  useEffect(() => {
    setSelectedShirtSetId(currentShirtSetId || '');
  }, [currentShirtSetId, isOpen]);

  useEffect(() => {
    if (selectedShirtSetId) {
      const shirtSet = getShirtSetById(selectedShirtSetId);
      setSelectedShirtSet(shirtSet);
      
      // Initialize assignments - use existing assignments or empty for new players
      const initialAssignments = team.selectedPlayers.map(playerId => {
        const existingAssignment = currentShirtAssignments?.find(a => a.playerId === playerId);
        return {
          playerId,
          shirtId: existingAssignment?.shirtId || ''
        };
      });
      setPlayerShirtAssignments(initialAssignments);
    } else {
      setSelectedShirtSet(null);
      setPlayerShirtAssignments([]);
    }
  }, [selectedShirtSetId, team.selectedPlayers, currentShirtAssignments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedShirtSetId) {
      alert('Please select a shirt set');
      return;
    }

    onSave(selectedShirtSetId, playerShirtAssignments.filter(assignment => assignment.shirtId));
    onClose();
  };

  const handleShirtAssignment = (playerId: string, shirtId: string) => {
    setPlayerShirtAssignments(prev => 
      prev.map(assignment => 
        assignment.playerId === playerId 
          ? { ...assignment, shirtId }
          : assignment
      )
    );
  };

  const isShirtAssigned = (shirtId: string, currentPlayerId: string) => {
    return playerShirtAssignments.some(assignment => 
      assignment.shirtId === shirtId && assignment.playerId !== currentPlayerId
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <h2 className="text-xl font-semibold">Assign Shirts to Team</h2>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            <div>
              <label htmlFor="shirtSet" className="form-label">
                Shirt Set
              </label>
              <select
                id="shirtSet"
                value={selectedShirtSetId}
                onChange={(e) => setSelectedShirtSetId(e.target.value)}
                className="form-input text-sm"
              >
                <option value="">Select a shirt set...</option>
                {shirtSets.map(shirtSet => (
                  <option key={shirtSet.id} value={shirtSet.id}>
                    {shirtSet.sponsor} - {shirtSet.color}
                  </option>
                ))}
              </select>
            </div>

            {selectedShirtSet && (
              <div>
                <h3 className="text-lg font-medium mb-4">Assign Shirts to Players</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {team.selectedPlayers.map(playerId => {
                    const player = getPlayerById(playerId);
                    const currentAssignment = playerShirtAssignments.find(a => a.playerId === playerId);
                    
                    if (!player) return null;
                    
                    return (
                      <div key={playerId} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">{player.firstName} {player.lastName}</span>
                        </div>
                        <div className="w-32">
                          <select
                            value={currentAssignment?.shirtId || ''}
                            onChange={(e) => handleShirtAssignment(playerId, e.target.value)}
                            className="form-input w-full text-sm py-1"
                          >
                            <option value="">No shirt</option>
                            {selectedShirtSet.shirts.map(shirt => (
                              <option 
                                key={shirt.id} 
                                value={shirt.id}
                                disabled={isShirtAssigned(shirt.id, playerId)}
                              >
                                #{shirt.number} {shirt.size} {shirt.isGoalkeeper ? '(GK)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {team.selectedPlayers.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No players assigned to this team yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
          >
            Assign Shirts
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}