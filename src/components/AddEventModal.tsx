import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayers, useSquadMatchFormats } from '../store';
import { selectActivityFormConfiguration } from '../store/selectors/activityFormSelectors';
import { selectDefaultMatchFormat } from '../store/selectors/matchPlanningSelectors';
import { toStartsAt } from '../store/selectors/activitySelectors';
import type { ActivityKind, ActivityPayload, InvitationResponse, Team } from '../types';
import Button from './ui/Button';
import InvitePlayersModal from './InvitePlayersModal';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (activity: ActivityPayload) => void;
}

const initialKind: ActivityKind = 'match';

export default function AddEventModal({ isOpen, onClose, onAdd }: AddEventModalProps) {
  const { t } = useTranslation();
  const matchFormats = useSquadMatchFormats();
  const { players } = usePlayers();
  const defaultMatchFormat = selectDefaultMatchFormat(matchFormats);
  const defaultLimits = selectActivityFormConfiguration('match', matchFormats, defaultMatchFormat?.id).defaultLimits;
  const [kind, setKind] = useState<ActivityKind>(initialKind);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [numberOfTeams, setNumberOfTeams] = useState(1);
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(9);
  const [minPlayersPerTeam, setMinPlayersPerTeam] = useState(6);
  const [matchFormatId, setMatchFormatId] = useState(defaultMatchFormat?.id ?? '');
  const [invitedPlayerIds, setInvitedPlayerIds] = useState<string[]>([]);
  const [invitationResponse, setInvitationResponse] = useState<InvitationResponse>('accepted');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = selectActivityFormConfiguration(kind, matchFormats, matchFormatId);

  useEffect(() => {
    if (config.defaultLimits) {
      setMinPlayersPerTeam(config.defaultLimits.minPlayersPerTeam);
      setMaxPlayersPerTeam(config.defaultLimits.maxPlayersPerTeam);
    }
  // Only respond to an explicit selection change, not a newly allocated config object.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, matchFormatId]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setKind(initialKind);
    setName('');
    setDate('');
    setStartTime('');
    setLocation('');
    setOpponentName('');
    setNumberOfTeams(1);
    setMinPlayersPerTeam(defaultLimits?.minPlayersPerTeam ?? 6);
    setMaxPlayersPerTeam(defaultLimits?.maxPlayersPerTeam ?? 9);
    setMatchFormatId(defaultMatchFormat?.id ?? '');
    setInvitedPlayerIds([]);
    setIsInviteOpen(false);
  }, [isOpen, defaultMatchFormat, defaultLimits?.minPlayersPerTeam, defaultLimits?.maxPlayersPerTeam]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (minPlayersPerTeam < 1 || minPlayersPerTeam > maxPlayersPerTeam) {
      setError(t('editEventModal.errors.minGreaterThanMax'));
      return;
    }
    const teamCount = config.fixedTeamCount ?? Math.max(1, numberOfTeams);
    const teams: Team[] = Array.from({ length: teamCount }, (_, index) => ({
      id: crypto.randomUUID(),
      name: `${t('domain.team')} ${index + 1}`,
      strength: 2,
      startTime,
      selectedPlayers: [],
    }));

    onAdd({
      kind,
      name: name.trim(),
      startsAt: toStartsAt(date, startTime),
      location: location.trim() || undefined,
      opponentName: config.showOpponent ? opponentName.trim() || undefined : undefined,
      matchFormatId: config.showMatchFormat ? matchFormatId || null : undefined,
      minPlayersPerTeam,
      maxPlayersPerTeam,
      teams,
      invitations: invitedPlayerIds.map((playerId) => ({ id: crypto.randomUUID(), playerId, response: invitationResponse })),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader><ModalTitle>{t('eventModal.addTitle')}</ModalTitle></ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="activity-kind" className="form-label">{t('activity.fields.kind')}</label>
              <select id="activity-kind" value={kind} onChange={(event) => setKind(event.target.value as ActivityKind)} className="form-input">
                <option value="match">{t('activity.kinds.match')}</option>
                <option value="tournament">{t('activity.kinds.tournament')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="event-name" className="form-label">{t('eventModal.fields.eventNameRequired')}</label>
              <input id="event-name" type="text" value={name} onChange={(event) => setName(event.target.value)} className="form-input" required autoFocus />
            </div>
            {config.showOpponent && <div>
              <label htmlFor="activity-opponent" className="form-label">{t('activity.fields.opponent')}</label>
              <input id="activity-opponent" type="text" value={opponentName} onChange={(event) => setOpponentName(event.target.value)} className="form-input" />
            </div>}
            {config.showMatchFormat && <div>
              <label htmlFor="activity-format" className="form-label">{t('activity.fields.matchFormat')}</label>
              <select id="activity-format" value={matchFormatId} onChange={(event) => setMatchFormatId(event.target.value)} className="form-input">
                <option value="">{t('eventModal.fields.noMatchFormat')}</option>
                {matchFormats.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}
              </select>
            </div>}
            {config.showTeamCount && <div>
              <label htmlFor="activity-teams" className="form-label">{t('eventModal.fields.numberOfTeamsRequired')}</label>
              <input id="activity-teams" type="number" min={1} value={numberOfTeams} onChange={(event) => setNumberOfTeams(Math.max(1, Number(event.target.value) || 1))} className="form-input" required />
            </div>}
            <div>
              <label htmlFor="event-date" className="form-label">{t('eventModal.fields.dateRequired')}</label>
              <input id="event-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="form-input" required />
            </div>
            <div>
              <label htmlFor="event-time" className="form-label">{t('activity.fields.startTime')}</label>
              <input id="event-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="form-input" required />
            </div>
            <div>
              <label htmlFor="event-location" className="form-label">{t('eventModal.fields.location')}</label>
              <input id="event-location" type="text" value={location} onChange={(event) => setLocation(event.target.value)} className="form-input" />
            </div>
            <div>
              <label htmlFor="max-players" className="form-label">{t('eventModal.fields.maxPlayersPerTeamRequired')}</label>
              <input id="max-players" type="number" min={1} value={maxPlayersPerTeam} onChange={(event) => setMaxPlayersPerTeam(Number(event.target.value) || 1)} className="form-input" required />
            </div>
            <div>
              <label htmlFor="min-players" className="form-label">{t('eventModal.fields.minPlayersPerTeamRequired')}</label>
              <input id="min-players" type="number" min={1} max={maxPlayersPerTeam} value={minPlayersPerTeam} onChange={(event) => setMinPlayersPerTeam(Number(event.target.value) || 1)} className="form-input" required />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-700" data-testid="add-event-invited-count">{t('invitePlayers.selectedCount', { count: invitedPlayerIds.length })}</span>
              <Button type="button" variant="secondary" className="btn-sm" onClick={() => setIsInviteOpen(true)}>{t('eventModal.invitePlayersAction')}</Button>
            </div>
            {error && <div role="alert" className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.actions.cancel')}</Button>
          <Button type="submit" variant="primary">{t('common.actions.add')}</Button>
        </ModalFooter>
      </form>
      <InvitePlayersModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={(playerIds, response) => { setInvitedPlayerIds(playerIds); setInvitationResponse(response); }}
        alreadyInvitedPlayerIds={[]}
        players={players}
      />
    </Modal>
  );
}
