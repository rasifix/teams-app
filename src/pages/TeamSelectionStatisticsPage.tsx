import { useOutletContext } from 'react-router-dom';
import type { Activity, Player } from '../types';
import TeamSelectionMatrix from '../components/TeamSelectionMatrix';

interface StatisticsOutletContext {
  filteredEvents: Activity[];
  statisticsPlayers: Player[];
}

export default function TeamSelectionStatisticsPage() {
  const { filteredEvents, statisticsPlayers } = useOutletContext<StatisticsOutletContext>();

  return (
    <TeamSelectionMatrix
      players={statisticsPlayers}
      events={filteredEvents}
    />
  );
}