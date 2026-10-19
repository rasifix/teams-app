import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Team, ShirtSet, Player } from '../types';
import { Button, EmptyState, EntityContent, EntityList, EntityRow, EntityTitle, Field, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Select, Stack } from './ui';
import { selectShirtAssignmentRows, selectShirtAssignmentSetup } from '../store/selectors/shirtSetSelectors';

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
  const [availableShirts, setAvailableShirts] = useState<ShirtSet['shirts']>([]);
  const [playerShirtAssignments, setPlayerShirtAssignments] = useState<Array<{ playerId: string; shirtNumber: number }>>([]);
  const [usedShirtsInOtherTeams, setUsedShirtsInOtherTeams] = useState<Set<number>>(new Set());

  useEffect(() => {
    setSelectedShirtSetId(currentShirtSetId || '');
  }, [currentShirtSetId, isOpen]);

  useEffect(() => {
    const setup = selectShirtAssignmentSetup(
      team, players, shirtSets, selectedShirtSetId, currentShirtSetId,
      currentShirtAssignments, usedShirtNumbersBySetId,
    );
    setSelectedShirtSet(setup.shirtSet);
    setAvailableShirts(setup.availableShirts);
    setPlayerShirtAssignments(setup.assignments);
    setUsedShirtsInOtherTeams(setup.usedInOtherTeams);
  }, [selectedShirtSetId, currentShirtSetId, team, currentShirtAssignments, shirtSets, players, usedShirtNumbersBySetId]);

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

  const assignmentRows = selectShirtAssignmentRows(team, players, playerShirtAssignments);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{t('assignShirts.title')}</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <Stack gap="lg">
            <Field label={t('domain.shirtSets')} htmlFor="shirtSet">
              <Select
                id="shirtSet"
                value={selectedShirtSetId}
                onChange={(e) => setSelectedShirtSetId(e.target.value)}
              >
                <option value="">{t('assignShirts.selectSetPlaceholder')}</option>
                {shirtSets.map(shirtSet => (
                  <option key={shirtSet.id} value={shirtSet.id}>
                    {shirtSet.sponsor}
                  </option>
                ))}
              </Select>
            </Field>

            {selectedShirtSet && (
              <Stack gap="sm">
                <EntityList variant="separated" className="shirt-assignment-list">
                  {assignmentRows.map(({ player, shirtNumber }) => (
                      <EntityRow key={player.id} density="compact">
                        <EntityContent><EntityTitle>{player.firstName} {player.lastName}</EntityTitle></EntityContent>
                        <div className="shirt-assignment-control">
                          <Select
                            controlSize="sm"
                            value={shirtNumber}
                            onChange={(e) => handleShirtAssignment(player.id, parseInt(e.target.value) || 0)}
                            aria-label={`${player.firstName} ${player.lastName}`}
                          >
                            <option value={0}>{t('assignShirts.noShirt')}</option>
                            {availableShirts.map(shirt => (
                              <option 
                                key={shirt.number} 
                                value={shirt.number}
                                disabled={isShirtAssigned(shirt.number, player.id) || isShirtUsedInOtherTeams(shirt.number)}
                              >
                                #{shirt.number} {shirt.size} {shirt.isGoalkeeper ? `(${t('shirts.goalkeeperShort')})` : ''}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </EntityRow>
                  ))}
                </EntityList>

                {usedShirtsInOtherTeams.size > 0 && (
                  <p className="field-help">
                    {t('assignShirts.usedInOtherTeamsHint')}
                  </p>
                )}

                <p className="field-help">
                  {t('assignShirts.unavailableHint')}
                </p>

                {team.selectedPlayers.length === 0 && (
                  <EmptyState>{t('assignShirts.noPlayersInTeam')}</EmptyState>
                )}
              </Stack>
            )}
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            {t('assignShirts.assignAction')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
