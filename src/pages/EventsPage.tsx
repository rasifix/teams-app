import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities } from '../hooks/useActivities';
import EventsList from '../components/EventsList';
import AddEventModal from '../components/AddEventModal';
import { Card, CardBody, CardTitle } from '../components/ui';
import Button from '../components/ui/Button';
import { selectActivitiesOfKinds, selectPastActivities, selectUpcomingActivities } from '../store/selectors/activitySelectors';
import { useSquad, useTrainers } from '../store';
import { useAuth } from '../hooks/useAuth';
import { canAccessRestrictedManagement } from '../utils/permissions';
import { selectIsSpondLinked } from '../store/selectors/groupSettingsSelectors';
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
    return <div className="page-container"><div className="empty-state"><p>{t('events.loading')}</p></div></div>;
  }

  return (
    <div className="page-container lg:px-4 px-0">
      <SpondSyncResultBanner className="mb-4 mx-4 lg:mx-0" />
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 mx-4 lg:mx-0">{error}</div>}
      <div className="space-y-4 lg:space-y-6">
        <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
          <CardBody className="lg:p-6 p-4">
            <div className="mb-4 flex items-center justify-between">
              <CardTitle>{t('events.futureTitle', { count: futureActivities.length })}</CardTitle>
              <div className="flex gap-2">
                {canSyncSpond && spondLinked && <Button className="inline-flex items-center gap-1.5" variant="secondary" size="sm" onClick={() => navigate('/spond-import?scope=events')}><SpondBadge />{t('spondSync.syncAction')}</Button>}
                {!spondLinked && <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>{t('common.actions.add')}</Button>}
              </div>
            </div>
            <EventsList activities={futureActivities} onActivityClick={(activityId) => navigate(`/events/${activityId}`)} />
          </CardBody>
        </Card>
        {pastActivities.length > 0 && <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
          <CardBody className="lg:p-6 p-4">
            <CardTitle>{t('events.pastTitle', { count: pastActivities.length })}</CardTitle>
            <EventsList activities={pastActivities} onActivityClick={(activityId) => navigate(`/events/${activityId}`)} />
          </CardBody>
        </Card>}
      </div>
      {!spondLinked && <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addActivity} />}
    </div>
  );
}
