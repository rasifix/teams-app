import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Player, Event } from '../types';
import { Card, CardBody, DateColumn } from './ui';
import { formatDate } from '../utils/dateFormatter';
import LevelRangeSelector from './LevelRangeSelector';
import Level from './Level';

interface EventAttendanceMatrixProps {
  players: Player[];
  events: Event[];
}

export default function EventAttendanceMatrix({ players, events }: EventAttendanceMatrixProps) {
  const navigate = useNavigate();
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 5]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [minLevel, maxLevel] = levelRange;

  const handlePlayerClick = (playerId: string) => {
    navigate(`/players/${playerId}`);
  };

  const handleEventClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/events/${eventId}`);
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
        if (invitation.status === 'injured') {
          return { status: 'injured', event };
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
        return { icon: '✓', color: 'text-gray-400', bg: 'bg-gray-50' };
      case 'declined':
        return { icon: '✗', color: 'text-red-600', bg: 'bg-red-50' };
      case 'injured':
        return { icon: '✚', color: 'text-purple-600', bg: 'bg-purple-50' };
      case 'open':
        return { icon: '?', color: 'text-yellow-600', bg: 'bg-yellow-50' };
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

  // Scroll to next upcoming event on mount
  useEffect(() => {
    if (events.length === 0 || players.length === 0) return;
    if (!scrollContainerRef.current) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the index of the next upcoming event
    const nextEventIndex = events.findIndex(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    });

    // If we found an upcoming event, scroll to it
    if (nextEventIndex > 0) {
      // Use setTimeout to ensure DOM is rendered
      setTimeout(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Find the header cell for this event
        const headers = container.querySelectorAll('th');
        // +1 because first header is the "Player" column
        const targetHeader = headers[nextEventIndex + 1];
        
        if (targetHeader) {
          const containerRect = container.getBoundingClientRect();
          const targetRect = targetHeader.getBoundingClientRect();
          const scrollLeft = targetRect.left - containerRect.left + container.scrollLeft - 220; // 220px is the player column width
          
          container.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [events, players]);

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
        <LevelRangeSelector
          defaultRange={levelRange}
          onChange={setLevelRange}
        />

        <div className="mt-4 text-xs text-gray-600 mb-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-bold">✓</span>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400 font-bold">✓</span>
            <span>Accepted</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-600 font-bold">?</span>
            <span>Open</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-600 font-bold">✗</span>
            <span>Declined</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-purple-600 font-bold">✚</span>
            <span>Injured</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400 font-bold">-</span>
            <span>Not Invited</span>
          </div>
        </div>
        <div className="overflow-x-auto" ref={scrollContainerRef}>
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="sticky left-0 bg-white z-10 px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r-2 border-gray-300 min-w-[220px]">
                  Player
                </th>
                {events.map(event => (
                  <th 
                    key={event.id} 
                    className="px-2 py-2 text-center text-sm font-medium text-gray-900 min-w-[50px]"
                    title={`${event.name} - ${formatDate(event.date)}`}
                  >
                    <div 
                      className="flex justify-center cursor-pointer hover:opacity-70 transition-opacity"
                      onClick={(e) => handleEventClick(event.id, e)}
                    >
                      <DateColumn date={event.date} />
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
                  <td className="sticky left-0 bg-white z-10 px-4 py-2 text-sm font-medium text-gray-900 border-r border-gray-200 max-h-[40px] min-w-[220px]">
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
