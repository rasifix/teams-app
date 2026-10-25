import { useOutletContext } from 'react-router-dom';
import type { Player } from '../types';
import PlayerStatisticsTable from '../components/PlayerStatisticsTable';
import type { PlayerActivityStatistics } from '../store/selectors/statisticsSelectors';
import type { Activity } from '../types';

interface StatisticsOutletContext {
  filteredEvents: Activity[];
  statisticsPlayers: Player[];
  playerStatistics: PlayerActivityStatistics[];
  openPlayer: (playerId: string) => void;
}

export default function PlayerStatisticsPage() {
  const { playerStatistics, openPlayer } = useOutletContext<StatisticsOutletContext>();

  return <PlayerStatisticsTable playerStats={playerStatistics} onOpenPlayer={openPlayer} />;
}
