import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivities, usePlayers, useTrainers, useShirtSets, useMatchPlanning } from '../store';
import { Alert, Button, EmptyState, Field, ListAction, ListFrame, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, PageToolbar, Panel, PanelActions, PanelHeader, PanelTitle, Select } from '../components/ui';
import Level from '../components/Level';
import Strength from '../components/Strength';
import SelectionRemovalDialog from '../components/SelectionRemovalDialog';
import EditTeamModal from '../components/EditTeamModal';
import AssignShirtsModal from '../components/AssignShirtsModal';
import AssignResponsiblePeopleModal from '../components/AssignResponsiblePeopleModal';
import AssignTeamPropertyModal from '../components/AssignTeamPropertyModal';
import { getUsedShirtNumbersBySetId } from '../utils/shirtAssignments';
import { selectTeamResponsiblePeople } from '../store/selectors/teamTrainerSelectors';
import { getActivityTime } from '../store/selectors/activitySelectors';
import { selectTeamPlayersByName } from '../store/selectors/teamPlayerSelectors';
import { selectSelectionEditState, selectTeamsWithSelectionChanges } from '../store/selectors/selectionSelectors';
import { getBirthYear } from '../utils/birthDate';
import type { SelectionRemovalReason } from '../types';

export default function TeamDetailPage() {
  const { t } = useTranslation();
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const navigate = useNavigate();
  
  const { getActivityById, updateActivityTeams, updateActivitySelection } = useActivities();
  const { players } = usePlayers();
  const { trainers } = useTrainers();
  const { shirtSets } = useShirtSets();
  const { formations, matchPlanningEnabled } = useMatchPlanning();
  
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null);
  const [removalReason, setRemovalReason] = useState<SelectionRemovalReason | ''>('');
  const [swipedPlayerId, setSwipedPlayerId] = useState<string | null>(null);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [isResponsibleModalOpen, setIsResponsibleModalOpen] = useState(false);
  const [isAssignShirtsModalOpen, setIsAssignShirtsModalOpen] = useState(false);
  const [isAssignFormationModalOpen, setIsAssignFormationModalOpen] = useState(false);
  
  const event = eventId ? getActivityById(eventId) : null;
  const team = event?.teams.find(t => t.id === teamId);
  
  const responsiblePeople = team
    ? selectTeamResponsiblePeople(team.responsiblePersonIds, trainers, players)
    : [];
  const shirtSet = team?.shirtSetId ? shirtSets.find(s => s.id === team.shirtSetId) : null;
  const selectedPlayers = team ? selectTeamPlayersByName(team, players) : [];
  const selectionEditState = event ? selectSelectionEditState(event) : null;
  const formationOptions = useMemo(
    () => formations.map((formation) => ({ value: formation.id, label: formation.name })),
    [formations]
  );
  const usedShirtNumbersBySetId = useMemo(() => {
    if (!event || !team) {
      return {} as Record<string, number[]>;
    }

    return getUsedShirtNumbersBySetId(event.teams, team.id);
  }, [event, team]);
  
  const handleRemovePlayer = async () => {
    if (!event || !eventId || !team || !playerToRemove || !selectionEditState?.canEdit) return;
    if (selectionEditState.requiresRemovalReason && !removalReason) return;

    const updatedTeams = selectTeamsWithSelectionChanges(
      event.teams,
      team.id,
      team.selectedPlayers.filter((id) => id !== playerToRemove),
      removalReason ? { [playerToRemove]: removalReason } : {},
      new Date().toISOString(),
    );

    await updateActivitySelection(eventId, updatedTeams);
    setPlayerToRemove(null);
    setRemovalReason('');
    setSwipedPlayerId(null);
  };

  const handleChangeFormation = async (formationId: string | undefined) => {
    if (!event || !eventId || !team) return;

    const updatedTeams = event.teams.map(t =>
      t.id === teamId ? { ...t, formationId: formationId || null } : t
    );

    await updateActivityTeams(eventId, updatedTeams);
  };

  const handleTouchStart = (playerId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const moveTouch = moveEvent.touches[0];
      const diffX = startX - moveTouch.clientX;
      
      // If swiped left more than 50px, show delete button
      if (diffX > 50 && swipedPlayerId !== playerId) {
        setSwipedPlayerId(playerId);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
      // If swiped right more than 30px while delete button is showing, hide it
      else if (diffX < -30 && swipedPlayerId === playerId) {
        setSwipedPlayerId(null);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };
  
  const handleAddPlayers = () => {
    navigate(`/events/${eventId}/teams/${teamId}/select-players`);
  };
  
  const handleEditTeam = async (name: string, strength: number, startTime: string | undefined, location?: string) => {
    if (!event || !eventId || !team) return;
    
    const updatedTeams = event.teams.map(t =>
      t.id === teamId ? { ...t, name, strength, startTime, location } : t
    );
    
    await updateActivityTeams(eventId, updatedTeams);
    setIsEditTeamModalOpen(false);
  };
  
  const handleAssignResponsiblePeople = async (responsiblePersonIds: string[]) => {
    if (!event || !eventId || !team) return;

    const updatedTeams = event.teams.map(t =>
      t.id === teamId ? { ...t, responsiblePersonIds } : t
    );

    await updateActivityTeams(eventId, updatedTeams);
  };

  const handleAssignShirts = async (shirtSetId: string, assignments: Array<{ playerId: string; shirtNumber: number }>) => {
    if (!event || !eventId || !team) return;
    
    const updatedTeams = event.teams.map(t =>
      t.id === teamId ? { ...t, shirtSetId, shirtAssignments: assignments } : t
    );
    
    await updateActivityTeams(eventId, updatedTeams);
    setIsAssignShirtsModalOpen(false);
  };
  
  if (!event || !team) {
    return (
      <Page>
        <EmptyState>{t('teamDetail.teamNotFound')}</EmptyState>
      </Page>
    );
  }
  
  const playerToRemoveData = playerToRemove ? players.find(p => p.id === playerToRemove) : null;
  
  return (
    <Page>
      <PageToolbar>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/events/${eventId}`)}
          >
            ← {t('common.actions.back')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditTeamModalOpen(true)}
          >
            {t('common.actions.edit')}
          </Button>
      </PageToolbar>
      <PageHeader>
          <PageHeaderContent>
            <p className="eyebrow">{event.name}</p>
            <div className="flex flex-wrap items-center gap-3">
              <PageTitle>{team.name}</PageTitle>
              <Strength level={team.strength} className="text-sm" />
            </div>
          </PageHeaderContent>
          {event.teams.length > 1 && (
            <PageActions className="w-full sm:w-auto sm:min-w-56">
              <Field label={t('teamDetail.switchTeam')} htmlFor="team-switcher" className="w-full">
              <Select
                id="team-switcher"
                value={team.id}
                onChange={(event) => navigate(`/events/${eventId}/teams/${event.target.value}`)}
                className="text-sm"
              >
                {event.teams.map((eventTeam) => <option key={eventTeam.id} value={eventTeam.id}>{eventTeam.name}</option>)}
              </Select>
              </Field>
            </PageActions>
          )}
      </PageHeader>
      
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <section className="overflow-hidden rounded-3xl border border-edge bg-surface p-4 shadow-md sm:p-6">
          <div className="divide-y divide-edge">
            
            <div className="flex min-h-12 items-center justify-between gap-4 py-3">
              <div className="layout-cluster">
                <span>🕐</span>
                <span className="text-sm font-semibold text-content">{t('teamModal.fields.startTime')}</span>
              </div>
              <div className="text-right text-sm font-medium text-content-strong">
                {event.kind === 'match' ? getActivityTime(event) : team.startTime || getActivityTime(event)}
              </div>
            </div>
            {(event.kind === 'match' ? event.location : team.location || event.location) && (
              <div className="flex min-h-12 items-center justify-between gap-4 py-3">
                <div className="layout-cluster">
                  <span>📍</span>
                  <span className="text-sm font-semibold text-content">{t('teamModal.fields.locationOptional')}</span>
                </div>
                <span className="text-right text-sm font-medium text-content-strong">{event.kind === 'match' ? event.location : team.location || event.location}</span>
              </div>
            )}

            <div className="flex min-h-12 items-center justify-between gap-4 py-3">
              <div className="layout-cluster">
                <span>💪</span>
                <span className="text-sm font-semibold text-content">{t('teamModal.fields.strength')}</span>
              </div>
              <div className="text-sm">
                <Strength level={team.strength} className="text-xs" />
              </div>
            </div>            

            <ListAction
              data-testid="team-responsible-people-row"
              onClick={() => setIsResponsibleModalOpen(true)}
            >
              <div className="layout-cluster">
                <span>👤</span>
                <span className="text-sm font-semibold text-content">{t('teamModal.fields.responsiblePeople')}</span>
              </div>
              {responsiblePeople.length > 0 ? (
                <div className="text-right text-sm font-medium text-content-strong">{responsiblePeople.map((person) => person.firstName + ' ' + person.lastName + (person.isLead ? ' (' + t('teamModal.leadPerson') + ')' : '')).join(', ')}</div>
              ) : (
                <div className="text-right text-sm text-content-subtle">{t('teamModal.noTrainerAssigned')}</div>
              )}
            </ListAction>

            <ListAction
              data-testid="team-shirt-set-row"
              onClick={() => setIsAssignShirtsModalOpen(true)}
            >
              <div className="layout-cluster">
                <span>👕</span>
                <span className="text-sm font-semibold text-content">{t('teamDetail.shirtSetLabel')}</span>
              </div>
              {shirtSet ? (
                <div className="text-right text-sm font-medium text-content-strong">
                  {shirtSet.sponsor}
                </div>
              ) : (
                <div className="text-right text-sm text-content-subtle">{t('teamDetail.noShirtSetAssigned')}</div>
              )}
            </ListAction>

            {matchPlanningEnabled && event.kind === 'match' && event.matchFormatId && (
              <ListAction
                onClick={() => setIsAssignFormationModalOpen(true)}
              >
                <div className="layout-cluster">
                  <span>🧩</span>
                  <span className="text-sm font-semibold text-content">{t('teamDetail.formationLabel')}</span>
                </div>
                <span className={`text-right text-sm ${team.formationId ? 'font-medium text-content-strong' : 'text-content-subtle'}`}>
                  {formations.find((formation) => formation.id === team.formationId)?.name ?? t('teamDetail.noFormationAssigned')}
                </span>
              </ListAction>
            )}

            <div className="flex min-h-12 items-center justify-between gap-4 py-3">
              <div className="layout-cluster">
                <span>📋</span>
                <span className="text-sm font-semibold text-content">{t('teamDetail.lineupLabel')}</span>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {(event.kind === 'match' ? event.matchFormatId : undefined) && team.formationId && (
                  <Button size="sm" onClick={() => navigate(`/events/${eventId}/teams/${teamId}/lineup/1`)}>
                    {t('teamDetail.planLineupAction')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <Panel>
            <PanelHeader>
              <PanelTitle>
                {t('domain.players')} ({selectedPlayers.length}/{(event.maxPlayersPerTeam ?? players.length)})
              </PanelTitle>
              <PanelActions>
              <Button 
                onClick={handleAddPlayers}
                disabled={!selectionEditState?.canEdit}
                size="sm"
              >
                {t('common.actions.edit')}
              </Button>
              </PanelActions>
            </PanelHeader>
            {!selectionEditState?.canEdit && <Alert className="mb-4">{t('teamPlayerSelection.eventPassedWarning')}</Alert>}
            
            {selectedPlayers.length === 0 ? (
              <EmptyState>{t('teamDetail.noPlayersSelected')}</EmptyState>
            ) : (
              <ListFrame>
                {selectedPlayers.map(player => {
                  const shirtAssignment = team.shirtAssignments?.find(a => a.playerId === player.id);
                  
                  return (
                    <div 
                      key={player.id}
                      className="relative overflow-hidden bg-surface"
                    >
                      {/* Main content */}
                      <div
                        className={`flex items-center justify-between px-4 py-3.5 transition-transform duration-200 ${
                          swipedPlayerId === player.id ? '-translate-x-20' : 'translate-x-0'
                        }`}
                        onTouchStart={(e) => selectionEditState?.canEdit && handleTouchStart(player.id, e)}
                      >
                        <div className="flex flex-1 items-center gap-2 text-sm">
                          {shirtAssignment && shirtSet && (
                            <span 
                              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-bold text-content-inverse shadow-sm"
                              style={{ 
                                backgroundColor: shirtSet.color,
                                fontSize: '10px'
                              }}
                            >
                              {shirtAssignment.shirtNumber}
                            </span>
                          )}
                          <span className="font-semibold text-content-strong">
                            {player.firstName} {player.lastName}
                          </span>
                          <span className="text-content-disabled">
                            {getBirthYear(player.birthDate)}
                          </span>
                        </div>
                        <Level level={player.level} />
                      </div>
                      
                      {/* Delete button that appears on swipe */}
                      <div 
                        className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-danger transition-opacity duration-200 ${
                          swipedPlayerId === player.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                      >
                        <button
                          type="button"
                          data-ui-control="composite"
                          className="flex items-center justify-center w-full h-full text-content-inverse font-medium text-sm"
                          onClick={() => setPlayerToRemove(player.id)}
                        >
                          {t('teamDetail.removeAction')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </ListFrame>
            )}
        </Panel>
      </div>
      
      <SelectionRemovalDialog
        isOpen={Boolean(playerToRemove)}
        playerName={playerToRemoveData ? `${playerToRemoveData.firstName} ${playerToRemoveData.lastName}` : ''}
        reason={removalReason}
        reasonRequired={Boolean(selectionEditState?.requiresRemovalReason)}
        onReasonChange={setRemovalReason}
        onConfirm={handleRemovePlayer}
        onCancel={() => { setPlayerToRemove(null); setRemovalReason(''); }}
      />
      
      {team && (
        <>
          <EditTeamModal
            isOpen={isEditTeamModalOpen}
            onClose={() => setIsEditTeamModalOpen(false)}
            onSave={handleEditTeam}
            currentName={team.name}
            currentStrength={team.strength}
            currentStartTime={team.startTime}
            currentLocation={team.location}
            showActivityOverrides={event.kind !== 'match'}
          />
          
          <AssignResponsiblePeopleModal
            isOpen={isResponsibleModalOpen}
            onClose={() => setIsResponsibleModalOpen(false)}
            onSave={handleAssignResponsiblePeople}
            trainers={trainers}
            players={players}
            currentResponsiblePersonIds={team.responsiblePersonIds}
          />

          <AssignShirtsModal
            isOpen={isAssignShirtsModalOpen}
            onClose={() => setIsAssignShirtsModalOpen(false)}
            onSave={handleAssignShirts}
            team={team}
            usedShirtNumbersBySetId={usedShirtNumbersBySetId}
            players={selectedPlayers}
            shirtSets={shirtSets}
            currentShirtSetId={team.shirtSetId}
            currentShirtAssignments={team.shirtAssignments}
          />

          {matchPlanningEnabled && <AssignTeamPropertyModal
            isOpen={isAssignFormationModalOpen}
            title={t('teamDetail.assignFormationTitle')}
            label={t('teamDetail.formationLabel')}
            emptyOptionLabel={t('teamDetail.noFormationAssigned')}
            currentValue={team.formationId}
            options={formationOptions}
            onClose={() => setIsAssignFormationModalOpen(false)}
            onSave={handleChangeFormation}
          />}
        </>
      )}
    </Page>
  );
}
