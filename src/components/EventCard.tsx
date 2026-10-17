import type { Activity } from '../types';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { selectActivityCardSummary } from '../store/selectors/activityViewSelectors';
import { usePlayers, useTrainers } from '../store';
import { Badge, Button, DateColumn } from './ui';
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

  return <article className="group w-full overflow-hidden rounded-2xl border border-edge bg-surface transition duration-200 hover:border-brand-border hover:shadow-md">
    <button type="button" data-ui-control="composite" onClick={() => onClick?.(activity.id)} className="w-full cursor-pointer p-3 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand sm:p-4">
      <div className="flex items-start gap-3">
        <DateColumn date={summary.date} />
        <div className="min-w-0 flex-1">
          <div className="layout-cluster layout-cluster--wrap">
            <h3 className="truncate font-semibold tracking-tight text-content-strong">{activity.name}</h3>
            <Badge tone="brand" size="sm">{t(`activity.kinds.${activity.kind}`)}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-subtle">
            <span>{summary.startTime}</span>
            {activity.location && <span>{activity.location}</span>}
            {activity.kind === 'match' && activity.opponentName && <span>{t('activity.fields.opponent')}: {activity.opponentName}</span>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label={t('events.invitationCounts')}>
            <Badge tone="success" size="sm" title={t('invitationStatus.accepted')}>✓ {summary.invitationCounts.accepted}</Badge>
            <Badge tone="warning" size="sm" title={t('invitationStatus.open')}>? {summary.invitationCounts.open}</Badge>
            <Badge tone="danger" size="sm" title={t('invitationStatus.declined')}>× {summary.invitationCounts.declined}</Badge>
            <Badge size="sm" title={t('events.playersAssignedToTeams')}>● {summary.selectedPlayerCount}</Badge>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-1">
          {summary.allTeamsMeetMinimum
            ? <span className="text-sm font-semibold text-success" title={t('events.teamsReady')}>✓</span>
            : <span className="hidden sm:inline"><Badge tone="warning" size="sm">{t('common.states.pending')}</Badge></span>}
          <svg className="h-4 w-4 text-content-disabled transition group-hover:translate-x-0.5 group-hover:text-brand-text" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </button>
    {summary.teams.map((team) => {
      const hasDifferentLocation = team.location && team.location !== activity.location;

      return <section key={team.id} aria-label={t('events.teamCardLabel', { team: team.name })} className="border-t border-edge bg-surface-subtle px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-subtle">
          <span className="font-medium tabular-nums text-content">{team.startTime || summary.startTime}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/events/${activity.id}/teams/${team.id}`)}
            aria-label={t('events.openTeamDetails', { team: team.name })}
          >
            {team.name}
          </Button>
          <span title={t('events.playersAssignedToTeams')}>{team.selectedPlayerCount} <span aria-hidden="true">●</span></span>
          <Strength level={team.strength} className="text-xs" />
          {hasDifferentLocation && <span>{team.location}</span>}
          {team.responsiblePeople.length > 0 && <span className="text-content-muted">
            {team.responsiblePeople.map((person) => person.firstName + ' ' + person.lastName).join(', ')}
          </span>}
        </div>
      </section>;
    })}
  </article>;
}
