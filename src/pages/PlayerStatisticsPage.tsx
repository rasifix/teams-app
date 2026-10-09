import { useOutletContext } from 'react-router-dom';
import type { Player } from '../types';
import PlayerStatisticsTable from '../components/PlayerStatisticsTable';
import { selectPlayerActivityStatistics } from '../store/selectors/statisticsSelectors';
import type { Activity } from '../types';

interface StatisticsOutletContext {
  filteredEvents: Activity[];
  statisticsPlayers: Player[];
}

export default function PlayerStatisticsPage() {
  const { filteredEvents, statisticsPlayers } = useOutletContext<StatisticsOutletContext>();

  const playerStats = selectPlayerActivityStatistics(filteredEvents, statisticsPlayers);

  return <PlayerStatisticsTable playerStats={playerStats} />;
}
