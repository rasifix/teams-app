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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {t(isAuthenticated ? 'home.overviewTitle' : 'home.publicTitle')}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            {t(isAuthenticated ? 'home.overviewSubtitle' : 'home.publicSubtitle')}
          </p>
        </div>
        {!isAuthenticated && (
          <div className="flex gap-2">
            <Link to="/login" className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400">
              {t('auth.login')}
            </Link>
            <Link to="/login?register=true" className="inline-flex h-10 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2">
              {t('auth.register')}
            </Link>
          </div>
        )}
      </header>

      {!isAuthenticated ? (
        <section className="grid gap-4 py-7 sm:grid-cols-3 sm:py-8" aria-label={t('home.featuresLabel')}>
          {features.map((feature, index) => (
            <article key={feature.title} className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_16px_40px_-30px_rgba(15,29,38,0.4)] transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_24px_50px_-28px_rgba(15,29,38,0.35)]">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
                <span className="h-6 w-6">{featureIcons[index]}</span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </section>
      ) : (
        <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)] lg:py-10">
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">{t('home.manageLabel')}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{t('squads.title')}</h2>
              </div>
              <button type="button" onClick={() => setIsAddModalOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-orange-300 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                <span className="text-lg leading-none" aria-hidden="true">+</span> {t('squads.createNew')}
              </button>
            </div>

            {squadsLoading && <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">{t('squads.loading')}</div>}
            {!squadsLoading && squadsError && <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">{t('squads.errors.loadFailedWithReason', { error: squadsError })}</div>}
            {!squadsLoading && !squadsError && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {squads.map((squadItem) => {
                  const isCurrentSquad = squad?.id === squadItem.id;
                  const isSwitching = switchingSquadId === squadItem.id;
                  return (
                    <button
                      type="button"
                      onClick={() => handleSquadSwitch(squadItem.id)}
                      disabled={isCurrentSquad || !!switchingSquadId}
                      key={squadItem.id}
                      className={`group relative flex items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left transition duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400 ${isCurrentSquad ? 'border-[#13212b] bg-[#13212b] text-white shadow-[0_18px_38px_-24px_rgba(15,29,38,.7)]' : 'border-slate-200 bg-white text-slate-950 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg'}`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isCurrentSquad ? 'bg-white/10 text-orange-300' : 'bg-orange-50 text-orange-600'}`}>
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.5 19a5 5 0 0 1 10 0M13 19a4 4 0 0 1 8 0" />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold tracking-tight">{squadItem.name}</p>
                        <div className={`mt-0.5 flex flex-wrap gap-x-3 text-sm ${isCurrentSquad ? 'text-slate-300' : 'text-slate-500'}`}>
                          {squadItem.club && <span>{t('squads.clubLabel', { club: squadItem.club })}</span>}
                          {squadItem.category && <span>{t('squads.categoryLabel', { category: squadItem.category })}</span>}
                        </div>
                        {isSwitching && <p className="mt-1 text-xs text-slate-500">{t('squads.switching')}</p>}
                      </div>
                      {isCurrentSquad && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-400 shadow-[0_0_0_4px_rgba(255,140,46,.14)]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">{t('home.scheduleLabel')}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{t('home.upcomingEvents.title')}</h2>
              </div>
              <Link to="/events" className="text-sm font-semibold text-slate-600 transition hover:text-orange-700">{t('home.upcomingEvents.viewAll')} <span aria-hidden="true">→</span></Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">{t('home.upcomingEvents.empty')}</div>
            ) : (
              <div className="space-y-3">{upcomingEvents.map((event) => <UpcomingEventCard key={event.id} event={event} />)}</div>
            )}
          </section>
        </div>
      )}

      <AddSquadModal isOpen={isAddModalOpen} isSubmitting={isSubmitting} error={createError} onClose={() => { setCreateError(null); setIsAddModalOpen(false); }} onSave={handleCreateSquad} />
    </div>
  );
}
