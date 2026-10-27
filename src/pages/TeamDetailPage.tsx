import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useActivities, usePlayers, useTrainers, useShirtSets, useMatchPlanning } from '../store';
import { Alert, Button, Cluster, ContentGrid, EmptyState, Field, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, PageToolbar, Select } from '../components/ui';
import Strength from '../components/Strength';
import SelectionRemovalDialog from '../components/SelectionRemovalDialog';
import EditTeamModal from '../components/EditTeamModal';
import AssignShirtsModal from '../components/AssignShirtsModal';
import AssignResponsiblePeopleModal from '../components/AssignResponsiblePeopleModal';
import AssignTeamPropertyModal from '../components/AssignTeamPropertyModal';
import { getUsedShirtNumbersBySetId } from '../utils/shirtAssignments';
import { selectTeamResponsiblePeople, selectTrainerForUser } from '../store/selectors/teamTrainerSelectors';
import { selectTeamPlayersByName } from '../store/selectors/teamPlayerSelectors';
import { selectActivitySelectionChanges, selectSelectionEditState } from '../store/selectors/selectionSelectors';
import type { SelectionRemovalReason } from '../types';
import TeamPropertiesSection from '../components/teamDetail/TeamPropertiesSection';
import TeamRosterSection from '../components/teamDetail/TeamRosterSection';

export default function TeamDetailPage() {
  const { t } = useTranslation();
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { getActivityById, executeActivityIntent } = useActivities();
  const { players } = usePlayers();
  const { trainers } = useTrainers();
  const { shirtSets } = useShirtSets();
  const { formations, matchPlanningEnabled } = useMatchPlanning();
  
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null);
  const [removalReason, setRemovalReason] = useState<SelectionRemovalReason | ''>('');
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [isResponsibleModalOpen, setIsResponsibleModalOpen] = useState(false);
  const [isAssignShirtsModalOpen, setIsAssignShirtsModalOpen] = useState(false);
  const [isAssignFormationModalOpen, setIsAssignFormationModalOpen] = useState(false);
  
  const event = eventId ? getActivityById(eventId) : null;
  const team = event?.teams.find(t => t.id === teamId);
  
  const responsiblePeople = team
    ? selectTeamResponsiblePeople(team.responsiblePersonId, trainers, players)
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

    const changes = selectActivitySelectionChanges(
      team.selectedPlayers,
      team.selectedPlayers.filter((id) => id !== playerToRemove),
      removalReason ? { [playerToRemove]: removalReason } : {},
      selectionEditState.requiresRemovalReason,
    );
    await executeActivityIntent(eventId, { type: 'selection', teamId: team.id, ...changes });
    setPlayerToRemove(null);
    setRemovalReason('');
  };

  const handleChangeFormation = async (formationId: string | undefined) => {
    if (!event || !eventId || !team) return;

    await executeActivityIntent(eventId, { type: 'formation', teamId: team.id, formationId: formationId ?? null });
  };

  const handleAddPlayers = () => {
    navigate(`/activities/${eventId}/teams/${teamId}/select-players`);
  };
  
  const handleEditTeam = async (name: string, strength: number, startTime: string | undefined, location?: string, meetingTime?: string, meetingLocation?: string) => {
    if (!event || !eventId || !team) return;
    
    await executeActivityIntent(eventId, { type: 'teamDetails', teamId: team.id, changes: {
      name, strength, startTime: startTime ?? null, location: location ?? null,
      meetingTime: meetingTime ?? null, meetingLocation: meetingLocation ?? null,
    } });
    setIsEditTeamModalOpen(false);
  };
  
  const handleAssignResponsiblePerson = async (responsiblePersonId: string | undefined) => {
    if (!event || !eventId || !team) return;

    await executeActivityIntent(eventId, { type: 'responsiblePerson', teamId: team.id, responsiblePersonId: responsiblePersonId ?? null });
  };

  const handleAssignShirts = async (shirtSetId: string, assignments: Array<{ playerId: string; shirtNumber: number }>) => {
    if (!event || !eventId || !team) return;
    
    await executeActivityIntent(eventId, { type: 'shirts', teamId: team.id, shirtSetId, assignments });
    setIsAssignShirtsModalOpen(false);
  };
  
  if (!event || !team) {
    return (
      <Page>
        <EmptyState>{t('page.teamDetail.teamNotFound')}</EmptyState>
      </Page>
    );
  }
  
  const playerToRemoveData = playerToRemove ? players.find(p => p.id === playerToRemove) : null;
  const isCancelled = event.status === 'cancelled';
  
  return (
    <Page>
      <PageToolbar>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/activities/${eventId}`)}
          >
            ← {t('common.actions.back')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditTeamModalOpen(true)}
            disabled={isCancelled}
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
              <Field label={t('page.teamDetail.switchTeam')} htmlFor="team-switcher">
              <Select
                id="team-switcher"
                controlSize="sm"
                value={team.id}
                onChange={(event) => navigate(`/activities/${eventId}/teams/${event.target.value}`)}
              >
                {event.teams.map((eventTeam) => <option key={eventTeam.id} value={eventTeam.id}>{eventTeam.name}</option>)}
              </Select>
              </Field>
            </PageActions>
          )}
      </PageHeader>
      {isCancelled && <Alert tone="warning">{t('page.eventDetail.cancelledReadOnly')}</Alert>}
      
      <ContentGrid variant="equalSm">
        <TeamPropertiesSection
          activity={event}
          team={team}
          responsiblePeople={responsiblePeople}
          shirtSetSponsor={shirtSet?.sponsor ?? null}
          formationName={formations.find((formation) => formation.id === team.formationId)?.name ?? null}
          matchPlanningEnabled={matchPlanningEnabled}
          isCancelled={isCancelled}
          onAssignResponsiblePerson={() => setIsResponsibleModalOpen(true)}
          onAssignShirts={() => setIsAssignShirtsModalOpen(true)}
          onAssignFormation={() => setIsAssignFormationModalOpen(true)}
          onPlanLineup={() => navigate(`/activities/${eventId}/teams/${teamId}/lineup/1`)}
        />
        <TeamRosterSection
          team={team}
          players={selectedPlayers}
          maxPlayers={event.maxPlayersPerTeam ?? players.length}
          canEditSelection={Boolean(selectionEditState?.canEdit)}
          isCancelled={isCancelled}
          onEditPlayers={handleAddPlayers}
          onRemovePlayer={setPlayerToRemove}
        />
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
            currentMeetingTime={team.meetingTime}
            currentMeetingLocation={team.meetingLocation}
            showActivityOverrides={event.kind !== 'match'}
          />
          
          <AssignResponsiblePeopleModal
            isOpen={isResponsibleModalOpen}
            onClose={() => setIsResponsibleModalOpen(false)}
            onSave={handleAssignResponsiblePerson}
            trainers={trainers}
            players={players}
            currentResponsiblePersonId={team.responsiblePersonId}
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
            title={t('page.teamDetail.assignFormationTitle')}
            label={t('page.teamDetail.formationLabel')}
            emptyOptionLabel={t('page.teamDetail.noFormationAssigned')}
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
