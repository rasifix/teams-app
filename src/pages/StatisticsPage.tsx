import { useEffect, useMemo } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities } from '../store';
import { usePlayers } from '../hooks/usePlayers';
import type { Activity, Period, Player } from '../types';
import { isTeamActivity } from '../store/selectors/activitySelectors';
import { selectPlayerActivityStatistics } from '../store/selectors/statisticsSelectors';
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t('statistics.title')}</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">{t('statistics.description')}</p>
        </div>
        <div className="shrink-0">
          <StatisticsPeriodSelector />
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_-26px_rgba(15,29,38,.5)] sm:px-5">
          <div className="mb-3 h-1 w-8 rounded-full bg-orange-400" />
          <p className="text-2xl font-semibold tracking-tight text-slate-950">{totalPlayers}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{t('statistics.summary.totalPlayers')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_-26px_rgba(15,29,38,.5)] sm:px-5">
          <div className="mb-3 h-1 w-8 rounded-full bg-sky-400" />
          <p className="text-2xl font-semibold tracking-tight text-slate-950">{totalEvents}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{t('statistics.summary.totalEvents')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_-26px_rgba(15,29,38,.5)] sm:px-5">
          <div className="mb-3 h-1 w-8 rounded-full bg-emerald-400" />
          <p className="text-2xl font-semibold tracking-tight text-slate-950">{avgAcceptances.toFixed(1)}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{t('statistics.summary.avgAcceptancesPerPlayer')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_-26px_rgba(15,29,38,.5)] sm:px-5">
          <div className="mb-3 h-1 w-8 rounded-full bg-violet-400" />
          <p className="text-2xl font-semibold tracking-tight text-slate-950">{avgSelections.toFixed(1)}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{t('statistics.summary.avgSelectionsPerPlayer')}</p>
        </div>
      </div>

      <div className="mb-5 overflow-x-auto">
        <nav className="inline-flex min-w-max gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" aria-label={t('common.tabs')}>
          <NavLink
            to="/statistics/player-statistics"
            className={({ isActive }) => `rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-[#13212b] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {t('statistics.tabs.playerStatistics')}
          </NavLink>
          <NavLink
            to="/statistics/event-participation"
            className={({ isActive }) => `rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-[#13212b] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {t('statistics.tabs.eventParticipation')}
          </NavLink>
          <NavLink
            to="/statistics/team-selections"
            className={({ isActive }) => `rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-[#13212b] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {t('statistics.tabs.teamSelections')}
          </NavLink>
        </nav>
      </div>

      <Outlet context={{
        filteredEvents,
        statisticsPeriod,
        statisticsPlayers,
      } satisfies StatisticsOutletContext} />
    </div>
  );
}
