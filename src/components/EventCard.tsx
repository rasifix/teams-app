import type { Activity } from '../types';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { selectActivityCardSummary } from '../store/selectors/activityViewSelectors';
import { usePlayers, useTrainers } from '../store';
import { Badge, Button, ChevronRightIcon, Cluster, DateColumn, EntityContent, EntityMeta, EntityTitle } from './ui';
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

  return <article className="event-card">
    <button type="button" data-ui-control="composite" onClick={() => onClick?.(activity.id)} className="event-card-main">
      <div className="event-card-layout">
        <DateColumn date={summary.date} />
        <EntityContent>
          <Cluster gap="sm">
            <EntityTitle>{activity.name}</EntityTitle>
            <Badge tone="brand" size="sm">{t(`activity.kinds.${activity.kind}`)}</Badge>
          </Cluster>
          <EntityMeta>
            <span>{summary.startTime}</span>
            {activity.location && <span>{activity.location}</span>}
            {activity.kind === 'match' && activity.opponentName && <span>{t('activity.fields.opponent')}: {activity.opponentName}</span>}
          </EntityMeta>
          <Cluster gap="sm" className="event-card-counts" aria-label={t('events.invitationCounts')}>
            <Badge tone="success" size="sm" title={t('invitationStatus.accepted')}>✓ {summary.invitationCounts.accepted}</Badge>
            <Badge tone="warning" size="sm" title={t('invitationStatus.open')}>? {summary.invitationCounts.open}</Badge>
            <Badge tone="danger" size="sm" title={t('invitationStatus.declined')}>× {summary.invitationCounts.declined}</Badge>
            <Badge size="sm" title={t('events.playersAssignedToTeams')}>● {summary.selectedPlayerCount}</Badge>
          </Cluster>
        </EntityContent>
        <div className="event-card-status">
          {summary.allTeamsMeetMinimum
            ? <span className="event-card-ready" title={t('events.teamsReady')}>✓</span>
            : <span className="event-card-pending"><Badge tone="warning" size="sm">{t('common.states.pending')}</Badge></span>}
          <ChevronRightIcon className="event-card-chevron" />
        </div>
      </div>
    </button>
    {summary.teams.map((team) => {
      const hasDifferentLocation = team.location && team.location !== activity.location;

      return <section key={team.id} aria-label={t('events.teamCardLabel', { team: team.name })} className="event-card-team">
        <EntityMeta className="event-card-team-meta">
          <span className="event-card-team-time">{team.startTime || summary.startTime}</span>
          <Strength level={team.strength} className="event-card-team-strength" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-team-field="name"
            onClick={() => navigate(`/events/${activity.id}/teams/${team.id}`)}
            aria-label={t('events.openTeamDetails', { team: team.name })}
          >
            {team.name}
          </Button>
          <span data-team-field="count" title={t('events.playersAssignedToTeams')}>{team.selectedPlayerCount} <span aria-hidden="true">●</span></span>
          {hasDifferentLocation && <span data-team-field="location" title={team.location}>{team.location}</span>}
          {team.responsiblePeople.length > 0 && <span data-team-field="people" title={team.responsiblePeople.map((person) => person.firstName + ' ' + person.lastName).join(', ')}>
            {team.responsiblePeople.map((person) => person.firstName + ' ' + person.lastName).join(', ')}
          </span>}
        </EntityMeta>
      </section>;
    })}
  </article>;
}
