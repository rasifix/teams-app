import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities } from '../store';
import { usePlayers } from '../hooks/usePlayers';
import type { Activity, Period, Player } from '../types';
import { selectStatisticsViewData, type PlayerActivityStatistics } from '../store/selectors/statisticsSelectors';
import StatisticsPeriodSelector from '../components/StatisticsPeriodSelector';
import { useSelectedStatisticsPeriod } from '../store';
import { ContentGrid, NavigationTab, NavigationTabs, Page, PageActions, PageDescription, PageHeader, PageHeaderContent, PageTitle, Stack, SummaryCard, SummaryCardContent } from '../components/ui';

interface StatisticsOutletContext {
  filteredEvents: Activity[];
  statisticsPeriod: Period | null;
  statisticsPlayers: Player[];
  playerStatistics: PlayerActivityStatistics[];
  openPlayer: (playerId: string) => void;
  openActivity: (activityId: string) => void;
  openTeam: (activityId: string, teamId: string) => void;
}

export default function StatisticsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { activities } = useActivities();
  const { players } = usePlayers();
  const statisticsPeriod = useSelectedStatisticsPeriod();
  const { filteredEvents, statisticsPlayers, playerStatistics, summary } = useMemo(
    () => selectStatisticsViewData(activities, players, statisticsPeriod),
    [activities, players, statisticsPeriod],
  );

  // Redirect to player-statistics if on base /statistics route
  useEffect(() => {
    if (location.pathname === '/statistics') {
      navigate('/statistics/player-statistics', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <Page>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>{t('page.statistics.title')}</PageTitle>
          <PageDescription>{t('page.statistics.description')}</PageDescription>
        </PageHeaderContent>
        <PageActions>
          <StatisticsPeriodSelector />
        </PageActions>
      </PageHeader>

      <Stack gap="lg">
        <ContentGrid variant="metrics">
          <SummaryCard><SummaryCardContent value={summary.totalPlayers} label={t('page.statistics.summary.totalPlayers')} /></SummaryCard>
          <SummaryCard tone="info"><SummaryCardContent value={summary.totalEvents} label={t('page.statistics.summary.totalEvents')} /></SummaryCard>
          <SummaryCard tone="success"><SummaryCardContent value={summary.averageAcceptances.toFixed(1)} label={t('page.statistics.summary.avgAcceptancesPerPlayer')} /></SummaryCard>
          <SummaryCard tone="accent"><SummaryCardContent value={summary.averageSelections.toFixed(1)} label={t('page.statistics.summary.avgSelectionsPerPlayer')} /></SummaryCard>
        </ContentGrid>

        <NavigationTabs label={t('common.tabs')} mobileFit>
          <NavigationTab to="/statistics/player-statistics">
            {t('page.statistics.tabs.playerStatistics')}
          </NavigationTab>
          <NavigationTab to="/statistics/event-participation">
            {t('page.statistics.tabs.eventParticipation')}
          </NavigationTab>
          <NavigationTab to="/statistics/team-selections">
            {t('page.statistics.tabs.teamSelections')}
          </NavigationTab>
        </NavigationTabs>

        <Outlet context={{
          filteredEvents,
          statisticsPeriod,
          statisticsPlayers,
          playerStatistics,
          openPlayer: (playerId: string) => navigate(`/players/${playerId}`),
          openActivity: (activityId: string) => navigate(`/activities/${activityId}`),
          openTeam: (activityId: string, teamId: string) => navigate(`/activities/${activityId}/teams/${teamId}`),
        } satisfies StatisticsOutletContext} />
      </Stack>
    </Page>
  );
}
