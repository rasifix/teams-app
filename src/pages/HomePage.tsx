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
import { AddCardButton, ActionCard, ActionCardTitle, Alert, ButtonLink, ChevronRightIcon, ContentGrid, EmptyState, EntityMeta, IconTile, Page, PageActions, PageDescription, PageHeader, PageHeaderContent, PageTitle, Panel, SectionActions, SectionEyebrow, SectionHeader, SectionHeaderContent, SectionTitle, Stack, StatusMarker } from '../components/ui';

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

function GroupIcon() {
  return <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.5 19a5 5 0 0 1 10 0M13 19a4 4 0 0 1 8 0" /></svg>;
}

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
        setCreateError(useStore.getState().errors.squads || t('page.squads.errors.createFailed'));
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
    { title: t('page.home.cards.membersTitle'), description: t('page.home.cards.membersDescription') },
    { title: t('page.home.cards.eventsTitle'), description: t('page.home.cards.eventsDescription') },
    { title: t('page.home.cards.statisticsTitle'), description: t('page.home.cards.statisticsDescription') },
  ];

  return (
    <Page>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            {t(isAuthenticated ? 'page.home.overviewTitle' : 'page.home.publicTitle')}
          </PageTitle>
          <PageDescription>
            {t(isAuthenticated ? 'page.home.overviewSubtitle' : 'page.home.publicSubtitle')}
          </PageDescription>
        </PageHeaderContent>
        {!isAuthenticated && (
          <PageActions>
            <ButtonLink to="/login" variant="secondary">
              {t('auth.login')}
            </ButtonLink>
            <ButtonLink to="/login?register=true">
              {t('auth.register')}
            </ButtonLink>
          </PageActions>
        )}
      </PageHeader>

      {!isAuthenticated ? (
        <ContentGrid variant="threeColumn" className="home-feature-grid" aria-label={t('page.home.featuresLabel')}>
          {features.map((feature, index) => (
            <Panel key={feature.title}>
              <Stack>
                <IconTile tone="brand"><span className="icon-md">{featureIcons[index]}</span></IconTile>
                <div><SectionTitle>{feature.title}</SectionTitle><p className="supporting-text">{feature.description}</p></div>
              </Stack>
            </Panel>
          ))}
        </ContentGrid>
      ) : (
        <ContentGrid variant="dashboard" className="home-dashboard-grid">
          <section>
            <SectionHeader>
              <SectionHeaderContent>
                <SectionEyebrow>{t('page.home.scheduleLabel')}</SectionEyebrow>
                <SectionTitle>{t('page.home.upcomingEvents.title')}</SectionTitle>
              </SectionHeaderContent>
              <SectionActions>
              <Link to="/activities" className="text-link">
                {t('page.home.upcomingEvents.viewAll')}
                <ChevronRightIcon className="icon-xs" />
              </Link>
              </SectionActions>
            </SectionHeader>
            {upcomingEvents.length === 0 ? (
              <EmptyState>{t('page.home.upcomingEvents.empty')}</EmptyState>
            ) : (
              <Stack gap="sm">{upcomingEvents.map((event) => <UpcomingEventCard key={event.id} event={event} />)}</Stack>
            )}
          </section>

          <section>
            <SectionHeader>
              <SectionHeaderContent>
                <SectionEyebrow>{t('page.home.manageLabel')}</SectionEyebrow>
                <SectionTitle>{t('page.squads.title')}</SectionTitle>
              </SectionHeaderContent>
            </SectionHeader>

            {squadsLoading && <div className="home-loading-card">{t('page.squads.loading')}</div>}
            {!squadsLoading && squadsError && <Alert>{t('page.squads.errors.loadFailedWithReason', { error: squadsError })}</Alert>}
            {!squadsLoading && !squadsError && (
              <Stack gap="sm">
                {squads.map((squadItem) => {
                  const isCurrentSquad = squad?.id === squadItem.id;
                  const isSwitching = switchingSquadId === squadItem.id;
                  return (
                    <ActionCard
                      onClick={() => handleSquadSwitch(squadItem.id)}
                      disabled={isCurrentSquad || !!switchingSquadId}
                      key={squadItem.id}
                      selected={isCurrentSquad}
                      showChevron={false}
                      leading={<IconTile tone="brand" size="sm"><GroupIcon /></IconTile>}
                      trailing={isCurrentSquad ? <StatusMarker tone="brand" aria-hidden="true">✓</StatusMarker> : undefined}
                    >
                        <ActionCardTitle>{squadItem.name}</ActionCardTitle>
                        <EntityMeta>
                          {squadItem.club && <span>{t('page.squads.clubLabel', { club: squadItem.club })}</span>}
                          {squadItem.category && <span>{t('page.squads.categoryLabel', { category: squadItem.category })}</span>}
                          {isSwitching && <span>{t('page.squads.switching')}</span>}
                        </EntityMeta>
                    </ActionCard>
                  );
                })}
                <AddCardButton cardSize="lg" leading={<GroupIcon />} onClick={() => setIsAddModalOpen(true)} label={t('page.squads.createNew')} />
              </Stack>
            )}
          </section>
        </ContentGrid>
      )}

      <AddSquadModal isOpen={isAddModalOpen} isSubmitting={isSubmitting} error={createError} onClose={() => { setCreateError(null); setIsAddModalOpen(false); }} onSave={handleCreateSquad} />
    </Page>
  );
}
