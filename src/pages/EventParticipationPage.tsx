import { useOutletContext } from 'react-router-dom';
import type { Activity, Player } from '../types';
import EventParticipationMatrix from '../components/EventParticipationMatrix';

interface StatisticsOutletContext {
  filteredEvents: Activity[];
  statisticsPlayers: Player[];
  openPlayer: (playerId: string) => void;
  openActivity: (activityId: string) => void;
}

export default function EventParticipationPage() {
  const { filteredEvents, statisticsPlayers, openPlayer, openActivity } = useOutletContext<StatisticsOutletContext>();

  return (
    <EventParticipationMatrix 
      players={statisticsPlayers} 
      events={filteredEvents} 
      onOpenPlayer={openPlayer}
      onOpenActivity={openActivity}
    />
  );
}
