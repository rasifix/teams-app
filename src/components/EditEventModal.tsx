import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSquadMatchFormats } from '../store';
import { selectActivityFormConfiguration } from '../store/selectors/activityFormSelectors';
import { getActivityDate, getActivityTime, toStartsAt } from '../store/selectors/activitySelectors';
import type { Activity, ActivityPayload } from '../types';
import Button from './ui/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';

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
  const [name, setName] = useState(currentActivity.name);
  const [date, setDate] = useState(getActivityDate(currentActivity));
  const [startTime, setStartTime] = useState(getActivityTime(currentActivity));
  const [location, setLocation] = useState(currentActivity.location ?? '');
  const [opponentName, setOpponentName] = useState(currentActivity.opponentName ?? '');
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(currentActivity.maxPlayersPerTeam ?? 9);
  const [minPlayersPerTeam, setMinPlayersPerTeam] = useState(currentActivity.minPlayersPerTeam ?? 6);
  const [matchFormatId, setMatchFormatId] = useState(currentActivity.matchFormatId ?? '');
  const [error, setError] = useState<string | null>(null);
  const config = selectActivityFormConfiguration(currentActivity.kind, matchFormats, matchFormatId);
  const isSpondManaged = Boolean(currentActivity.spondId);

  useEffect(() => {
    if (!isOpen) return;
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
      ...(isSpondManaged ? {} : {
        name: name.trim(),
        startsAt: toStartsAt(date, startTime),
        location: location.trim() || undefined,
      }),
      opponentName: currentActivity.kind === 'match' ? opponentName.trim() || undefined : undefined,
      matchFormatId: currentActivity.kind === 'match' ? matchFormatId || null : undefined,
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
          <div className="space-y-4">
            {isSpondManaged && <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">{t('spondSync.managedFields')}</div>}
            <div><label htmlFor="edit-event-name" className="form-label">{t('eventModal.fields.eventName')}</label><input id="edit-event-name" value={name} onChange={(event) => setName(event.target.value)} required className="form-input" disabled={isSpondManaged} /></div>
            {config.showOpponent && <div><label htmlFor="edit-opponent" className="form-label">{t('activity.fields.opponent')}</label><input id="edit-opponent" value={opponentName} onChange={(event) => setOpponentName(event.target.value)} className="form-input" /></div>}
            {config.showMatchFormat && <div><label htmlFor="edit-format" className="form-label">{t('activity.fields.matchFormat')}</label><select id="edit-format" value={matchFormatId} onChange={(event) => { const nextId = event.target.value; setMatchFormatId(nextId); const nextConfig = selectActivityFormConfiguration(currentActivity.kind, matchFormats, nextId); if (nextConfig.defaultLimits) { setMinPlayersPerTeam(nextConfig.defaultLimits.minPlayersPerTeam); setMaxPlayersPerTeam(nextConfig.defaultLimits.maxPlayersPerTeam); } }} className="form-input"><option value="">{t('eventModal.fields.noMatchFormat')}</option>{matchFormats.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}</select></div>}
            <div><label htmlFor="edit-event-date" className="form-label">{t('eventModal.fields.date')}</label><input id="edit-event-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="form-input" disabled={isSpondManaged} /></div>
            <div><label htmlFor="edit-event-time" className="form-label">{t('activity.fields.startTime')}</label><input id="edit-event-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required className="form-input" disabled={isSpondManaged} /></div>
            <div><label htmlFor="edit-event-location" className="form-label">{t('eventModal.fields.location')}</label><input id="edit-event-location" value={location} onChange={(event) => setLocation(event.target.value)} className="form-input" disabled={isSpondManaged} /></div>
            <div><label htmlFor="edit-max-players" className="form-label">{t('eventModal.fields.maxPlayersPerTeam')}</label><input id="edit-max-players" type="number" min={Math.max(minMaxPlayers, 1)} value={maxPlayersPerTeam} onChange={(event) => setMaxPlayersPerTeam(Number(event.target.value) || 1)} required className="form-input" /></div>
            <div><label htmlFor="edit-min-players" className="form-label">{t('eventModal.fields.minPlayersPerTeam')}</label><input id="edit-min-players" type="number" min={1} max={maxPlayersPerTeam} value={minPlayersPerTeam} onChange={(event) => setMinPlayersPerTeam(Number(event.target.value) || 1)} required className="form-input" /></div>
            {error && <div role="alert" className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
          </div>
        </ModalBody>
        <ModalFooter><Button type="button" variant="secondary" onClick={onClose}>{t('common.actions.cancel')}</Button><Button type="submit" variant="primary">{t('common.actions.save')}</Button></ModalFooter>
      </form>
    </Modal>
  );
}
