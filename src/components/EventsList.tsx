import type { Event } from '../types';

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const hasSelections = event.teams.some(team => team.selectedPlayers?.length > 0);
        
        return (
          <div
            key={event.id}
            onClick={() => onEventClick?.(event.id)}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    📅 {formatDate(event.date)} at {event.startTime}
                  </p>
                  <p className="text-sm text-gray-600">
                    👥 {event.teams.length} {event.teams.length === 1 ? 'team' : 'teams'}
                  </p>
                  <p className="text-sm text-gray-600">
                    ✉️ {event.invitations.length} {event.invitations.length === 1 ? 'invitation' : 'invitations'}
                  </p>
                </div>
              </div>
              <div className="ml-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {hasSelections ? 'Selected' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
