import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities } from '../hooks/useActivities';
import EventsList from '../components/EventsList';
import AddEventModal from '../components/AddEventModal';
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
    return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-500"><p>{t('events.loading')}</p></div></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t('events.title')}</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">{t('events.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSyncSpond && spondLinked && (
            <Button className="inline-flex items-center gap-1.5 !rounded-full !bg-slate-100 !text-slate-700 hover:!bg-slate-200" variant="secondary" size="sm" onClick={() => navigate('/spond-import?scope=events')}>
              <SpondBadge />{t('spondSync.syncAction')}
            </Button>
          )}
          {!spondLinked && <Button className="!rounded-full !bg-orange-500 hover:!bg-orange-600" variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>{t('common.actions.add')}</Button>}
        </div>
      </header>

      <SpondSyncResultBanner className="mb-4" />
      {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-slate-950">{t('events.futureTitle', { count: futureActivities.length })}</h2>
          <EventsList activities={futureActivities} onActivityClick={(activityId) => navigate(`/events/${activityId}`)} />
        </section>
        {pastActivities.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
            <h2 className="mb-5 text-xl font-semibold tracking-tight text-slate-950">{t('events.pastTitle', { count: pastActivities.length })}</h2>
            <EventsList activities={pastActivities} onActivityClick={(activityId) => navigate(`/events/${activityId}`)} />
          </section>
        )}
      </div>
      {!spondLinked && <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addActivity} />}
    </div>
  );
}
