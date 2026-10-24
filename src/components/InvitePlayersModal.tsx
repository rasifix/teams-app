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
  onInvite: (playerIds: string[], status: BulkInvitationStatus) => void;
  alreadyInvitedPlayerIds: string[];
  players: Player[];
}

type BulkInvitationStatus = Extract<InvitationResponse, 'open' | 'accepted'>;

export default function InvitePlayersModal({ 
  isOpen, 
  onClose, 
  onInvite,
  alreadyInvitedPlayerIds,
  players
}: InvitePlayersModalProps) {
  const { t } = useTranslation();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [invitationStatus, setInvitationResponse] = useState<BulkInvitationStatus>('accepted');

  useEffect(() => {
    if (isOpen) {
      setSelectedPlayerIds(new Set());
      setSelectedLevels([]);
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
    const availablePlayerIds = selectAvailableInvitePlayers(players, alreadyInvitedPlayerIds, selectedLevels).map((player) => player.id);
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

  const availablePlayers = selectAvailableInvitePlayers(players, alreadyInvitedPlayerIds, selectedLevels);

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{t('page.invitePlayers.title')}</ModalTitle>
          <ModalSubtitle>{t('page.invitePlayers.subtitle')}</ModalSubtitle>
          <Alert tone="warning" className="invite-player-header-alert">{t('page.invitePlayers.inactiveExcludedHint')}</Alert>
        </ModalHeader>

        <ModalBody>
          <Stack>
          <Panel padding="compact">
            <LevelRangeSelector
              selectedLevels={selectedLevels}
              onChange={setSelectedLevels}
            />
          </Panel>
            {availablePlayers.length === 0 ? (
              <EmptyState>
                <p>{t('page.invitePlayers.noPlayers')}</p>
                <p className="field-help">{t('page.invitePlayers.noPlayersDetail')}</p>
              </EmptyState>
            ) : (
              <>
                <Alert tone="info">
                  <Stack gap="sm">
                  <p className="invite-player-status-title">{t('page.invitePlayers.defaultStatus')}</p>
                  <ChoiceGroup>
                    <label className="checkbox-label">
                      <Radio
                        name="invitationStatus"
                        value="accepted"
                        checked={invitationStatus === 'accepted'}
                        onChange={() => setInvitationResponse('accepted')}
                      />
                      {t('domain.invitation.status.accepted')}
                    </label>
                    <label className="checkbox-label">
                      <Radio
                        name="invitationStatus"
                        value="open"
                        checked={invitationStatus === 'open'}
                        onChange={() => setInvitationResponse('open')}
                      />
                      {t('domain.invitation.status.open')}
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
                    {t('page.invitePlayers.selectAll')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    {t('page.invitePlayers.deselectAll')}
                  </Button>
                  </Cluster>
                  <span className="body-muted">
                    {t('page.invitePlayers.selectedCount', { count: selectedPlayerIds.size })}
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
              {t('page.invitePlayers.inviteAction')} {selectedPlayerIds.size > 0 ? `(${selectedPlayerIds.size})` : ''}
            </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
