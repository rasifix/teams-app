import { useOutletContext } from 'react-router-dom';
import { usePlayers } from '../hooks/usePlayers';
import type { Event } from '../types';
import TeamSelectionMatrix from '../components/TeamSelectionMatrix';

interface StatisticsOutletContext {
  filteredEvents: Event[];
}

export default function TeamSelectionStatisticsPage() {
  const { filteredEvents } = useOutletContext<StatisticsOutletContext>();
  const { players } = usePlayers();

  return (
    <TeamSelectionMatrix
      players={players}
      events={filteredEvents}
    />
  );
}