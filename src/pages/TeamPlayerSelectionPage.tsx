import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivities, usePlayers } from '../store';
import { selectAvailablePlayersForTeamSelection, selectTeamPlayersInRosterOrder, selectTeamSelectionCapacity } from '../store/selectors/teamPlayerSelectors';
import { selectSelectionEditState, selectTeamsWithSelectionChanges } from '../store/selectors/selectionSelectors';
import { ActionCard, ActionCardTitle, ActionDock, ActionDockContent, Alert, Badge, Button, Cluster, EmptyState, EntityActions, EntityContent, EntityList, EntityRow, EntityTitle, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, Panel, PanelHeader, PanelTitle, Select, Split, Stack } from '../components/ui';
import Level from '../components/Level';
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
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 5]);
  
  const availablePlayers = useMemo(() => event && team
    ? selectAvailablePlayersForTeamSelection(event, team.id, players, levelRange)
    : [], [event, team, players, levelRange]);
  const maxPlayersPerTeam = event?.maxPlayersPerTeam ?? players.length;
  const selectionCapacity = team
    ? selectTeamSelectionCapacity(team, maxPlayersPerTeam, selectedPlayerIds, removedPlayerIds)
    : null;
  
  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };
  
  const handleSelectAll = () => {
    const playersToSelect = availablePlayers
      .slice(0, selectionCapacity?.availableAdditionSlots ?? 0)
      .map((player) => player.id);
    setSelectedPlayerIds(playersToSelect);
  };
  
  const handleDeselectAll = () => {
    setSelectedPlayerIds([]);
  };
  
  const currentPlayers = team ? selectTeamPlayersInRosterOrder(team, players) : [];
  const editState = event ? selectSelectionEditState(event) : null;

  const handleSave = async () => {
    if (!event || !eventId || !team || !editState?.canEdit) return;
    
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

    if (await updateActivitySelection(eventId, updatedTeams)) {
      navigate(`/activities/${eventId}/teams/${teamId}`);
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
          <PageActions><p className="team-selection-context">
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
      
      <LevelRangeSelector
        minLevel={1}
        maxLevel={5}
        defaultRange={levelRange}
        onChange={setLevelRange}
      />

      {currentPlayers.length > 0 && (
        <Panel>
          <PanelHeader><PanelTitle>{t('page.teamPlayerSelection.currentPlayers')}</PanelTitle></PanelHeader>
          <EntityList variant="bare">
            {currentPlayers.map((player) => {
              const isRemoved = removedPlayerIds.includes(player.id);
              return (
                <EntityRow key={player.id} className={isRemoved ? 'team-selection-current-row--removed' : undefined}>
                  <EntityContent><EntityTitle>{player.firstName} {player.lastName}</EntityTitle></EntityContent>
                  <EntityActions>
                  <Button
                    type="button"
                    variant="dangerGhost"
                    size="sm"
                    disabled={!editState?.canEdit}
                    onClick={() => setRemovedPlayerIds((current) => isRemoved
                      ? current.filter((id) => id !== player.id)
                      : [...current, player.id])}
                  >
                    {isRemoved ? t('page.teamPlayerSelection.undoRemove') : t('page.teamPlayerSelection.removePlayer')}
                  </Button>
                  {isRemoved && editState?.requiresRemovalReason && (
                    <Select
                      controlSize="sm"
                      value={removalReasons[player.id] ?? ''}
                      onChange={(changeEvent) => setRemovalReasons((current) => ({
                        ...current,
                        [player.id]: changeEvent.target.value as SelectionRemovalReason | '',
                      }))}
                      aria-label={t('page.teamPlayerSelection.removalReasonFor', { name: `${player.firstName} ${player.lastName}` })}
                      required
                    >
                      <option value="">{t('page.teamPlayerSelection.selectRemovalReason')}</option>
                      {(['sick', 'injured', 'noShow', 'other'] as SelectionRemovalReason[]).map((reason) => (
                        <option key={reason} value={reason}>{t(`domain.attendance.reasons.${reason}`)}</option>
                      ))}
                    </Select>
                  )}
                  </EntityActions>
                </EntityRow>
              );
            })}
          </EntityList>
        </Panel>
      )}
      
      {/* Selection Controls */}
      {availablePlayers.length > 0 && (
        <Split gap="sm">
          <Cluster gap="sm">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSelectAll}
            disabled={!editState?.canEdit}
          >
            {t('common.actions.selectAll')}
          </Button>
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
            {t('page.teamPlayerSelection.selectedCount', { count: selectedPlayerIds.length })}
          </Badge>
        </Split>
      )}
      
      {/* Available Players List */}
      {availablePlayers.length === 0 ? (
        <Panel><EmptyState>
            {t('page.teamPlayerSelection.noPlayersInRange')}
        </EmptyState></Panel>
      ) : (
        <EntityList variant="separated">
          {availablePlayers.map(player => {
            const isSelected = selectedPlayerIds.includes(player.id);
            const isDisabled = !editState?.canEdit || (!isSelected && !canAddMore);
            
            return (
              <ActionCard
                key={player.id}
                onClick={() => !isDisabled && handleTogglePlayer(player.id)}
                disabled={isDisabled}
                selected={isSelected}
                showChevron={false}
                className="team-selection-option"
                leading={<span className={`team-selection-check${isSelected ? ' team-selection-check--selected' : ''}`} aria-hidden="true">
                  {isSelected && <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>}
                trailing={<Level level={player.level} />}
              >
                <ActionCardTitle>{player.firstName} {player.lastName}</ActionCardTitle>
              </ActionCard>
            );
          })}
        </EntityList>
      )}
      </Stack>
      
      {/* Fixed Bottom Bar */}
      <ActionDock>
        <ActionDockContent width="medium">
          <div className="team-selection-dock-summary">
            {t('page.teamPlayerSelection.selectedPlayersSummary', { count: selectedPlayerIds.length })}
            {!canAddMore && selectedPlayerIds.length > 0 && (
              <div className="team-selection-dock-error">
                {t('page.teamPlayerSelection.tooManySelected', { max: remainingSlots })}
              </div>
            )}
          </div>
          <Cluster gap="sm">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/activities/${eventId}/teams/${teamId}`)}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!editState?.canEdit || (selectedPlayerIds.length === 0 && removedPlayerIds.length === 0) || !canAddMore || hasMissingRemovalReasons}
            >
              {selectedPlayerIds.length > 0
                ? t('page.teamPlayerSelection.addPlayersAction', { count: selectedPlayerIds.length })
                : t('page.teamPlayerSelection.saveChanges')}
            </Button>
          </Cluster>
        </ActionDockContent>
      </ActionDock>
    </Page>
  );
}
