import { useOutletContext } from 'react-router-dom';
import type { Event, Player } from '../types';
import EventAttendanceMatrix from '../components/EventAttendanceMatrix';

interface StatisticsOutletContext {
  filteredEvents: Event[];
  statisticsPlayers: Player[];
}

export default function EventAttendancePage() {
  const { filteredEvents, statisticsPlayers } = useOutletContext<StatisticsOutletContext>();

  return (
    <EventAttendanceMatrix 
      players={statisticsPlayers} 
      events={filteredEvents} 
    />
  );
}
