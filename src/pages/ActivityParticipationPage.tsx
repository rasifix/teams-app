import { useOutletContext } from 'react-router-dom';
import type { Activity, Player } from '../types';
import ActivityParticipationMatrix from '../components/ActivityParticipationMatrix';

interface StatisticsOutletContext {
  filteredEvents: Activity[];
  statisticsPlayers: Player[];
  openPlayer: (playerId: string) => void;
  openActivity: (activityId: string) => void;
}

export default function ActivityParticipationPage() {
  const { filteredEvents, statisticsPlayers, openPlayer, openActivity } = useOutletContext<StatisticsOutletContext>();

  return (
    <ActivityParticipationMatrix 
      players={statisticsPlayers} 
      events={filteredEvents} 
      onOpenPlayer={openPlayer}
      onOpenActivity={openActivity}
    />
  );
}
