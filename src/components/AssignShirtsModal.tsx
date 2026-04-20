import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Team, ShirtSet, Player } from '../types';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './ui/Modal';
import Button from './ui/Button';

interface AssignShirtsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shirtSetId: string, playerShirtAssignments: Array<{ playerId: string; shirtNumber: number }>) => void;
  team: Team;
  usedShirtNumbersBySetId: Record<string, number[]>;
  players: Player[];
  shirtSets: ShirtSet[];
  currentShirtSetId?: string;
  currentShirtAssignments?: Array<{ playerId: string; shirtNumber: number }>;
}

export default function AssignShirtsModal({
  isOpen,
  onClose,
  onSave,
  team,
  usedShirtNumbersBySetId,
  players,
  shirtSets,
  currentShirtSetId,
  currentShirtAssignments,
}: AssignShirtsModalProps) {
  const { t } = useTranslation();
  const [selectedShirtSetId, setSelectedShirtSetId] = useState<string>(currentShirtSetId || '');
  const [selectedShirtSet, setSelectedShirtSet] = useState<ShirtSet | null>(null);
  const [playerShirtAssignments, setPlayerShirtAssignments] = useState<Array<{ playerId: string; shirtNumber: number }>>([]);
  const [usedShirtsInOtherTeams, setUsedShirtsInOtherTeams] = useState<Set<number>>(new Set());

  useEffect(() => {
    setSelectedShirtSetId(currentShirtSetId || '');
  }, [currentShirtSetId, isOpen]);

  useEffect(() => {
    if (selectedShirtSetId) {
      const shirtSet = shirtSets.find(s => s.id === selectedShirtSetId) || null;
      setSelectedShirtSet(shirtSet);

      const usedInOtherTeams = new Set<number>(usedShirtNumbersBySetId[selectedShirtSetId] ?? []);
      setUsedShirtsInOtherTeams(usedInOtherTeams);

      if (!shirtSet) {
        setPlayerShirtAssignments([]);
        setUsedShirtsInOtherTeams(new Set());
        return;
      }

      const availableShirts = shirtSet.shirts.filter(shirt => shirt.status !== 'unavailable');
      const shirtNumbersInSet = new Set(availableShirts.map(shirt => shirt.number));
      const playersById = new Map(players.map(player => [player.id, player]));
      const keepExistingAssignments = selectedShirtSetId === currentShirtSetId;
      const usedShirtNumbers = new Set<number>();

      // Preserve valid current assignments only when re-opening the same shirt set.
      const initialAssignments = team.selectedPlayers.map(playerId => {
        const existingAssignment = keepExistingAssignments
          ? currentShirtAssignments?.find(a => a.playerId === playerId)
          : undefined;

        if (
          existingAssignment &&
          shirtNumbersInSet.has(existingAssignment.shirtNumber) &&
          !usedShirtNumbers.has(existingAssignment.shirtNumber) &&
          !usedInOtherTeams.has(existingAssignment.shirtNumber)
        ) {
          usedShirtNumbers.add(existingAssignment.shirtNumber);
          return {
            playerId,
            shirtNumber: existingAssignment.shirtNumber
          };
        }

        const preferredShirtNumber = playersById.get(playerId)?.preferredShirtNumber;
        if (
          preferredShirtNumber &&
          shirtNumbersInSet.has(preferredShirtNumber) &&
          !usedShirtNumbers.has(preferredShirtNumber) &&
          !usedInOtherTeams.has(preferredShirtNumber)
        ) {
          usedShirtNumbers.add(preferredShirtNumber);
          return {
            playerId,
            shirtNumber: preferredShirtNumber
          };
        }

        return {
          playerId,
          shirtNumber: 0
        };
      });

      setPlayerShirtAssignments(initialAssignments);
    } else {
      setSelectedShirtSet(null);
      setPlayerShirtAssignments([]);
      setUsedShirtsInOtherTeams(new Set());
    }
  }, [selectedShirtSetId, currentShirtSetId, team.selectedPlayers, currentShirtAssignments, shirtSets, players, usedShirtNumbersBySetId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedShirtSetId) {
      alert(t('assignShirts.errors.selectSetRequired'));
      return;
    }

    onSave(selectedShirtSetId, playerShirtAssignments.filter(assignment => assignment.shirtNumber > 0));
    onClose();
  };

  const handleShirtAssignment = (playerId: string, shirtNumber: number) => {
    setPlayerShirtAssignments(prev => 
      prev.map(assignment => 
        assignment.playerId === playerId 
          ? { ...assignment, shirtNumber }
          : assignment
      )
    );
  };

  const isShirtAssigned = (shirtNumber: number, currentPlayerId: string) => {
    return playerShirtAssignments.some(assignment => 
      assignment.shirtNumber === shirtNumber && assignment.playerId !== currentPlayerId && assignment.shirtNumber > 0
    );
  };

  const isShirtUsedInOtherTeams = (shirtNumber: number) => {
    return usedShirtsInOtherTeams.has(shirtNumber);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <h2 className="text-xl font-semibold">{t('assignShirts.title')}</h2>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            <div>
              <label htmlFor="shirtSet" className="form-label">
                {t('domain.shirtSets')}
              </label>
              <select
                id="shirtSet"
                value={selectedShirtSetId}
                onChange={(e) => setSelectedShirtSetId(e.target.value)}
                className="form-input text-sm"
              >
                <option value="">{t('assignShirts.selectSetPlaceholder')}</option>
                {shirtSets.map(shirtSet => (
                  <option key={shirtSet.id} value={shirtSet.id}>
                    {shirtSet.sponsor}
                  </option>
                ))}
              </select>
            </div>

            {selectedShirtSet && (
              <div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {team.selectedPlayers.map(playerId => {
                    const player = players.find(p => p.id === playerId);
                    const currentAssignment = playerShirtAssignments.find(a => a.playerId === playerId);
                    
                    if (!player) return null;
                    
                    return (
                      <div key={playerId} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">{player.firstName} {player.lastName}</span>
                        </div>
                        <div className="w-32">
                          <select
                            value={currentAssignment?.shirtNumber || 0}
                            onChange={(e) => handleShirtAssignment(playerId, parseInt(e.target.value) || 0)}
                            className="form-input w-full text-sm py-1"
                          >
                            <option value={0}>{t('assignShirts.noShirt')}</option>
                            {selectedShirtSet.shirts
                              .filter(shirt => shirt.status !== 'unavailable')
                              .sort((a, b) => a.number - b.number)
                              .map(shirt => (
                              <option 
                                key={shirt.number} 
                                value={shirt.number}
                                disabled={isShirtAssigned(shirt.number, playerId) || isShirtUsedInOtherTeams(shirt.number)}
                              >
                                #{shirt.number} {shirt.size} {shirt.isGoalkeeper ? `(${t('shirts.goalkeeperShort')})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {usedShirtsInOtherTeams.size > 0 && (
                  <p className="text-xs text-gray-600 mt-2">
                    {t('assignShirts.usedInOtherTeamsHint')}
                  </p>
                )}

                <p className="text-xs text-gray-600 mt-1">
                  {t('assignShirts.unavailableHint')}
                </p>

                {team.selectedPlayers.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    {t('assignShirts.noPlayersInTeam')}
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
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
          >
            {t('assignShirts.assignAction')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}