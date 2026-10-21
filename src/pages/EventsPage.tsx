import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities } from '../hooks/useActivities';
import EventsList from '../components/EventsList';
import AddEventModal from '../components/AddEventModal';
import { Alert, Button, Cluster, EmptyState, Page, PageActions, PageDescription, PageHeader, PageHeaderContent, PageTitle, Panel, PanelHeader, PanelTitle, Stack } from '../components/ui';
import { selectActivitiesOfKinds, selectPastActivities, selectUpcomingActivities } from '../store/selectors/activitySelectors';
import { useSquad, useTrainers } from '../store';
import { useAuth } from '../hooks/useAuth';
import { canAccessRestrictedManagement } from '../utils/permissions';
import { selectIsSpondLinked } from '../store/selectors/squadSettingsSelectors';
import SpondBadge from '../components/SpondBadge';
import SpondSyncResultBanner from '../components/SpondSyncResultBanner';

export default function EventsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activities, loading, error, addActivity } = useActivities();
  const squad = useSquad();
  const { trainers } = useTrainers();
  const { user } = useAuth();
  const spondLinked = selectIsSpondLinked(squad);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canSyncSpond = useMemo(() => canAccessRestrictedManagement(user, { squad, trainers }), [user, squad, trainers]);
  const teamActivities = selectActivitiesOfKinds(activities, ['match', 'tournament']);
  const futureActivities = selectUpcomingActivities(teamActivities);
  const pastActivities = selectPastActivities(teamActivities);

  if (loading) {
    return <Page><EmptyState><p>{t('page.events.loading')}</p></EmptyState></Page>;
  }

  return (
    <Page>
      <PageHeader align="start">
        <PageHeaderContent>
          <PageTitle>{t('page.events.title')}</PageTitle>
          <PageDescription>{t('page.events.subtitle')}</PageDescription>
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
          <PanelHeader><PanelTitle>{t('page.events.futureTitle', { count: futureActivities.length })}</PanelTitle></PanelHeader>
          <EventsList activities={futureActivities} onActivityClick={(activityId) => navigate(`/activities/${activityId}`)} />
        </Panel>
        {pastActivities.length > 0 && (
          <Panel>
            <PanelHeader><PanelTitle>{t('page.events.pastTitle', { count: pastActivities.length })}</PanelTitle></PanelHeader>
          <EventsList activities={pastActivities} onActivityClick={(activityId) => navigate(`/activities/${activityId}`)} />
          </Panel>
        )}
      </Stack>
      {!spondLinked && <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addActivity} />}
    </Page>
  );
}
