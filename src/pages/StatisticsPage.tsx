import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities } from '../store';
import { usePlayers } from '../hooks/usePlayers';
import type { Activity, Period, Player } from '../types';
import { isTeamActivity } from '../store/selectors/activitySelectors';
import { selectPlayerActivityStatistics } from '../store/selectors/statisticsSelectors';
import StatisticsPeriodSelector from '../components/StatisticsPeriodSelector';
import { useSelectedStatisticsPeriod } from '../store';
import { filterEventsByStatisticsPeriod } from '../utils/statisticsPeriod';
import { NavigationTab, NavigationTabs, Page, PageActions, PageDescription, PageHeader, PageHeaderContent, PageTitle, SummaryCard, SummaryCardContent } from '../components/ui';

interface StatisticsOutletContext {
  filteredEvents: Activity[];
  statisticsPeriod: Period | null;
  statisticsPlayers: Player[];
}

export default function StatisticsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { activities } = useActivities();
  const { players } = usePlayers();
  const statisticsPlayers = useMemo(
    () => players.filter((player) => player.status !== 'trial'),
    [players]
  );
  const statisticsPeriod = useSelectedStatisticsPeriod();
  const filteredEvents = useMemo(
    () => filterEventsByStatisticsPeriod(activities.filter(isTeamActivity), statisticsPeriod),
    [activities, statisticsPeriod]
  );

  const playerStats = useMemo(
    () => selectPlayerActivityStatistics(filteredEvents, statisticsPlayers),
    [filteredEvents, statisticsPlayers]
  );

  // Redirect to player-statistics if on base /statistics route
  useEffect(() => {
    if (location.pathname === '/statistics') {
      navigate('/statistics/player-statistics', { replace: true });
    }
  }, [location.pathname, navigate]);

  const totalPlayers = playerStats.length;
  const totalEvents = filteredEvents.length;
  const avgAcceptances = totalPlayers > 0
    ? playerStats.reduce((sum, stat) => sum + stat.acceptedCount, 0) / totalPlayers
    : 0;
  const avgSelections = totalPlayers > 0
    ? playerStats.reduce((sum, stat) => sum + stat.selectedCount, 0) / totalPlayers
    : 0;

  return (
    <Page>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>{t('statistics.title')}</PageTitle>
          <PageDescription>{t('statistics.description')}</PageDescription>
        </PageHeaderContent>
        <PageActions>
          <StatisticsPeriodSelector />
        </PageActions>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard><SummaryCardContent value={totalPlayers} label={t('statistics.summary.totalPlayers')} /></SummaryCard>
        <SummaryCard tone="info"><SummaryCardContent value={totalEvents} label={t('statistics.summary.totalEvents')} /></SummaryCard>
        <SummaryCard tone="success"><SummaryCardContent value={avgAcceptances.toFixed(1)} label={t('statistics.summary.avgAcceptancesPerPlayer')} /></SummaryCard>
        <SummaryCard tone="accent"><SummaryCardContent value={avgSelections.toFixed(1)} label={t('statistics.summary.avgSelectionsPerPlayer')} /></SummaryCard>
      </div>

      <NavigationTabs label={t('common.tabs')} className="mb-5">
          <NavigationTab to="/statistics/player-statistics">
            {t('statistics.tabs.playerStatistics')}
          </NavigationTab>
          <NavigationTab to="/statistics/event-participation">
            {t('statistics.tabs.eventParticipation')}
          </NavigationTab>
          <NavigationTab to="/statistics/team-selections">
            {t('statistics.tabs.teamSelections')}
          </NavigationTab>
      </NavigationTabs>

      <Outlet context={{
        filteredEvents,
        statisticsPeriod,
        statisticsPlayers,
      } satisfies StatisticsOutletContext} />
    </Page>
  );
}
