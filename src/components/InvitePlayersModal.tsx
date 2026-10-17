import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player, InvitationResponse } from '../types';
import Level from './Level';
import LevelRangeSelector from './LevelRangeSelector';
import { selectInviteablePlayers } from '../store/selectors/eventInactivePlayerSelectors';
import { getBirthYear } from '../utils/birthDate';
import {
  Alert,
  Button,
  Checkbox,
  EmptyState,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalSubtitle,
  ModalTitle,
  Panel,
  Radio,
} from './ui';

interface InvitePlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (playerIds: string[], status: InvitationResponse) => void;
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
  const { t } = useTranslation();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 5]);
  const [invitationStatus, setInvitationResponse] = useState<InvitationResponse>('accepted');

  useEffect(() => {
    if (isOpen) {
      setSelectedPlayerIds(new Set());
      setLevelRange([1, 5]);
      setInvitationResponse('accepted');
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
    const availablePlayerIds = selectInviteablePlayers(players)
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

    onInvite(Array.from(selectedPlayerIds), invitationStatus);
    setSelectedPlayerIds(new Set());
    onClose();
  };

  const handleClose = () => {
    setSelectedPlayerIds(new Set());
    onClose();
  };

  const inviteablePlayers = selectInviteablePlayers(players);

  const availablePlayers = inviteablePlayers
    .filter(p => !alreadyInvitedPlayerIds.includes(p.id))
    .filter(p => p.level >= levelRange[0] && p.level <= levelRange[1]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{t('invitePlayers.title')}</ModalTitle>
          <ModalSubtitle>{t('invitePlayers.subtitle')}</ModalSubtitle>
          <Alert tone="warning" className="mt-3">{t('invitePlayers.inactiveExcludedHint')}</Alert>
        </ModalHeader>

        <ModalBody>
          <Panel padding="compact" className="mb-4">
            <LevelRangeSelector
              minLevel={1}
              maxLevel={5}
              defaultRange={levelRange}
              onChange={setLevelRange}
            />
          </Panel>
            {availablePlayers.length === 0 ? (
              <EmptyState>
                <p>{t('invitePlayers.noPlayers')}</p>
                <p className="text-sm mt-2">{t('invitePlayers.noPlayersDetail')}</p>
              </EmptyState>
            ) : (
              <>
                <Alert tone="info" className="mb-4">
                  <p className="text-sm font-medium text-content-strong mb-2">{t('invitePlayers.defaultStatus')}</p>
                  <div className="flex gap-4">
                    <label className="checkbox-label">
                      <Radio
                        name="invitationStatus"
                        value="accepted"
                        checked={invitationStatus === 'accepted'}
                        onChange={() => setInvitationResponse('accepted')}
                        className="w-4 h-4 text-success focus:ring-2 focus:ring-success"
                      />
                      {t('invitationStatus.accepted')}
                    </label>
                    <label className="checkbox-label">
                      <Radio
                        name="invitationStatus"
                        value="open"
                        checked={invitationStatus === 'open'}
                        onChange={() => setInvitationResponse('open')}
                        className="w-4 h-4 text-success focus:ring-2 focus:ring-success"
                      />
                      {t('invitationStatus.open')}
                    </label>
                  </div>
                </Alert>

                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {t('invitePlayers.selectAll')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    {t('invitePlayers.deselectAll')}
                  </Button>
                  <span className="ml-auto text-sm text-content-muted">
                    {t('invitePlayers.selectedCount', { count: selectedPlayerIds.size })}
                  </span>
                </div>

                <div className="space-y-2">
                  {availablePlayers.map((player) => (
                    <label
                      key={player.id}
                      className="flex items-center p-3 border border-edge rounded-lg hover:bg-surface-subtle cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedPlayerIds.has(player.id)}
                        onChange={() => handleTogglePlayer(player.id)}
                        className="w-4 h-4 text-success rounded focus:ring-2 focus:ring-success"
                      />
                      <div className="ml-3 flex-1">
                        <div className="layout-split">
                          <div className="layout-cluster">
                            <span className="font-medium text-content-strong">
                              {player.firstName} {player.lastName}
                            </span>
                            <span className="body-muted">{getBirthYear(player.birthDate)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-content-muted">
                            <Level level={player.level} />
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
        </ModalBody>

        <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              {t('common.actions.cancel')}
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={selectedPlayerIds.size === 0}
              className="flex-1"
            >
              {t('invitePlayers.inviteAction')} {selectedPlayerIds.size > 0 ? `(${selectedPlayerIds.size})` : ''}
            </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
