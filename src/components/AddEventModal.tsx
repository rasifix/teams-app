import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatchPlanning } from '../store';
import { selectDefaultPlayingMode } from '../store/selectors/matchPlanningSelectors';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: { name: string; date: string; startTime: string; numberOfTeams: number; maxPlayersPerTeam: number; minPlayersPerTeam: number; location?: string; playingModeId?: string | null }) => void;
}

export default function AddEventModal({ isOpen, onClose, onAdd }: AddEventModalProps) {
  const { t } = useTranslation();
  const { matchPlanningEnabled, playingModes } = useMatchPlanning();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('');
  const [numberOfTeams, setNumberOfTeams] = useState(1);
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(9);
  const [minPlayersPerTeam, setMinPlayersPerTeam] = useState(6);
  const defaultPlayingMode = selectDefaultPlayingMode(playingModes);
  const [playingModeId, setPlayingModeId] = useState<string>(defaultPlayingMode?.id ?? '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submittedPlayingModeId = new FormData(e.currentTarget).get('playingModeId');
    
    if (!name.trim() || !date || !startTime) {
      return;
    }

    onAdd({
      name: name.trim(),
      date,
      startTime,
      numberOfTeams,
      maxPlayersPerTeam,
      minPlayersPerTeam,
      location: location.trim() || undefined,
      playingModeId: matchPlanningEnabled
        ? (typeof submittedPlayingModeId === 'string' && submittedPlayingModeId ? submittedPlayingModeId : null)
        : undefined,
    });

    // Reset form
    setName('');
    setDate('');
    setStartTime('');
    setLocation('');
    setNumberOfTeams(1);
    setMaxPlayersPerTeam(9);
    setMinPlayersPerTeam(6);
    setPlayingModeId(defaultPlayingMode?.id ?? '');
    onClose();
  };

  const handleClose = () => {
    // Reset form
    setName('');
    setDate('');
    setStartTime('');
    setLocation('');
    setNumberOfTeams(1);
    setMaxPlayersPerTeam(9);
    setMinPlayersPerTeam(6);
    setPlayingModeId(defaultPlayingMode?.id ?? '');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('eventModal.addTitle')}</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('eventModal.fields.eventNameRequired')}
                </label>
                <input
                  id="event-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t('eventModal.placeholders.eventName')}
                  required
                />
              </div>

              <div>
                <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('eventModal.fields.dateRequired')}
                </label>
                <input
                  id="event-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="event-time" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('eventModal.fields.startTimeRequired')}
                </label>
                <input
                  id="event-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('eventModal.fields.location')}
                </label>
                <input
                  id="event-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t('eventModal.placeholders.location')}
                />
              </div>

              <div>
                <label htmlFor="num-teams" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('eventModal.fields.numberOfTeamsRequired')}
                </label>
                <input
                  id="num-teams"
                  type="number"
                  min="1"
                  max="10"
                  value={numberOfTeams}
                  onChange={(e) => setNumberOfTeams(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="max-players" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('eventModal.fields.maxPlayersPerTeamRequired')}
                </label>
                <input
                  id="max-players"
                  type="number"
                  min="1"
                  max="20"
                  value={maxPlayersPerTeam}
                  onChange={(e) => setMaxPlayersPerTeam(parseInt(e.target.value) || 11)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="min-players" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('eventModal.fields.minPlayersPerTeamRequired')}
                </label>
                <input
                  id="min-players"
                  type="number"
                  min="1"
                  max={maxPlayersPerTeam}
                  value={minPlayersPerTeam}
                  onChange={(e) => setMinPlayersPerTeam(parseInt(e.target.value) || 7)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {matchPlanningEnabled && (
                <div>
                  <label htmlFor="event-playing-mode" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('eventModal.fields.playingMode')}
                  </label>
                  <select
                    id="event-playing-mode"
                    name="playingModeId"
                    value={playingModeId}
                    onChange={(e) => setPlayingModeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">{t('eventModal.fields.noPlayingMode')}</option>
                    {playingModes.map((mode) => (
                      <option key={mode.id} value={mode.id}>{mode.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                {t('common.actions.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                {t('eventModal.createAction')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
