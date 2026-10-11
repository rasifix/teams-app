import { useEffect, useMemo } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities } from '../store';
import { usePlayers } from '../hooks/usePlayers';
import type { Activity, Period, Player } from '../types';
import { isTeamActivity } from '../store/selectors/activitySelectors';
import { selectPlayerActivityStatistics } from '../store/selectors/statisticsSelectors';
import { SummaryCard, SummaryCardContent } from '../components/ui';
import StatisticsPeriodSelector from '../components/StatisticsPeriodSelector';
import { useSelectedStatisticsPeriod } from '../store';
import { filterEventsByStatisticsPeriod } from '../utils/statisticsPeriod';

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
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="page-title">{t('statistics.title')}</h1>
          <StatisticsPeriodSelector />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard>
          <SummaryCardContent label={t('statistics.summary.totalPlayers')} value={totalPlayers} />
        </SummaryCard>
        
        <SummaryCard>
          <SummaryCardContent label={t('statistics.summary.totalEvents')} value={totalEvents} />
        </SummaryCard>
        
        <SummaryCard>
          <SummaryCardContent label={t('statistics.summary.avgAcceptancesPerPlayer')} value={avgAcceptances.toFixed(1)} />
        </SummaryCard>
        
        <SummaryCard>
          <SummaryCardContent label={t('statistics.summary.avgSelectionsPerPlayer')} value={avgSelections.toFixed(1)} />
        </SummaryCard>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8" aria-label={t('common.tabs')}>
          <NavLink
            to="/statistics/player-statistics"
            className={({ isActive }) => `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('statistics.tabs.playerStatistics')}
          </NavLink>
          <NavLink
            to="/statistics/event-participation"
            className={({ isActive }) => `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('statistics.tabs.eventParticipation')}
          </NavLink>
          <NavLink
            to="/statistics/team-selections"
            className={({ isActive }) => `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('statistics.tabs.teamSelections')}
          </NavLink>
        </nav>
      </div>

      {/* Nested Route Content */}
      <Outlet context={{
        filteredEvents,
        statisticsPeriod,
        statisticsPlayers,
      } satisfies StatisticsOutletContext} />
    </div>
  );
}
