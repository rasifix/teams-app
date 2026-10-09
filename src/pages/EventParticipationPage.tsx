import { useOutletContext } from 'react-router-dom';
import type { Activity, Player } from '../types';
import EventParticipationMatrix from '../components/EventParticipationMatrix';

interface StatisticsOutletContext {
  filteredEvents: Activity[];
  statisticsPlayers: Player[];
}

export default function EventParticipationPage() {
  const { filteredEvents, statisticsPlayers } = useOutletContext<StatisticsOutletContext>();

  return (
    <EventParticipationMatrix 
      players={statisticsPlayers} 
      events={filteredEvents} 
    />
  );
}
