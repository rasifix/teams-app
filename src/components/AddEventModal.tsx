import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayers, useSquadMatchFormats } from '../store';
import { selectActivityFormConfiguration } from '../store/selectors/activityFormSelectors';
import { selectDefaultMatchFormat } from '../store/selectors/matchPlanningSelectors';
import { toStartsAt } from '../store/selectors/activitySelectors';
import { validateActivitySchedule } from '../store/selectors/activityFormValidation';
import type { ActivityKind, ActivityPayload, InvitationResponse, Team } from '../types';
import InvitePlayersModal from './InvitePlayersModal';
import { Alert, Button, Field, Input, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Select, Split, Stack } from './ui';
import ActivityCoreFields from './ActivityCoreFields';
import ActivityPlayerLimitFields from './ActivityPlayerLimitFields';

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
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
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
    setEndDate('');
    setEndTime('');
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
    const validationError = validateActivitySchedule({ minPlayersPerTeam, maxPlayersPerTeam, minimumAllowedPlayers: 1, date, startTime, endDate, endTime });
    if (validationError) {
      setError(validationError === 'minMax' ? t('page.editEventModal.errors.minGreaterThanMax') : validationError === 'endDateTimeTogether' ? t('common.validation.endDateTimeTogether') : t('common.validation.endAfterStart'));
      return;
    }
    const startsAt = toStartsAt(date, startTime);
    const endsAt = endDate && endTime ? toStartsAt(endDate, endTime) : undefined;
    const teamCount = config.fixedTeamCount ?? Math.max(1, numberOfTeams);
    const teams: Team[] = Array.from({ length: teamCount }, (_, index) => ({
      id: crypto.randomUUID(),
      name: `${t('domain.team.label')} ${index + 1}`,
      strength: 2,
      startTime,
      selectedPlayers: [],
    }));

    onAdd({
      kind,
      status: 'active',
      name: name.trim(),
      startsAt,
      endsAt,
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
      <ModalHeader><ModalTitle>{t('page.eventModal.addTitle')}</ModalTitle></ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <Stack>
            <Field label={t('domain.activity.fields.kind')} htmlFor="activity-kind">
              <Select id="activity-kind" value={kind} onChange={(event) => setKind(event.target.value as ActivityKind)}>
                <option value="match">{t('domain.activity.kinds.match')}</option>
                <option value="tournament">{t('domain.activity.kinds.tournament')}</option>
              </Select>
            </Field>
            <ActivityCoreFields
              idPrefix="event"
              nameLabel={t('page.eventModal.fields.eventNameRequired')} dateLabel={t('page.eventModal.fields.dateRequired')}
              startTimeLabel={t('domain.activity.fields.startTime')} endDateLabel={t('domain.activity.fields.endDate')}
              endTimeLabel={t('domain.activity.fields.endTime')} locationLabel={t('domain.activity.fields.location')}
              name={name} date={date} startTime={startTime} endDate={endDate} endTime={endTime} location={location}
              autoFocusName showSchedule={false}
              onNameChange={setName} onDateChange={setDate} onStartTimeChange={setStartTime}
              onEndDateChange={setEndDate} onEndTimeChange={setEndTime} onLocationChange={setLocation}
            />
            {config.showOpponent && <Field label={t('domain.activity.fields.opponent')} htmlFor="activity-opponent">
              <Input id="activity-opponent" type="text" value={opponentName} onChange={(event) => setOpponentName(event.target.value)} />
            </Field>}
            {config.showMatchFormat && <Field label={t('domain.activity.fields.matchFormat')} htmlFor="activity-format">
              <Select id="activity-format" value={matchFormatId} onChange={(event) => setMatchFormatId(event.target.value)}>
                <option value="">{t('domain.activity.fields.noMatchFormat')}</option>
                {matchFormats.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}
              </Select>
            </Field>}
            {config.showTeamCount && <Field label={t('page.eventModal.fields.numberOfTeamsRequired')} htmlFor="activity-teams">
              <Input id="activity-teams" type="number" min={1} value={numberOfTeams} onChange={(event) => setNumberOfTeams(Math.max(1, Number(event.target.value) || 1))} required />
            </Field>}
            <ActivityCoreFields
              idPrefix="event" nameLabel="" dateLabel={t('page.eventModal.fields.dateRequired')}
              startTimeLabel={t('domain.activity.fields.startTime')} endDateLabel={t('domain.activity.fields.endDate')}
              endTimeLabel={t('domain.activity.fields.endTime')} locationLabel={t('domain.activity.fields.location')}
              name={name} date={date} startTime={startTime} endDate={endDate} endTime={endTime} location={location} showName={false}
              onNameChange={setName} onDateChange={setDate} onStartTimeChange={setStartTime}
              onEndDateChange={setEndDate} onEndTimeChange={setEndTime} onLocationChange={setLocation}
            />
            <ActivityPlayerLimitFields
              minLabel={t('page.eventModal.fields.minPlayersPerTeamRequired')} maxLabel={t('page.eventModal.fields.maxPlayersPerTeamRequired')}
              minPlayers={minPlayersPerTeam} maxPlayers={maxPlayersPerTeam} minimumAllowed={1} minId="min-players" maxId="max-players"
              onMinChange={setMinPlayersPerTeam} onMaxChange={setMaxPlayersPerTeam}
            />
            <Split gap="sm">
              <span className="body-muted" data-testid="add-event-invited-count">{t('page.invitePlayers.selectedCount', { count: invitedPlayerIds.length })}</span>
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsInviteOpen(true)}>{t('page.eventModal.invitePlayersAction')}</Button>
            </Split>
            {error && <Alert>{error}</Alert>}
          </Stack>
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
