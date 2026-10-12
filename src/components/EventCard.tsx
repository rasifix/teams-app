import type { Activity } from '../types';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { selectActivityCardSummary } from '../store/selectors/activityViewSelectors';
import { usePlayers, useTrainers } from '../store';
import { DateColumn } from './ui';
import Strength from './Strength';

interface EventCardProps {
  activity: Activity;
  onClick?: (activityId: string) => void;
}

export default function EventCard({ activity, onClick }: EventCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { players } = usePlayers();
  const { trainers } = useTrainers();
  const summary = selectActivityCardSummary(activity, trainers, players);

  return <article className="w-full overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md">
    <button type="button" onClick={() => onClick?.(activity.id)} className="w-full cursor-pointer p-4 text-left">
      <div className="flex items-start gap-4">
        <DateColumn date={summary.date} />
        <div className="flex flex-1 items-start justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-md font-semibold text-gray-900">{activity.name}</h3>
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">{t(`activity.kinds.${activity.kind}`)}</span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>🕐 {summary.startTime}{activity.location ? ` · 📍 ${activity.location}` : ''}</p>
              {activity.kind === 'match' && activity.opponentName && <p>{t('activity.fields.opponent')}: {activity.opponentName}</p>}
              <div className="flex flex-wrap items-center gap-3 pt-1" aria-label={t('events.invitationCounts')}>
                <span className="text-blue-600" title={t('invitationStatus.accepted')}>✓ {summary.invitationCounts.accepted}</span>
                <span className="text-amber-600" title={t('invitationStatus.open')}>? {summary.invitationCounts.open}</span>
                <span className="text-red-600" title={t('invitationStatus.declined')}>× {summary.invitationCounts.declined}</span>
                <span title={t('events.playersAssignedToTeams')}>✓ {summary.selectedPlayerCount}</span>
              </div>
            </div>
          </div>
          <div className="ml-4 hidden sm:block">{summary.allTeamsMeetMinimum ? <span className="text-green-600">✓</span> : <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">{t('common.states.pending')}</span>}</div>
        </div>
      </div>
    </button>
    {summary.teams.map((team) => {
      const hasDifferentTime = team.startTime && team.startTime !== summary.startTime;
      const hasDifferentLocation = team.location && team.location !== activity.location;

      return <section key={team.id} aria-label={t('events.teamCardLabel', { team: team.name })} className="border-t border-gray-100 px-4 py-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-gray-600">
          {hasDifferentTime && <span>🕐 {team.startTime}</span>}
          <button
            type="button"
            onClick={() => navigate(`/events/${activity.id}/teams/${team.id}`)}
            aria-label={t('events.openTeamDetails', { team: team.name })}
            className="font-medium text-gray-800 hover:text-blue-700"
          >
            {team.name}
          </button>
          <span>👥 {team.selectedPlayerCount}</span>
          <Strength level={team.strength} className="text-xs" />
          {hasDifferentLocation && <span>📍 {team.location}</span>}
          {team.responsiblePeople.length > 0 && <span className="text-blue-600">
            👤 {team.responsiblePeople.map((person) => person.firstName + ' ' + person.lastName).join(', ')}
          </span>}
        </div>
      </section>;
    })}
  </article>;
}
