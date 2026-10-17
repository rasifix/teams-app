import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivities, usePlayers } from '../store';
import { selectAvailablePlayersForTeamSelection } from '../store/selectors/teamPlayerSelectors';
import { selectSelectionEditState, selectTeamsWithSelectionChanges } from '../store/selectors/selectionSelectors';
import { Alert, Badge, Button, EmptyState, ListFrame, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, Panel, PanelHeader, PanelTitle, Select } from '../components/ui';
import Level from '../components/Level';
import LevelRangeSelector from '../components/LevelRangeSelector';
import { getBirthYear } from '../utils/birthDate';
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
  
  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };
  
  const handleSelectAll = () => {
    const currentPlayerCount = (team?.selectedPlayers?.length || 0) - removedPlayerIds.length;
    const remainingSlots = event ? maxPlayersPerTeam - currentPlayerCount : 0;
    const playersToSelect = availablePlayers.slice(0, remainingSlots).map(p => p.id);
    setSelectedPlayerIds(playersToSelect);
  };
  
  const handleDeselectAll = () => {
    setSelectedPlayerIds([]);
  };
  
  const currentPlayers = team?.selectedPlayers || [];
  const editState = event ? selectSelectionEditState(event) : null;

  const handleSave = async () => {
    if (!event || !eventId || !team || !editState?.canEdit) return;
    
    const updatedPlayers = [
      ...currentPlayers.filter((playerId) => !removedPlayerIds.includes(playerId)),
      ...selectedPlayerIds,
    ];
    
    const reasons = Object.fromEntries(
      Object.entries(removalReasons).filter((entry): entry is [string, SelectionRemovalReason] => Boolean(entry[1])),
    );
    const updatedTeams = selectTeamsWithSelectionChanges(
      event.teams, team.id, updatedPlayers, editState.requiresRemovalReason ? reasons : {}, new Date().toISOString(),
    );

    if (await updateActivitySelection(eventId, updatedTeams)) {
      navigate(`/events/${eventId}/teams/${teamId}`);
    }
  };
  
  if (!event || !team) {
    return (
      <Page width="medium">
        <EmptyState>{t('teamPlayerSelection.teamNotFound')}</EmptyState>
      </Page>
    );
  }
  
  const currentPlayerCount = team.selectedPlayers?.length || 0;
  const remainingSlots = maxPlayersPerTeam - currentPlayerCount;
  const canAddMore = selectedPlayerIds.length <= remainingSlots + removedPlayerIds.length;
  const hasMissingRemovalReasons = Boolean(editState?.requiresRemovalReason
    && removedPlayerIds.some((playerId) => !removalReasons[playerId]));
  
  return (
    <Page width="medium" className="pb-32 sm:pb-32">
      <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/events/${eventId}/teams/${teamId}`)}
          className="mb-5"
        >
          ← {t('common.actions.cancel')}
      </Button>
      <PageHeader>
          <PageHeaderContent>
            <p className="eyebrow">{event.name}</p>
            <PageTitle>{t('teamPlayerSelection.addPlayersToTeam', { team: team.name })}</PageTitle>
          </PageHeaderContent>
          <PageActions><p className="text-sm font-medium text-content-subtle sm:text-right">
          {t('teamPlayerSelection.slotsSummary', {
            current: currentPlayerCount,
            max: maxPlayersPerTeam,
            remaining: remainingSlots,
          })}
          </p></PageActions>
      </PageHeader>

      {!editState?.canEdit && (
        <Alert className="mb-4">
          {t('teamPlayerSelection.eventPassedWarning')}
        </Alert>
      )}

      {editState?.isSent && editState.canEdit && (
        <Alert tone="warning" className="mb-4">
          {t('teamPlayerSelection.sentWarning', {
            dateTime: event.selectionSentAt ? formatInstantDateTime(event.selectionSentAt, i18n.language) : '',
          })}
        </Alert>
      )}
      
      <LevelRangeSelector
        minLevel={1}
        maxLevel={5}
        defaultRange={levelRange}
        onChange={setLevelRange}
        className="mb-4"
      />

      {currentPlayers.length > 0 && (
        <Panel className="mb-4">
          <PanelHeader><PanelTitle>{t('teamPlayerSelection.currentPlayers')}</PanelTitle></PanelHeader>
          <ListFrame>
            {currentPlayers.map((playerId) => {
              const player = players.find((candidate) => candidate.id === playerId);
              if (!player) return null;
              const isRemoved = removedPlayerIds.includes(playerId);
              return (
                <div key={playerId} className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm ${isRemoved ? 'bg-danger-subtle text-content-subtle' : 'bg-surface'}`}>
                  <span className={`font-medium ${isRemoved ? 'line-through' : 'text-content-strong'}`}>{player.firstName} {player.lastName}</span>
                  <div className="layout-cluster layout-cluster--wrap">
                  <Button
                    type="button"
                    variant="dangerGhost"
                    size="sm"
                    disabled={!editState?.canEdit}
                    onClick={() => setRemovedPlayerIds((current) => isRemoved
                      ? current.filter((id) => id !== playerId)
                      : [...current, playerId])}
                  >
                    {isRemoved ? t('teamPlayerSelection.undoRemove') : t('teamPlayerSelection.removePlayer')}
                  </Button>
                  {isRemoved && editState?.requiresRemovalReason && (
                    <Select
                      value={removalReasons[playerId] ?? ''}
                      onChange={(changeEvent) => setRemovalReasons((current) => ({
                        ...current,
                        [playerId]: changeEvent.target.value as SelectionRemovalReason | '',
                      }))}
                      className="!min-h-8 !w-auto !rounded-lg !py-1 !text-xs"
                      aria-label={t('teamPlayerSelection.removalReasonFor', { name: `${player.firstName} ${player.lastName}` })}
                      required
                    >
                      <option value="">{t('teamPlayerSelection.selectRemovalReason')}</option>
                      {(['sick', 'injured', 'noShow', 'other'] as SelectionRemovalReason[]).map((reason) => (
                        <option key={reason} value={reason}>{t(`attendance.reasons.${reason}`)}</option>
                      ))}
                    </Select>
                  )}
                  </div>
                </div>
              );
            })}
          </ListFrame>
        </Panel>
      )}
      
      {/* Selection Controls */}
      {availablePlayers.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
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
          <Badge className="ml-auto">
            {t('teamPlayerSelection.selectedCount', { count: selectedPlayerIds.length })}
          </Badge>
        </div>
      )}
      
      {/* Available Players List */}
      <Panel padding="none">
        {availablePlayers.length === 0 ? (
          <EmptyState className="m-4">
            {t('teamPlayerSelection.noPlayersInRange')}
          </EmptyState>
        ) : (
          availablePlayers.map(player => {
            const isSelected = selectedPlayerIds.includes(player.id);
            const isDisabled = !editState?.canEdit || (!isSelected && !canAddMore);
            
            return (
              <button
                type="button"
                key={player.id}
                data-ui-control="composite"
                onClick={() => !isDisabled && handleTogglePlayer(player.id)}
                disabled={isDisabled}
                className={`flex w-full items-center justify-between gap-4 border-b border-edge px-4 py-3.5 text-left transition-all last:border-b-0 ${
                  isSelected
                    ? 'bg-brand-subtle'
                    : 'bg-surface hover:bg-surface-subtle'
                } ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                    isSelected ? 'border-brand bg-brand' : 'border-edge-strong'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-content-inverse" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-content-strong">
                      {player.firstName} {player.lastName}
                    </div>
                    <div className="text-xs text-content-subtle">
                      {getBirthYear(player.birthDate)}
                    </div>
                  </div>
                </div>
                <Level level={player.level} />
              </button>
            );
          })
        )}
      </Panel>
      
      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-edge bg-surface/95 px-4 py-3 shadow-dock backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="text-sm font-medium text-content">
            {t('teamPlayerSelection.selectedPlayersSummary', { count: selectedPlayerIds.length })}
            {!canAddMore && selectedPlayerIds.length > 0 && (
              <div className="mt-1 text-xs text-danger">
                {t('teamPlayerSelection.tooManySelected', { max: remainingSlots })}
              </div>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={!editState?.canEdit || (selectedPlayerIds.length === 0 && removedPlayerIds.length === 0) || !canAddMore || hasMissingRemovalReasons}
          >
            {selectedPlayerIds.length > 0
              ? t('teamPlayerSelection.addPlayersAction', { count: selectedPlayerIds.length })
              : t('teamPlayerSelection.saveChanges')}
          </Button>
        </div>
      </div>
    </Page>
  );
}
