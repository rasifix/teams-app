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

  return <article className="group w-full overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:border-orange-200 hover:shadow-md">
    <button type="button" onClick={() => onClick?.(activity.id)} className="w-full cursor-pointer p-3 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 sm:p-4">
      <div className="flex items-start gap-3">
        <DateColumn date={summary.date} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold tracking-tight text-slate-900">{activity.name}</h3>
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">{t(`activity.kinds.${activity.kind}`)}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{summary.startTime}</span>
            {activity.location && <span>{activity.location}</span>}
            {activity.kind === 'match' && activity.opponentName && <span>{t('activity.fields.opponent')}: {activity.opponentName}</span>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label={t('events.invitationCounts')}>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700" title={t('invitationStatus.accepted')}>✓ {summary.invitationCounts.accepted}</span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700" title={t('invitationStatus.open')}>? {summary.invitationCounts.open}</span>
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700" title={t('invitationStatus.declined')}>× {summary.invitationCounts.declined}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600" title={t('events.playersAssignedToTeams')}>● {summary.selectedPlayerCount}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-1">
          {summary.allTeamsMeetMinimum
            ? <span className="text-sm font-semibold text-emerald-600" title={t('events.teamsReady')}>✓</span>
            : <span className="hidden rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 sm:inline-flex">{t('common.states.pending')}</span>}
          <svg className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-orange-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </button>
    {summary.teams.map((team) => {
      const hasDifferentLocation = team.location && team.location !== activity.location;

      return <section key={team.id} aria-label={t('events.teamCardLabel', { team: team.name })} className="border-t border-slate-100 bg-slate-50/60 px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="font-medium tabular-nums text-slate-700">{team.startTime || summary.startTime}</span>
          <button
            type="button"
            onClick={() => navigate(`/events/${activity.id}/teams/${team.id}`)}
            aria-label={t('events.openTeamDetails', { team: team.name })}
            className="font-semibold text-slate-900 hover:text-orange-700"
          >
            {team.name}
          </button>
          <span title={t('events.playersAssignedToTeams')}>{team.selectedPlayerCount} <span aria-hidden="true">●</span></span>
          <Strength level={team.strength} className="text-xs" />
          {hasDifferentLocation && <span>{team.location}</span>}
          {team.responsiblePeople.length > 0 && <span className="text-slate-600">
            {team.responsiblePeople.map((person) => person.firstName + ' ' + person.lastName).join(', ')}
          </span>}
        </div>
      </section>;
    })}
  </article>;
}
