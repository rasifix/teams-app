import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player, InvitationResponse } from '../types';
import Level from './Level';
import LevelRangeSelector from './LevelRangeSelector';
import { selectAvailableInvitePlayers } from '../store/selectors/eventInactivePlayerSelectors';
import { getBirthYear } from '../utils/birthDate';
import {
  Alert,
  Button,
  Checkbox,
  ChoiceGroup,
  Cluster,
  EmptyState,
  EntityContent,
  EntityList,
  EntityMeta,
  EntityRow,
  EntityTitle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalSubtitle,
  ModalTitle,
  Panel,
  Radio,
  Split,
  Stack,
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
    const availablePlayerIds = selectAvailableInvitePlayers(players, alreadyInvitedPlayerIds, levelRange).map((player) => player.id);
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

  const availablePlayers = selectAvailableInvitePlayers(players, alreadyInvitedPlayerIds, levelRange);

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{t('invitePlayers.title')}</ModalTitle>
          <ModalSubtitle>{t('invitePlayers.subtitle')}</ModalSubtitle>
          <Alert tone="warning" className="invite-player-header-alert">{t('invitePlayers.inactiveExcludedHint')}</Alert>
        </ModalHeader>

        <ModalBody>
          <Stack>
          <Panel padding="compact">
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
                <p className="field-help">{t('invitePlayers.noPlayersDetail')}</p>
              </EmptyState>
            ) : (
              <>
                <Alert tone="info">
                  <Stack gap="sm">
                  <p className="invite-player-status-title">{t('invitePlayers.defaultStatus')}</p>
                  <ChoiceGroup>
                    <label className="checkbox-label">
                      <Radio
                        name="invitationStatus"
                        value="accepted"
                        checked={invitationStatus === 'accepted'}
                        onChange={() => setInvitationResponse('accepted')}
                      />
                      {t('invitationStatus.accepted')}
                    </label>
                    <label className="checkbox-label">
                      <Radio
                        name="invitationStatus"
                        value="open"
                        checked={invitationStatus === 'open'}
                        onChange={() => setInvitationResponse('open')}
                      />
                      {t('invitationStatus.open')}
                    </label>
                  </ChoiceGroup>
                  </Stack>
                </Alert>

                <Split gap="sm">
                  <Cluster gap="sm">
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
                  </Cluster>
                  <span className="body-muted">
                    {t('invitePlayers.selectedCount', { count: selectedPlayerIds.size })}
                  </span>
                </Split>

                <EntityList variant="separated">
                  {availablePlayers.map((player) => (
                    <label
                      key={player.id}
                      className="invite-player-option"
                    >
                      <Checkbox
                        checked={selectedPlayerIds.has(player.id)}
                        onChange={() => handleTogglePlayer(player.id)}
                      />
                      <EntityRow>
                        <EntityContent>
                          <EntityTitle>{player.firstName} {player.lastName}</EntityTitle>
                          <EntityMeta><span>{getBirthYear(player.birthDate)}</span></EntityMeta>
                        </EntityContent>
                        <Level level={player.level} />
                      </EntityRow>
                    </label>
                  ))}
                </EntityList>
              </>
            )}
          </Stack>
        </ModalBody>

        <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={selectedPlayerIds.size === 0}
            >
              {t('invitePlayers.inviteAction')} {selectedPlayerIds.size > 0 ? `(${selectedPlayerIds.size})` : ''}
            </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
