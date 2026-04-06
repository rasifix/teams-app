import { useOutletContext } from 'react-router-dom';
import type { Event, Player } from '../types';
import TeamSelectionMatrix from '../components/TeamSelectionMatrix';

interface StatisticsOutletContext {
  filteredEvents: Event[];
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