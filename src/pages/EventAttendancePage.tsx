import { useOutletContext } from 'react-router-dom';
import { usePlayers } from '../hooks/usePlayers';
import type { Event } from '../types';
import EventAttendanceMatrix from '../components/EventAttendanceMatrix';

interface StatisticsOutletContext {
  filteredEvents: Event[];
}

export default function EventAttendancePage() {
  const { filteredEvents } = useOutletContext<StatisticsOutletContext>();
  const { players } = usePlayers();

  return (
    <EventAttendanceMatrix 
      players={players} 
      events={filteredEvents} 
    />
  );
}
