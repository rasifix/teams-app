import { useOutletContext } from 'react-router-dom';
import type { Player } from '../types';
import PlayerStatisticsTable from '../components/PlayerStatisticsTable';
import type { PlayerActivityStatistics } from '../store/selectors/statisticsSelectors';
import type { Activity } from '../types';

interface StatisticsOutletContext {
  filteredEvents: Activity[];
  statisticsPlayers: Player[];
  playerStatistics: PlayerActivityStatistics[];
}

export default function PlayerStatisticsPage() {
  const { playerStatistics } = useOutletContext<StatisticsOutletContext>();

  return <PlayerStatisticsTable playerStats={playerStatistics} />;
}
