import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities } from '../hooks/useActivities';
import ActivitiesList from '../components/ActivitiesList';
import AddActivityModal from '../components/AddActivityModal';
import { Alert, Button, Cluster, EmptyState, Page, PageActions, PageDescription, PageHeader, PageHeaderContent, PageTitle, Panel, PanelHeader, PanelTitle, Stack } from '../components/ui';
import { selectActivitiesOfKinds, selectPastActivities, selectUpcomingActivities } from '../store/selectors/activitySelectors';
import { usePlayers, useSquad, useTrainers } from '../store';
import { useAuth } from '../hooks/useAuth';
import { canAccessRestrictedManagement } from '../utils/permissions';
import { selectIsSpondLinked } from '../store/selectors/squadSettingsSelectors';
import SpondBadge from '../components/SpondBadge';
import SpondSyncResultBanner from '../components/SpondSyncResultBanner';
import { selectActivityCardSummary } from '../store/selectors/activityViewSelectors';

export default function ActivitiesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activities, loading, error, addActivity } = useActivities();
  const squad = useSquad();
  const { trainers } = useTrainers();
  const { players } = usePlayers();
  const { user } = useAuth();
  const spondLinked = selectIsSpondLinked(squad);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canSyncSpond = useMemo(() => canAccessRestrictedManagement(user, { squad, trainers }), [user, squad, trainers]);
  const teamActivities = selectActivitiesOfKinds(activities, ['match', 'tournament']);
  const futureActivities = selectUpcomingActivities(teamActivities);
  const pastActivities = selectPastActivities(teamActivities);
  const futureSummaries = new Map(futureActivities.map((activity) => [activity.id, selectActivityCardSummary(activity, trainers, players)]));
  const pastSummaries = new Map(pastActivities.map((activity) => [activity.id, selectActivityCardSummary(activity, trainers, players)]));

  if (loading) {
    return <Page><EmptyState><p>{t('page.activities.loading')}</p></EmptyState></Page>;
  }

  return (
    <Page>
      <PageHeader align="start">
        <PageHeaderContent>
          <PageTitle>{t('page.activities.title')}</PageTitle>
          <PageDescription>{t('page.activities.subtitle')}</PageDescription>
        </PageHeaderContent>
        <PageActions>
          {canSyncSpond && spondLinked && (
            <Button variant="secondary" size="sm" onClick={() => navigate('/spond-import?scope=events')}>
              <Cluster gap="sm" wrap={false}><SpondBadge />{t('spondSync.syncAction')}</Cluster>
            </Button>
          )}
          {!spondLinked && <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>{t('common.actions.add')}</Button>}
        </PageActions>
      </PageHeader>

      <Stack gap="lg" data-page-section="events">
        <SpondSyncResultBanner />
        {error && <Alert>{error}</Alert>}
        <Panel>
          <PanelHeader><PanelTitle>{t('page.activities.futureTitle', { count: futureActivities.length })}</PanelTitle></PanelHeader>
          <ActivitiesList activities={futureActivities} summaries={futureSummaries} onOpenActivity={(activityId) => navigate(`/activities/${activityId}`)} onOpenTeam={(activityId, teamId) => navigate(`/activities/${activityId}/teams/${teamId}`)} />
        </Panel>
        {pastActivities.length > 0 && (
          <Panel>
            <PanelHeader><PanelTitle>{t('page.activities.pastTitle', { count: pastActivities.length })}</PanelTitle></PanelHeader>
          <ActivitiesList activities={pastActivities} summaries={pastSummaries} onOpenActivity={(activityId) => navigate(`/activities/${activityId}`)} onOpenTeam={(activityId, teamId) => navigate(`/activities/${activityId}/teams/${teamId}`)} />
          </Panel>
        )}
      </Stack>
      {!spondLinked && <AddActivityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addActivity} />}
    </Page>
  );
}
