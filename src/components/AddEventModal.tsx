import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayers, useSquadMatchFormats } from '../store';
import { selectActivityFormConfiguration } from '../store/selectors/activityFormSelectors';
import { selectDefaultMatchFormat } from '../store/selectors/matchPlanningSelectors';
import { toStartsAt } from '../store/selectors/activitySelectors';
import type { ActivityKind, ActivityPayload, InvitationResponse, Team } from '../types';
import InvitePlayersModal from './InvitePlayersModal';
import { Alert, Button, Field, Input, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Select } from './ui';

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
          <div className="layout-stack">
            <Field label={t('activity.fields.kind')} htmlFor="activity-kind">
              <Select id="activity-kind" value={kind} onChange={(event) => setKind(event.target.value as ActivityKind)}>
                <option value="match">{t('activity.kinds.match')}</option>
                <option value="tournament">{t('activity.kinds.tournament')}</option>
              </Select>
            </Field>
            <Field label={t('eventModal.fields.eventNameRequired')} htmlFor="event-name">
              <Input id="event-name" type="text" value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
            </Field>
            {config.showOpponent && <Field label={t('activity.fields.opponent')} htmlFor="activity-opponent">
              <Input id="activity-opponent" type="text" value={opponentName} onChange={(event) => setOpponentName(event.target.value)} />
            </Field>}
            {config.showMatchFormat && <Field label={t('activity.fields.matchFormat')} htmlFor="activity-format">
              <Select id="activity-format" value={matchFormatId} onChange={(event) => setMatchFormatId(event.target.value)}>
                <option value="">{t('eventModal.fields.noMatchFormat')}</option>
                {matchFormats.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}
              </Select>
            </Field>}
            {config.showTeamCount && <Field label={t('eventModal.fields.numberOfTeamsRequired')} htmlFor="activity-teams">
              <Input id="activity-teams" type="number" min={1} value={numberOfTeams} onChange={(event) => setNumberOfTeams(Math.max(1, Number(event.target.value) || 1))} required />
            </Field>}
            <Field label={t('eventModal.fields.dateRequired')} htmlFor="event-date">
              <Input id="event-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            </Field>
            <Field label={t('activity.fields.startTime')} htmlFor="event-time">
              <Input id="event-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
            </Field>
            <Field label={t('eventModal.fields.location')} htmlFor="event-location">
              <Input id="event-location" type="text" value={location} onChange={(event) => setLocation(event.target.value)} />
            </Field>
            <Field label={t('eventModal.fields.maxPlayersPerTeamRequired')} htmlFor="max-players">
              <Input id="max-players" type="number" min={1} value={maxPlayersPerTeam} onChange={(event) => setMaxPlayersPerTeam(Number(event.target.value) || 1)} required />
            </Field>
            <Field label={t('eventModal.fields.minPlayersPerTeamRequired')} htmlFor="min-players">
              <Input id="min-players" type="number" min={1} max={maxPlayersPerTeam} value={minPlayersPerTeam} onChange={(event) => setMinPlayersPerTeam(Number(event.target.value) || 1)} required />
            </Field>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-content" data-testid="add-event-invited-count">{t('invitePlayers.selectedCount', { count: invitedPlayerIds.length })}</span>
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsInviteOpen(true)}>{t('eventModal.invitePlayersAction')}</Button>
            </div>
            {error && <Alert>{error}</Alert>}
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
