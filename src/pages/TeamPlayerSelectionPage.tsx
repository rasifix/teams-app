import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import type { DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivities, usePlayers } from '../store';
import { selectAvailablePlayersForTeamSelection, selectTeamPlayersInRosterOrder, selectTeamSelectionCapacity, selectTeamSelectionColumns } from '../store/selectors/teamPlayerSelectors';
import { selectSelectionEditState, selectTeamsWithSelectionChanges } from '../store/selectors/selectionSelectors';
import { ActionDock, ActionDockContent, Alert, Badge, Button, Cluster, DragHandleIcon, EmptyState, EntityList, FilterBar, IconButton, MovePlayerIcon, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, Panel, PanelHeader, PanelTitle, Select, Split, Stack, TrashIcon } from '../components/ui';
import PlayerRow from '../components/PlayerRow';
import LevelRangeSelector from '../components/LevelRangeSelector';
import { formatInstantDateTime } from '../utils/dateFormatter';
import type { SelectionRemovalReason } from '../types';

export default function TeamPlayerSelectionPage() {
  const { t, i18n } = useTranslation();
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const navigate = useNavigate();
  
  const { getActivityById, updateActivitySelection } = useActivities();
  const { players } = usePlayers();
  
  const event = eventId ? getActivityById(eventId) : null;
  const team = event?.teams.find(t => t.id === teamId);
  
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [removedPlayerIds, setRemovedPlayerIds] = useState<string[]>([]);
  const [removalReasons, setRemovalReasons] = useState<Record<string, SelectionRemovalReason | ''>>({});
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<'selected' | 'unselected' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  
  const availablePlayers = useMemo(() => event && team
    ? selectAvailablePlayersForTeamSelection(event, team.id, players, selectedLevels)
    : [], [event, team, players, selectedLevels]);
  const maxPlayersPerTeam = event?.maxPlayersPerTeam ?? players.length;
  const selectionCapacity = team
    ? selectTeamSelectionCapacity(team, maxPlayersPerTeam, selectedPlayerIds, removedPlayerIds)
    : null;
  
  const currentPlayers = team ? selectTeamPlayersInRosterOrder(team, players) : [];
  const editState = event ? selectSelectionEditState(event) : null;
  const { selectedPlayers, unselectedPlayers } = selectTeamSelectionColumns(
    currentPlayers, availablePlayers, selectedPlayerIds, removedPlayerIds,
  );

  const moveToSelected = (playerId: string) => {
    if (!editState?.canEdit) return;
    if (removedPlayerIds.includes(playerId)) {
      setRemovedPlayerIds((current) => current.filter((id) => id !== playerId));
    } else if (!selectedPlayerIds.includes(playerId) && selectionCapacity?.canAddMore) {
      setSelectedPlayerIds((current) => [...current, playerId]);
    }
  };

  const moveToUnselected = (playerId: string) => {
    if (!editState?.canEdit) return;
    if (currentPlayers.some((player) => player.id === playerId)) {
      setRemovedPlayerIds((current) => current.includes(playerId) ? current : [...current, playerId]);
    } else {
      setSelectedPlayerIds((current) => current.filter((id) => id !== playerId));
    }
  };

  const handleDragStart = (event: DragEvent<HTMLElement>, playerId: string) => {
    setDraggedPlayerId(playerId);
    event.dataTransfer.setData('text/plain', playerId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const canDropOn = (target: 'selected' | 'unselected', playerId: string | null) => {
    if (!playerId || !editState?.canEdit) return false;
    if (target === 'selected') {
      return unselectedPlayers.some((player) => player.id === playerId)
        && (currentPlayers.some((player) => player.id === playerId) || Boolean(selectionCapacity?.canAddMore));
    }
    return selectedPlayers.some((player) => player.id === playerId);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>, target: 'selected' | 'unselected') => {
    setDropTarget(target);
    if (canDropOn(target, draggedPlayerId)) event.preventDefault();
  };

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, target: 'selected' | 'unselected', movePlayer: (playerId: string) => void) => {
    event.preventDefault();
    const playerId = event.dataTransfer.getData('text/plain');
    if (canDropOn(target, playerId)) movePlayer(playerId);
    setDraggedPlayerId(null);
    setDropTarget(null);
  };

  const handleDeselectAll = () => selectedPlayers.forEach((player) => moveToUnselected(player.id));

  const dragHandle = <DragHandleIcon />;

  const handleSave = async () => {
    if (!event || !eventId || !team || !editState?.canEdit || isSaving) return;

    setIsSaving(true);
    setSaveError(false);
    
    const updatedPlayers = [
      ...(team.selectedPlayers ?? []).filter((playerId) => !removedPlayerIds.includes(playerId)),
      ...selectedPlayerIds,
    ];
    
    const reasons = Object.fromEntries(
      Object.entries(removalReasons).filter((entry): entry is [string, SelectionRemovalReason] => Boolean(entry[1])),
    );
    const updatedTeams = selectTeamsWithSelectionChanges(
      event.teams, team.id, updatedPlayers, editState.requiresRemovalReason ? reasons : {}, new Date().toISOString(),
    );

    try {
      if (await updateActivitySelection(eventId, updatedTeams)) {
        navigate(`/activities/${eventId}/teams/${teamId}`);
      } else {
        setSaveError(true);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!event || !team) {
    return (
      <Page width="medium">
        <EmptyState>{t('page.teamPlayerSelection.teamNotFound')}</EmptyState>
      </Page>
    );
  }
  
  const { currentPlayerCount, remainingSlots, canAddMore } = selectionCapacity!;
  const hasMissingRemovalReasons = Boolean(editState?.requiresRemovalReason
    && removedPlayerIds.some((playerId) => !removalReasons[playerId]));
  
  return (
    <Page width="medium" actionDock>
      <PageHeader>
          <PageHeaderContent>
            <p className="eyebrow">{event.name}</p>
            <PageTitle>{t('page.teamPlayerSelection.addPlayersToTeam', { team: team.name })}</PageTitle>
          </PageHeaderContent>
          <PageActions><p className="body-muted">
          {t('page.teamPlayerSelection.slotsSummary', {
            current: currentPlayerCount,
            max: maxPlayersPerTeam,
            remaining: remainingSlots,
          })}
          </p></PageActions>
      </PageHeader>

      <Stack>
      {!editState?.canEdit && (
        <Alert>
          {t('page.teamPlayerSelection.eventPassedWarning')}
        </Alert>
      )}

      {editState?.isSent && editState.canEdit && (
        <Alert tone="warning">
          {t('page.teamPlayerSelection.sentWarning', {
            dateTime: event.selectionSentAt ? formatInstantDateTime(event.selectionSentAt, i18n.language) : '',
          })}
        </Alert>
      )}

      {saveError && <Alert>{t('page.teamPlayerSelection.saveFailed')}</Alert>}
      
      {/* Selection Controls */}
      {selectedPlayers.length > 0 && (
        <Split gap="sm">
          <Cluster gap="sm">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDeselectAll}
            disabled={!editState?.canEdit}
          >
            {t('common.actions.deselectAll')}
          </Button>
          </Cluster>
          <Badge>
            {t('page.teamPlayerSelection.selectedCount', { count: selectedPlayers.length })}
          </Badge>
        </Split>
      )}
      
      <div className="team-selection-columns">
        <Panel className={`team-selection-column team-selection-column--selected${dropTarget === 'selected' ? ` ui-drop-target--${canDropOn('selected', draggedPlayerId) ? 'active' : 'invalid'}` : ''}`} onDragOver={(event) => handleDragOver(event, 'selected')} onDragLeave={handleDragLeave} onDrop={(event) => handleDrop(event, 'selected', moveToSelected)}>
          <PanelHeader><PanelTitle>{t('page.teamPlayerSelection.selectedPlayers')}</PanelTitle><Badge>{selectedPlayers.length}</Badge></PanelHeader>
          {dropTarget === 'selected' && <p className="body-muted">{t(canDropOn('selected', draggedPlayerId) ? 'page.teamPlayerSelection.dropToSelected' : 'page.teamPlayerSelection.dropNotAllowed')}</p>}
          <EntityList variant="bare">
            {selectedPlayers.length === 0 ? <EmptyState>{t('page.teamPlayerSelection.noSelectedPlayers')}</EmptyState> : selectedPlayers.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                fallbackName=""
                density="compact"
                leading={dragHandle}
                draggable={editState?.canEdit}
                onDragStart={(event) => handleDragStart(event, player.id)}
                onDragEnd={() => { setDraggedPlayerId(null); setDropTarget(null); }}
                className="team-selection-player-row"
                actions={<>
                  <IconButton className="team-selection-desktop-remove" label={t('page.teamPlayerSelection.moveToUnselected', { name: `${player.firstName} ${player.lastName}` })} variant="danger" disabled={!editState?.canEdit} onClick={() => moveToUnselected(player.id)}><TrashIcon /></IconButton>
                  <IconButton className="team-selection-mobile-move" label={t('page.teamPlayerSelection.moveToUnselected', { name: `${player.firstName} ${player.lastName}` })} disabled={!editState?.canEdit} onClick={() => moveToUnselected(player.id)}><MovePlayerIcon direction="down" /></IconButton>
                </>}
              />
            ))}
          </EntityList>
        </Panel>
        <Panel className={`team-selection-column${dropTarget === 'unselected' ? ` ui-drop-target--${canDropOn('unselected', draggedPlayerId) ? 'active' : 'invalid'}` : ''}`} onDragOver={(event) => handleDragOver(event, 'unselected')} onDragLeave={handleDragLeave} onDrop={(event) => handleDrop(event, 'unselected', moveToUnselected)}>
          <PanelHeader><PanelTitle>{t('page.teamPlayerSelection.unselectedPlayers')}</PanelTitle><Badge>{unselectedPlayers.length}</Badge></PanelHeader>
          {dropTarget === 'unselected' && <p className="body-muted">{t(canDropOn('unselected', draggedPlayerId) ? 'page.teamPlayerSelection.dropToUnselected' : 'page.teamPlayerSelection.dropNotAllowed')}</p>}
          <FilterBar>
            <LevelRangeSelector
              selectedLevels={selectedLevels}
              onChange={setSelectedLevels}
            />
          </FilterBar>
          <EntityList variant="bare">
            {unselectedPlayers.length === 0 ? <EmptyState>{t('page.teamPlayerSelection.noPlayersInRange')}</EmptyState> : unselectedPlayers.map((player) => {
              const isDisabled = !editState?.canEdit || (!currentPlayers.some((currentPlayer) => currentPlayer.id === player.id) && !canAddMore);
              const isRemovedCurrentPlayer = currentPlayers.some((currentPlayer) => currentPlayer.id === player.id);
              return <PlayerRow key={player.id} player={player} fallbackName="" density="compact" leading={dragHandle} draggable={!isDisabled} onDragStart={(event) => handleDragStart(event, player.id)} onDragEnd={() => { setDraggedPlayerId(null); setDropTarget(null); }} onClick={() => moveToSelected(player.id)} aria-disabled={isDisabled} className={`team-selection-player-row${isDisabled ? ' team-selection-player-row--disabled' : ''}`} trailing={isRemovedCurrentPlayer && editState?.requiresRemovalReason ? <Select controlSize="sm" value={removalReasons[player.id] ?? ''} onClick={(event) => event.stopPropagation()} onChange={(event) => setRemovalReasons((current) => ({ ...current, [player.id]: event.target.value as SelectionRemovalReason | '' }))} aria-label={t('page.teamPlayerSelection.removalReasonFor', { name: `${player.firstName} ${player.lastName}` })} required><option value="">{t('page.teamPlayerSelection.selectRemovalReason')}</option>{(['sick', 'injured', 'noShow', 'other'] as SelectionRemovalReason[]).map((reason) => <option key={reason} value={reason}>{t(`domain.attendance.reasons.${reason}`)}</option>)}</Select> : undefined} actions={<IconButton className="team-selection-mobile-move" label={t('page.teamPlayerSelection.moveToSelected', { name: `${player.firstName} ${player.lastName}` })} disabled={isDisabled} onClick={() => moveToSelected(player.id)}><MovePlayerIcon direction="up" /></IconButton>} />;
            })}
          </EntityList>
        </Panel>
      </div>
      </Stack>
      
      {/* Fixed Bottom Bar */}
      <ActionDock>
        <ActionDockContent width="medium">
          <Cluster gap="sm" className="team-selection-dock-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/activities/${eventId}/teams/${teamId}`)}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              loading={isSaving}
              disabled={!editState?.canEdit || (selectedPlayerIds.length === 0 && removedPlayerIds.length === 0) || !canAddMore || hasMissingRemovalReasons}
            >
              {t('common.actions.save')}
            </Button>
          </Cluster>
        </ActionDockContent>
      </ActionDock>
    </Page>
  );
}
