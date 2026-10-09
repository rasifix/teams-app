import type { Activity, InvitationStatus } from '../types';
import { useTranslation } from 'react-i18next';
import { selectActivityCardSummary } from '../store/selectors/activityViewSelectors';
import { DateColumn } from './ui';

interface EventCardProps {
  activity: Activity;
  onClick?: (activityId: string) => void;
}

const invitationStatuses: InvitationStatus[] = ['accepted', 'open', 'declined', 'injured', 'sick', 'unavailable'];

export default function EventCard({ activity, onClick }: EventCardProps) {
  const { t } = useTranslation();
  const summary = selectActivityCardSummary(activity);

  return <button type="button" onClick={() => onClick?.(activity.id)} className="w-full cursor-pointer rounded-lg border border-gray-200 p-4 text-left transition-all hover:shadow-md">
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
            <p>{t('events.teamCount', { count: summary.teamCount })}</p>
            {activity.invitations.length > 0 && <div className="flex flex-wrap items-center gap-3 pt-1" aria-label={t('events.invitationCounts')}>
              {invitationStatuses.map((status) => <span key={status} title={t(`invitationStatus.${status}`)}>{t(`invitationStatus.${status}`)}: {summary.invitationStatusCounts[status]}</span>)}
              <span title={t('events.playersAssignedToTeams')}>✓ {summary.selectedPlayerCount}</span>
              {summary.invitationCounts.declined > 0 && <span>{t('activity.declinedCount', { count: summary.invitationCounts.declined })}</span>}
            </div>}
          </div>
        </div>
        <div className="ml-4 hidden sm:block">{summary.allTeamsMeetMinimum ? <span className="text-green-600">✓</span> : <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">{t('common.states.pending')}</span>}</div>
      </div>
    </div>
  </button>;
}
