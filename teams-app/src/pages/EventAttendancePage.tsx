import { getPlayers, getEvents } from '../utils/localStorage';
import EventAttendanceMatrix from '../components/EventAttendanceMatrix';

export default function EventAttendancePage() {
  return (
    <EventAttendanceMatrix 
      players={getPlayers()} 
      events={getEvents()} 
    />
  );
}
