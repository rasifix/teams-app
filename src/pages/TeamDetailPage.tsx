import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivities, usePlayers, useTrainers, useShirtSets, useMatchPlanning } from '../store';
import { Button } from '../components/ui';
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
      <div className="page-container">
        <div className="empty-state">{t('teamDetail.teamNotFound')}</div>
      </div>
    );
  }
  
  const playerToRemoveData = playerToRemove ? players.find(p => p.id === playerToRemove) : null;
  
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6">
        <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
          <button 
            onClick={() => navigate(`/events/${eventId}`)}
            className="text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            ← {t('common.actions.back')}
          </button>
          <button
            onClick={() => setIsEditTeamModalOpen(true)}
            className="btn-secondary btn-sm"
          >
            {t('common.actions.edit')}
          </button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.075em] text-orange-600">{event.name}</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{team.name}</h1>
              <Strength level={team.strength} className="text-sm" />
            </div>
          </div>
          {event.teams.length > 1 && (
            <div className="w-full sm:w-auto sm:min-w-56">
              <label htmlFor="team-switcher" className="form-label">{t('teamDetail.switchTeam')}</label>
              <select
                id="team-switcher"
                value={team.id}
                onChange={(event) => navigate(`/events/${eventId}/teams/${event.target.value}`)}
                className="form-input !min-h-10 !rounded-xl !py-2 text-sm"
              >
                {event.teams.map((eventTeam) => <option key={eventTeam.id} value={eventTeam.id}>{eventTeam.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </header>
      
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
          <div className="divide-y divide-slate-100">
            
            <div className="flex min-h-12 items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-2">
                <span>🕐</span>
                <span className="text-sm font-semibold text-slate-700">{t('teamModal.fields.startTime')}</span>
              </div>
              <div className="text-right text-sm font-medium text-slate-900">
                {event.kind === 'match' ? getActivityTime(event) : team.startTime || getActivityTime(event)}
              </div>
            </div>
            {(event.kind === 'match' ? event.location : team.location || event.location) && (
              <div className="flex min-h-12 items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span className="text-sm font-semibold text-slate-700">{t('teamModal.fields.locationOptional')}</span>
                </div>
                <span className="text-right text-sm font-medium text-slate-900">{event.kind === 'match' ? event.location : team.location || event.location}</span>
              </div>
            )}

            <div className="flex min-h-12 items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-2">
                <span>💪</span>
                <span className="text-sm font-semibold text-slate-700">{t('teamModal.fields.strength')}</span>
              </div>
              <div className="text-sm">
                <Strength level={team.strength} className="text-xs" />
              </div>
            </div>            

            <button
              type="button"
              className="flex min-h-12 w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:text-orange-700"
              data-testid="team-responsible-people-row"
              onClick={() => setIsResponsibleModalOpen(true)}
            >
              <div className="flex items-center gap-2">
                <span>👤</span>
                <span className="text-sm font-semibold text-slate-700">{t('teamModal.fields.responsiblePeople')}</span>
              </div>
              {responsiblePeople.length > 0 ? (
                <div className="text-right text-sm font-medium text-slate-900">{responsiblePeople.map((person) => person.firstName + ' ' + person.lastName + (person.isLead ? ' (' + t('teamModal.leadPerson') + ')' : '')).join(', ')}</div>
              ) : (
                <div className="text-right text-sm text-slate-500">{t('teamModal.noTrainerAssigned')}</div>
              )}
            </button>

            <button
              type="button"
              className="flex min-h-12 w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:text-orange-700"
              data-testid="team-shirt-set-row"
              onClick={() => setIsAssignShirtsModalOpen(true)}
            >
              <div className="flex items-center gap-2">
                <span>👕</span>
                <span className="text-sm font-semibold text-slate-700">{t('teamDetail.shirtSetLabel')}</span>
              </div>
              {shirtSet ? (
                <div className="text-right text-sm font-medium text-slate-900">
                  {shirtSet.sponsor}
                </div>
              ) : (
                <div className="text-right text-sm text-slate-500">{t('teamDetail.noShirtSetAssigned')}</div>
              )}
            </button>

            {matchPlanningEnabled && event.kind === 'match' && event.matchFormatId && (
              <button
                type="button"
                className="flex min-h-12 w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:text-orange-700"
                onClick={() => setIsAssignFormationModalOpen(true)}
              >
                <div className="flex items-center gap-2">
                  <span>🧩</span>
                  <span className="text-sm font-semibold text-slate-700">{t('teamDetail.formationLabel')}</span>
                </div>
                <span className={`text-right text-sm ${team.formationId ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                  {formations.find((formation) => formation.id === team.formationId)?.name ?? t('teamDetail.noFormationAssigned')}
                </span>
              </button>
            )}

            <div className="flex min-h-12 items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-2">
                <span>📋</span>
                <span className="text-sm font-semibold text-slate-700">{t('teamDetail.lineupLabel')}</span>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {(event.kind === 'match' ? event.matchFormatId : undefined) && team.formationId && (
                  <Button className="btn-sm" onClick={() => navigate(`/events/${eventId}/teams/${teamId}/lineup/1`)}>
                    {t('teamDetail.planLineupAction')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                {t('domain.players')} ({selectedPlayers.length}/{(event.maxPlayersPerTeam ?? players.length)})
              </h2>
              <Button 
                onClick={handleAddPlayers}
                disabled={!selectionEditState?.canEdit}
                className='btn-sm'
              >
                {t('common.actions.edit')}
              </Button>
            </div>
            {!selectionEditState?.canEdit && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{t('teamPlayerSelection.eventPassedWarning')}</p>}
            
            {selectedPlayers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">{t('teamDetail.noPlayersSelected')}</div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                {selectedPlayers.map(player => {
                  const shirtAssignment = team.shirtAssignments?.find(a => a.playerId === player.id);
                  
                  return (
                    <div 
                      key={player.id}
                      className="relative overflow-hidden bg-white"
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
                              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm"
                              style={{ 
                                backgroundColor: shirtSet.color,
                                fontSize: '10px'
                              }}
                            >
                              {shirtAssignment.shirtNumber}
                            </span>
                          )}
                          <span className="font-semibold text-slate-900">
                            {player.firstName} {player.lastName}
                          </span>
                          <span className="text-slate-400">
                            {getBirthYear(player.birthDate)}
                          </span>
                        </div>
                        <Level level={player.level} />
                      </div>
                      
                      {/* Delete button that appears on swipe */}
                      <div 
                        className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-600 transition-opacity duration-200 ${
                          swipedPlayerId === player.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                      >
                        <button
                          className="flex items-center justify-center w-full h-full text-white font-medium text-sm"
                          onClick={() => setPlayerToRemove(player.id)}
                        >
                          {t('teamDetail.removeAction')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </section>
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
    </div>
  );
}
