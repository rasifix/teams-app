import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Player, Event } from '../types';
import { Card, CardBody, CardTitle } from './ui';
import { formatDate } from '../utils/dateFormatter';
import PlayerLevelFilter from './PlayerLevelFilter';
import Level from './Level';

interface EventAttendanceMatrixProps {
  players: Player[];
  events: Event[];
}

export default function EventAttendanceMatrix({ players, events }: EventAttendanceMatrixProps) {
  const navigate = useNavigate();
  const [minLevel, setMinLevel] = useState<number>(1);
  const [maxLevel, setMaxLevel] = useState<number>(5);

  const handleReset = () => {
    setMinLevel(1);
    setMaxLevel(5);
  };

  const handlePlayerClick = (playerId: string) => {
    navigate(`/players/${playerId}`);
  };

  const attendanceData = useMemo(() => {
    // Filter players by level range
    const filteredPlayers = players.filter(player => 
      player.level >= minLevel && player.level <= maxLevel
    );

    return filteredPlayers.map(player => {
      const attendance = events.map(event => {
        const invitation = event.invitations.find(inv => inv.playerId === player.id);
        const isSelected = event.teams.some(team => 
          (team.selectedPlayers || []).includes(player.id)
        );

        if (!invitation) {
          return { status: 'not-invited', event };
        }
        if (isSelected) {
          return { status: 'selected', event };
        }
        if (invitation.status === 'accepted') {
          return { status: 'accepted', event };
        }
        if (invitation.status === 'declined') {
          return { status: 'declined', event };
        }
        return { status: 'open', event };
      });

      return { player, attendance };
    });
  }, [players, events, minLevel, maxLevel]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'selected':
        return { icon: '✓', color: 'text-green-600', bg: 'bg-green-50' };
      case 'accepted':
        return { icon: '✓', color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'declined':
        return { icon: '✗', color: 'text-red-600', bg: 'bg-red-50' };
      case 'open':
        return { icon: '✉', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      default:
        return { icon: '-', color: 'text-gray-400', bg: 'bg-gray-50' };
    }
  };

  // Sort players by last name, then first name
  const sortedData = [...attendanceData].sort((a, b) => {
    const lastNameCompare = a.player.lastName.toLowerCase().localeCompare(b.player.lastName.toLowerCase());
    if (lastNameCompare !== 0) return lastNameCompare;
    return a.player.firstName.toLowerCase().localeCompare(b.player.firstName.toLowerCase());
  });

  if (events.length === 0 || players.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="empty-state">
            <p>No data available. Add players and events to see the attendance matrix.</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>        
        {/* Level Filter */}
        <PlayerLevelFilter
          minLevel={minLevel}
          maxLevel={maxLevel}
          onMinLevelChange={setMinLevel}
          onMaxLevelChange={setMaxLevel}
          onReset={handleReset}
        />

        <div className="mt-4 text-xs text-gray-600 mb-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-bold">✓</span>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-blue-600 font-bold">✓</span>
            <span>Accepted</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-600 font-bold">✉</span>
            <span>Open</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-600 font-bold">✗</span>
            <span>Declined</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400 font-bold">-</span>
            <span>Not Invited</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="sticky left-0 bg-white z-10 px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r-2 border-gray-300">
                  Player
                </th>
                {events.map(event => (
                  <th 
                    key={event.id} 
                    className="px-3 py-3 text-center text-sm font-medium text-gray-900 min-w-[60px]"
                    title={`${event.name} - ${formatDate(event.date)}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">📅</span>
                      <span className="text-xs text-gray-500 truncate max-w-[60px]">
                        {formatDate(event.date).split(',')[0]}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map(({ player, attendance }) => (
                <tr 
                  key={player.id} 
                  className="border-b border-gray-200 hover:bg-gray-50 max-h-[40px] cursor-pointer"
                  onClick={() => handlePlayerClick(player.id)}
                >
                  <td className="sticky left-0 bg-white z-10 px-4 py-2 text-sm font-medium text-gray-900 border-r border-gray-200 max-h-[40px]">
                    <div className="text-sm font-medium text-gray-900">
                      {player.firstName} {player.lastName}
                      <span className="text-xs text-muted m-2">{player.birthYear}</span>
                    </div>
                    <div className="text-xs flex items-center gap-2">
                      <Level level={player.level} className="text-xs" />
                    </div>
                  </td>
                  {attendance.map(({ status, event }, index) => {
                    const statusInfo = getStatusIcon(status);
                    return (
                      <td 
                        key={index}
                        className="px-3 py-2 text-center max-h-[40px]"
                        title={`${event.name} - ${formatDate(event.date)}\nStatus: ${status.replace('-', ' ')}`}
                      >
                        <div className={`inline-flex items-center justify-center w-7 h-7 rounded ${statusInfo.bg}`}>
                          <span className={`text-base font-bold ${statusInfo.color}`}>
                            {statusInfo.icon}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
