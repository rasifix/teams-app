import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useActivities, usePlayers, useTrainers, useShirtSets, useMatchPlanning } from '../store';
import { Alert, Button, Cluster, ContentGrid, EmptyState, Field, ListFrame, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, PageToolbar, Panel, PanelActions, PanelHeader, PanelTitle, PropertyAction, PropertyActions, PropertyLabel, PropertyList, PropertyRow, PropertyValue, Select } from '../components/ui';
import Level from '../components/Level';
import Strength from '../components/Strength';
import SelectionRemovalDialog from '../components/SelectionRemovalDialog';
import EditTeamModal from '../components/EditTeamModal';
import AssignShirtsModal from '../components/AssignShirtsModal';
import AssignResponsiblePeopleModal from '../components/AssignResponsiblePeopleModal';
import AssignTeamPropertyModal from '../components/AssignTeamPropertyModal';
import { getUsedShirtNumbersBySetId } from '../utils/shirtAssignments';
import { selectTeamResponsiblePeople, selectTrainerForUser } from '../store/selectors/teamTrainerSelectors';
import { getActivityTime } from '../store/selectors/activitySelectors';
import { selectTeamPlayersByName } from '../store/selectors/teamPlayerSelectors';
import { selectSelectionEditState, selectTeamsWithSelectionChanges } from '../store/selectors/selectionSelectors';
import { getBirthYear } from '../utils/birthDate';
import type { SelectionRemovalReason } from '../types';

export default function TeamDetailPage() {
  const { t } = useTranslation();
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
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
  const currentTrainer = selectTrainerForUser(user, trainers);
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
      t.id === teamId ? { ...t, responsiblePersonIds: responsiblePersonIds.slice(0, 1) } : t
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
            <Cluster>
              <PageTitle>{team.name}</PageTitle>
              <Strength level={team.strength} />
            </Cluster>
          </PageHeaderContent>
          {event.teams.length > 1 && (
            <PageActions className="team-detail-switcher">
              <Field label={t('teamDetail.switchTeam')} htmlFor="team-switcher">
              <Select
                id="team-switcher"
                value={team.id}
                onChange={(event) => navigate(`/events/${eventId}/teams/${event.target.value}`)}
              >
                {event.teams.map((eventTeam) => <option key={eventTeam.id} value={eventTeam.id}>{eventTeam.name}</option>)}
              </Select>
              </Field>
            </PageActions>
          )}
      </PageHeader>
      
      <ContentGrid variant="sidebar">
        <Panel>
          <PropertyList>
            
            <PropertyRow>
              <PropertyLabel>
                <span>🕐</span>
                <span>{t('teamModal.fields.startTime')}</span>
              </PropertyLabel>
              <PropertyValue>
                {event.kind === 'match' ? getActivityTime(event) : team.startTime || getActivityTime(event)}
              </PropertyValue>
            </PropertyRow>
            {(event.kind === 'match' ? event.location : team.location || event.location) && (
              <PropertyRow>
                <PropertyLabel>
                  <span>📍</span>
                  <span>{t('teamModal.fields.locationOptional')}</span>
                </PropertyLabel>
                <PropertyValue>{event.kind === 'match' ? event.location : team.location || event.location}</PropertyValue>
              </PropertyRow>
            )}

            <PropertyRow>
              <PropertyLabel>
                <span>💪</span>
                <span>{t('teamModal.fields.strength')}</span>
              </PropertyLabel>
              <PropertyValue><Strength level={team.strength} /></PropertyValue>
            </PropertyRow>

            <PropertyAction
              data-testid="team-responsible-people-row"
              onClick={() => setIsResponsibleModalOpen(true)}
            >
              <PropertyLabel>
                <span>👤</span>
                <span>{t('teamModal.fields.responsiblePeople')}</span>
              </PropertyLabel>
              {responsiblePeople[0] ? (
                <PropertyValue>{responsiblePeople[0].firstName} {responsiblePeople[0].lastName}</PropertyValue>
              ) : (
                <PropertyValue muted>{t('teamModal.noTrainerAssigned')}</PropertyValue>
              )}
            </PropertyAction>

            <PropertyAction
              data-testid="team-shirt-set-row"
              onClick={() => setIsAssignShirtsModalOpen(true)}
            >
              <PropertyLabel>
                <span>👕</span>
                <span>{t('teamDetail.shirtSetLabel')}</span>
              </PropertyLabel>
              {shirtSet ? (
                <PropertyValue>
                  {shirtSet.sponsor}
                </PropertyValue>
              ) : (
                <PropertyValue muted>{t('teamDetail.noShirtSetAssigned')}</PropertyValue>
              )}
            </PropertyAction>

            {matchPlanningEnabled && event.kind === 'match' && event.matchFormatId && (
              <PropertyAction
                onClick={() => setIsAssignFormationModalOpen(true)}
              >
                <PropertyLabel>
                  <span>🧩</span>
                  <span>{t('teamDetail.formationLabel')}</span>
                </PropertyLabel>
                <PropertyValue muted={!team.formationId}>
                  {formations.find((formation) => formation.id === team.formationId)?.name ?? t('teamDetail.noFormationAssigned')}
                </PropertyValue>
              </PropertyAction>
            )}

            <PropertyRow>
              <PropertyLabel>
                <span>📋</span>
                <span>{t('teamDetail.lineupLabel')}</span>
              </PropertyLabel>
              <PropertyActions>
                {(event.kind === 'match' ? event.matchFormatId : undefined) && team.formationId && (
                  <Button size="sm" onClick={() => navigate(`/events/${eventId}/teams/${teamId}/lineup/1`)}>
                    {t('teamDetail.planLineupAction')}
                  </Button>
                )}
              </PropertyActions>
            </PropertyRow>
          </PropertyList>
        </Panel>
        
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
            {!selectionEditState?.canEdit && <Alert className="team-detail-player-alert">{t('teamPlayerSelection.eventPassedWarning')}</Alert>}
            
            {selectedPlayers.length === 0 ? (
              <EmptyState>{t('teamDetail.noPlayersSelected')}</EmptyState>
            ) : (
              <ListFrame>
                {selectedPlayers.map(player => {
                  const shirtAssignment = team.shirtAssignments?.find(a => a.playerId === player.id);
                  
                  return (
                    <div 
                      key={player.id}
                      className="team-player-row"
                    >
                      {/* Main content */}
                      <div
                        className={`team-player-main${swipedPlayerId === player.id ? ' team-player-main--swiped' : ''}`}
                        onTouchStart={(e) => selectionEditState?.canEdit && handleTouchStart(player.id, e)}
                      >
                        <div className="team-player-identity">
                          {shirtAssignment && shirtSet && (
                            <span 
                              className="team-player-shirt"
                              style={{ 
                                backgroundColor: shirtSet.color
                              }}
                            >
                              {shirtAssignment.shirtNumber}
                            </span>
                          )}
                          <span className="team-player-name">
                            {player.firstName} {player.lastName}
                          </span>
                          <span className="team-player-year">
                            {getBirthYear(player.birthDate)}
                          </span>
                        </div>
                        <Level level={player.level} />
                      </div>
                      
                      {/* Delete button that appears on swipe */}
                      <div 
                        className={`ui-swipe-action-tray${swipedPlayerId === player.id ? ' ui-swipe-action-tray--visible' : ''}`}
                      >
                        <button
                          type="button"
                          data-ui-control="composite"
                          className="team-player-remove-button"
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
      </ContentGrid>
      
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
            currentTrainerId={currentTrainer?.id}
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
