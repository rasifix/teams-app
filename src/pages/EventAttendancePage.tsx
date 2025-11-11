import { useEvents } from '../hooks/useEvents';
import { usePlayers } from '../hooks/usePlayers';
import EventAttendanceMatrix from '../components/EventAttendanceMatrix';

export default function EventAttendancePage() {
  const { events } = useEvents();
  const { players } = usePlayers();

  return (
    <EventAttendanceMatrix 
      players={players} 
      events={events} 
    />
  );
}
