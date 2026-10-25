import { useOutletContext } from 'react-router-dom';
import type { Activity, Player } from '../types';
import TeamSelectionMatrix from '../components/TeamSelectionMatrix';

interface StatisticsOutletContext {
  filteredEvents: Activity[];
  statisticsPlayers: Player[];
  openPlayer: (playerId: string) => void;
  openTeam: (activityId: string, teamId: string) => void;
}

export default function TeamSelectionStatisticsPage() {
  const { filteredEvents, statisticsPlayers, openPlayer, openTeam } = useOutletContext<StatisticsOutletContext>();

  return (
    <TeamSelectionMatrix
      players={statisticsPlayers}
      events={filteredEvents}
      onOpenPlayer={openPlayer}
      onOpenTeam={openTeam}
    />
  );
}
