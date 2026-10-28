import type { Activity } from '../types';
import type { ActivityCardSummary } from '../store/selectors/activityViewSelectors';
import { useTranslation } from 'react-i18next';
import { Badge, ChevronRightIcon, Cluster, DateColumn, EntityContent, EntityMeta, EntityTitle, IconButton } from './ui';
import Strength from './Strength';

interface ActivityCardProps {
  activity: Activity;
  summary: ActivityCardSummary;
  onOpenActivity: (activityId: string) => void;
  onOpenTeam: (activityId: string, teamId: string) => void;
}

export default function ActivityCard({ activity, summary, onOpenActivity, onOpenTeam }: ActivityCardProps) {
  const { t } = useTranslation();

  return <article className="card card--interactive activity-card">
    <button type="button" data-ui-control="composite" onClick={() => onOpenActivity(activity.id)} className="activity-card-main">
      <div className="activity-card-layout">
        <DateColumn date={summary.date} />
        <EntityContent>
          <Cluster gap="sm">
            <EntityTitle>{activity.name}</EntityTitle>
            <Badge tone="brand" size="sm">{t(`domain.activity.kinds.${activity.kind}`)}</Badge>
          </Cluster>
          <EntityMeta>
            {activity.location && <span data-activity-field="location">{activity.location}</span>}
            {activity.kind === 'match' && activity.opponentName && <span>{t('domain.activity.fields.opponent')}: {activity.opponentName}</span>}
          </EntityMeta>
          <Cluster gap="sm" aria-label={t('page.activities.invitationCounts')}>
            <Badge tone="success" size="sm" title={t('domain.invitation.status.accepted')}>✓ {summary.invitationCounts.accepted}</Badge>
            <Badge tone="warning" size="sm" title={t('domain.invitation.status.open')}>? {summary.invitationCounts.open}</Badge>
            <Badge tone="danger" size="sm" title={t('domain.invitation.status.declined')}>× {summary.invitationCounts.declined}</Badge>
            <Badge size="sm" title={t('page.activities.playersAssignedToTeams')}>● {summary.selectedPlayerCount}</Badge>
          </Cluster>
        </EntityContent>
        <div className="activity-card-status">
          {summary.allTeamsMeetMinimum
            ? <span className="text-status-success" title={t('page.activities.teamsReady')}>✓</span>
            : <span className="activity-card-pending"><Badge tone="warning" size="sm">{t('common.states.pending')}</Badge></span>}
          <ChevronRightIcon className="ui-action-card__chevron" />
        </div>
      </div>
    </button>
    {summary.teams.map((team) => {
      const hasDifferentLocation = team.location && team.location !== activity.location;
      return <section key={team.id} aria-label={t('page.activities.teamCardLabel', { team: team.name })} className="activity-card-team">
        <EntityMeta className="activity-card-team-meta">
          <span className="text-number">{team.startTime || summary.startTime}</span>
          <Strength level={team.strength} className="activity-card-team-strength" />
          <span data-team-field="name" title={team.name}>{team.name}</span>
          <span data-team-field="count" title={t('page.activities.playersAssignedToTeams')}>{team.selectedPlayerCount} <span aria-hidden="true">●</span></span>
          {hasDifferentLocation && <span data-team-field="location" title={team.location}>{team.location}</span>}
          {team.responsiblePeople.length > 0 && <span data-team-field="people" title={team.responsiblePeople.map((person) => `${person.firstName} ${person.lastName}`).join(', ')}>
            {team.responsiblePeople.map((person) => `${person.firstName} ${person.lastName}`).join(', ')}
          </span>}
          <IconButton size="sm" label={t('page.activities.openTeamDetails', { team: team.name })} onClick={() => onOpenTeam(activity.id, team.id)}>
            <ChevronRightIcon className="icon-sm" />
          </IconButton>
        </EntityMeta>
      </section>;
    })}
  </article>;
}
