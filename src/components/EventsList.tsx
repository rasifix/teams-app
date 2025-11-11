import type { Event } from '../types';
import Strength from './Strength';
import { formatDate } from '../utils/dateFormatter';

interface EventsListProps {
  events: Event[];
  onEventClick?: (eventId: string) => void;
}

export default function EventsList({ events, onEventClick }: EventsListProps) {
  if (events.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>No events created yet. Click "Create Event" to get started.</p>
      </div>
    );
  }

  const handleEventClick = (event: Event) => {
    onEventClick?.(event.id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {events.map((event) => {
        const hasSelections = event.teams.some(team => team.selectedPlayers?.length > 0);
        
        return (
          <div
            key={event.id}
            onClick={() => handleEventClick(event)}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    📅 {formatDate(event.date)}
                  </p>
                  {event.teams.map((team) => (
                    <p key={team.id} className="text-sm text-gray-600 flex items-center gap-1">
                      🕐 {team.startTime} 👥 {team.name} <Strength level={team.strength} />
                    </p>
                  ))}
                  <p className="text-sm text-gray-600">
                    ✉️ {event.invitations.length} {event.invitations.length === 1 ? 'invitation' : 'invitations'}
                  </p>
                </div>
              </div>
              <div className="ml-4">
                {hasSelections ? (
                  <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
