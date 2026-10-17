import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import AddSquadModal from '../components/AddSquadModal';
import UpcomingEventCard from '../components/UpcomingEventCard';
import { useSquad, useSquads, useSquadsError, useSquadsLoading, useStore } from '../store/useStore';
import { useActivities } from '../hooks/useActivities';
import { selectUpcomingEvents } from '../store/selectors/homeSelectors';
import type { CreateSquadRequest } from '../types';
import { Alert, Button, ChevronRightIcon, EmptyState, Page, PageActions, PageDescription, PageHeader, PageHeaderContent, PageTitle } from '../components/ui';

const featureIcons = [
  <svg key="members" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 19.25v-1.5A3.75 3.75 0 0 0 12.25 14h-5.5A3.75 3.75 0 0 0 3 17.75v1.5M9.5 10.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM16 10.5l1.5 1.5L21 8.5" />
  </svg>,
  <svg key="events" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 3v3M17.5 3v3M4 9h16M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 15 2 2 4-5" />
  </svg>,
  <svg key="statistics" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10m6 10V4m6 16v-7m4 7H2" />
  </svg>,
];

export default function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { addSquad, configureSquadCategory, selectSquad, initializeApp, loadSquads } = useStore();
  const squad = useSquad();
  const squads = useSquads();
  const squadsLoading = useSquadsLoading();
  const squadsError = useSquadsError();
  const { activities } = useActivities();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [switchingSquadId, setSwitchingSquadId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const upcomingEvents = selectUpcomingEvents(activities, new Date(), 5);

  useEffect(() => {
    if (isAuthenticated) loadSquads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleCreateSquad = async (squadData: CreateSquadRequest) => {
    setIsSubmitting(true);
    setCreateError(null);
    try {
      const newSquad = await addSquad(squadData);
      if (!newSquad) {
        setCreateError(useStore.getState().errors.squads || t('squads.errors.createFailed'));
        return;
      }
      await selectSquad(newSquad.id);
      await initializeApp();
      if (squadData.category) await configureSquadCategory(squadData.category);
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSquadSwitch = async (squadId: string) => {
    if (squad?.id === squadId || switchingSquadId) return;
    setSwitchingSquadId(squadId);
    try {
      await selectSquad(squadId);
      await initializeApp();
    } finally {
      setSwitchingSquadId(null);
    }
  };

  const features = [
    { title: t('home.cards.membersTitle'), description: t('home.cards.membersDescription') },
    { title: t('home.cards.eventsTitle'), description: t('home.cards.eventsDescription') },
    { title: t('home.cards.statisticsTitle'), description: t('home.cards.statisticsDescription') },
  ];

  return (
    <Page>
      <PageHeader className="border-b border-edge pb-7">
        <PageHeaderContent>
          <PageTitle>
            {t(isAuthenticated ? 'home.overviewTitle' : 'home.publicTitle')}
          </PageTitle>
          <PageDescription>
            {t(isAuthenticated ? 'home.overviewSubtitle' : 'home.publicSubtitle')}
          </PageDescription>
        </PageHeaderContent>
        {!isAuthenticated && (
          <PageActions>
            <Link to="/login" className="inline-flex h-10 items-center justify-center rounded-full border border-edge bg-surface px-5 text-sm font-semibold text-content shadow-sm transition hover:border-edge-strong hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand">
              {t('auth.login')}
            </Link>
            <Link to="/login?register=true" className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-content-inverse shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
              {t('auth.register')}
            </Link>
          </PageActions>
        )}
      </PageHeader>

      {!isAuthenticated ? (
        <section className="grid gap-4 py-7 sm:grid-cols-3 sm:py-8" aria-label={t('home.featuresLabel')}>
          {features.map((feature, index) => (
            <article key={feature.title} className="group rounded-3xl border border-edge bg-surface p-6 shadow-md transition duration-300 hover:-translate-y-1 hover:border-brand-border hover:shadow-lg">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-subtle text-brand-text transition group-hover:bg-brand group-hover:text-content-inverse">
                <span className="icon-md">{featureIcons[index]}</span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-content-strong">{feature.title}</h2>
              <p className="supporting-text">{feature.description}</p>
            </article>
          ))}
        </section>
      ) : (
        <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)] lg:py-10">
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-label text-brand-text">{t('home.scheduleLabel')}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-content-strong">{t('home.upcomingEvents.title')}</h2>
              </div>
              <Link to="/events" className="text-link">
                {t('home.upcomingEvents.viewAll')}
                <ChevronRightIcon className="icon-xs" />
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <EmptyState>{t('home.upcomingEvents.empty')}</EmptyState>
            ) : (
              <div className="layout-stack layout-stack--sm">{upcomingEvents.map((event) => <UpcomingEventCard key={event.id} event={event} />)}</div>
            )}
          </section>

          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-label text-brand-text">{t('home.manageLabel')}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-content-strong">{t('squads.title')}</h2>
              </div>
              <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(true)}>
                <span className="text-lg leading-none" aria-hidden="true">+</span> {t('squads.createNew')}
              </Button>
            </div>

            {squadsLoading && <div className="rounded-3xl border border-edge bg-surface p-6 text-content-muted shadow-sm">{t('squads.loading')}</div>}
            {!squadsLoading && squadsError && <Alert>{t('squads.errors.loadFailedWithReason', { error: squadsError })}</Alert>}
            {!squadsLoading && !squadsError && (
              <div className="grid grid-cols-1 gap-3">
                {squads.map((squadItem) => {
                  const isCurrentSquad = squad?.id === squadItem.id;
                  const isSwitching = switchingSquadId === squadItem.id;
                  return (
                    <button
                      type="button"
                      data-ui-control="composite"
                      onClick={() => handleSquadSwitch(squadItem.id)}
                      disabled={isCurrentSquad || !!switchingSquadId}
                      key={squadItem.id}
                      className={`group relative flex items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left transition duration-300 focus:outline-none focus:ring-2 focus:ring-brand ${isCurrentSquad ? 'border-edge-strong bg-control-strong text-content-inverse shadow-lg' : 'border-edge bg-surface text-content-strong hover:-translate-y-0.5 hover:border-brand-border hover:shadow-lg'}`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isCurrentSquad ? 'bg-inverse-overlay/10 text-brand-inverse' : 'bg-brand-subtle text-brand-text'}`}>
                        <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.5 19a5 5 0 0 1 10 0M13 19a4 4 0 0 1 8 0" />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold tracking-tight">{squadItem.name}</p>
                        <div className={`mt-0.5 flex flex-wrap gap-x-3 text-sm ${isCurrentSquad ? 'text-content-disabled' : 'text-content-subtle'}`}>
                          {squadItem.club && <span>{t('squads.clubLabel', { club: squadItem.club })}</span>}
                          {squadItem.category && <span>{t('squads.categoryLabel', { category: squadItem.category })}</span>}
                        </div>
                        {isSwitching && <p className="mt-1 text-xs text-content-subtle">{t('squads.switching')}</p>}
                      </div>
                      {isCurrentSquad && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand shadow-brand-halo" />}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      <AddSquadModal isOpen={isAddModalOpen} isSubmitting={isSubmitting} error={createError} onClose={() => { setCreateError(null); setIsAddModalOpen(false); }} onSave={handleCreateSquad} />
    </Page>
  );
}
