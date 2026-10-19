import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSquadMatchFormats } from '../store';
import { selectActivityFormConfiguration } from '../store/selectors/activityFormSelectors';
import { getActivityDate, getActivityTime, toStartsAt } from '../store/selectors/activitySelectors';
import type { Activity, ActivityKind, ActivityPayload } from '../types';
import { Alert, Button, Field, Input, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Select, Stack } from './ui';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ActivityPayload>) => void;
  currentActivity: Activity;
  minMaxPlayers: number;
}

export default function EditEventModal({ isOpen, onClose, onSave, currentActivity, minMaxPlayers }: EditEventModalProps) {
  const { t } = useTranslation();
  const matchFormats = useSquadMatchFormats();
  const [kind, setKind] = useState<ActivityKind>(currentActivity.kind);
  const [name, setName] = useState(currentActivity.name);
  const [date, setDate] = useState(getActivityDate(currentActivity));
  const [startTime, setStartTime] = useState(getActivityTime(currentActivity));
  const [location, setLocation] = useState(currentActivity.location ?? '');
  const [opponentName, setOpponentName] = useState(currentActivity.opponentName ?? '');
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(currentActivity.maxPlayersPerTeam ?? 9);
  const [minPlayersPerTeam, setMinPlayersPerTeam] = useState(currentActivity.minPlayersPerTeam ?? 6);
  const [matchFormatId, setMatchFormatId] = useState(currentActivity.matchFormatId ?? '');
  const [error, setError] = useState<string | null>(null);
  const config = selectActivityFormConfiguration(kind, matchFormats, matchFormatId);
  const isSpondManaged = Boolean(currentActivity.spondId);
  const canChangeMatchType = !isSpondManaged
    && currentActivity.teams.length === 1
    && (currentActivity.kind === 'match' || currentActivity.kind === 'tournament');

  useEffect(() => {
    if (!isOpen) return;
    setKind(currentActivity.kind);
    setName(currentActivity.name);
    setDate(getActivityDate(currentActivity));
    setStartTime(getActivityTime(currentActivity));
    setLocation(currentActivity.location ?? '');
    setOpponentName(currentActivity.opponentName ?? '');
    setMaxPlayersPerTeam(currentActivity.maxPlayersPerTeam ?? 9);
    setMinPlayersPerTeam(currentActivity.minPlayersPerTeam ?? 6);
    setMatchFormatId(currentActivity.matchFormatId ?? '');
    setError(null);
  }, [isOpen, currentActivity]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !date || !startTime) return;
    if (maxPlayersPerTeam < minMaxPlayers || minPlayersPerTeam < 1 || minPlayersPerTeam > maxPlayersPerTeam) {
      setError(t('editEventModal.errors.minGreaterThanMax'));
      return;
    }
    onSave({
      ...(canChangeMatchType ? { kind } : {}),
      ...(isSpondManaged ? {} : {
        name: name.trim(),
        startsAt: toStartsAt(date, startTime),
        location: location.trim() || undefined,
      }),
      opponentName: kind === 'match' ? opponentName.trim() || undefined : undefined,
      matchFormatId: kind === 'match' ? matchFormatId || null : undefined,
      minPlayersPerTeam,
      maxPlayersPerTeam,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader><ModalTitle>{t('editEventModal.title')}</ModalTitle></ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <Stack>
            {isSpondManaged && <Alert tone="info">{t('spondSync.managedFields')}</Alert>}
            {canChangeMatchType && <Field label={t('activity.fields.kind')} htmlFor="edit-event-kind"><Select id="edit-event-kind" value={kind} onChange={(event) => { const nextKind = event.target.value as 'match' | 'tournament'; setKind(nextKind); if (nextKind === 'tournament') { setOpponentName(''); setMatchFormatId(''); } }}><option value="match">{t('activity.kinds.match')}</option><option value="tournament">{t('activity.kinds.tournament')}</option></Select></Field>}
            <Field label={t('eventModal.fields.eventName')} htmlFor="edit-event-name"><Input id="edit-event-name" value={name} onChange={(event) => setName(event.target.value)} required disabled={isSpondManaged} /></Field>
            {config.showOpponent && <Field label={t('activity.fields.opponent')} htmlFor="edit-opponent"><Input id="edit-opponent" value={opponentName} onChange={(event) => setOpponentName(event.target.value)} disabled={isSpondManaged} /></Field>}
            {config.showMatchFormat && <Field label={t('activity.fields.matchFormat')} htmlFor="edit-format"><Select id="edit-format" value={matchFormatId} onChange={(event) => { const nextId = event.target.value; setMatchFormatId(nextId); const nextConfig = selectActivityFormConfiguration(kind, matchFormats, nextId); if (nextConfig.defaultLimits) { setMinPlayersPerTeam(nextConfig.defaultLimits.minPlayersPerTeam); setMaxPlayersPerTeam(nextConfig.defaultLimits.maxPlayersPerTeam); } }}><option value="">{t('eventModal.fields.noMatchFormat')}</option>{matchFormats.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}</Select></Field>}
            <Field label={t('eventModal.fields.date')} htmlFor="edit-event-date"><Input id="edit-event-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required disabled={isSpondManaged} /></Field>
            <Field label={t('activity.fields.startTime')} htmlFor="edit-event-time"><Input id="edit-event-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required disabled={isSpondManaged} /></Field>
            <Field label={t('eventModal.fields.location')} htmlFor="edit-event-location"><Input id="edit-event-location" value={location} onChange={(event) => setLocation(event.target.value)} disabled={isSpondManaged} /></Field>
            <Field label={t('eventModal.fields.maxPlayersPerTeam')} htmlFor="edit-max-players"><Input id="edit-max-players" type="number" min={Math.max(minMaxPlayers, 1)} value={maxPlayersPerTeam} onChange={(event) => setMaxPlayersPerTeam(Number(event.target.value) || 1)} required /></Field>
            <Field label={t('eventModal.fields.minPlayersPerTeam')} htmlFor="edit-min-players"><Input id="edit-min-players" type="number" min={1} max={maxPlayersPerTeam} value={minPlayersPerTeam} onChange={(event) => setMinPlayersPerTeam(Number(event.target.value) || 1)} required /></Field>
            {error && <Alert>{error}</Alert>}
          </Stack>
        </ModalBody>
        <ModalFooter><Button type="button" variant="secondary" onClick={onClose}>{t('common.actions.cancel')}</Button><Button type="submit" variant="primary">{t('common.actions.save')}</Button></ModalFooter>
      </form>
    </Modal>
  );
}
