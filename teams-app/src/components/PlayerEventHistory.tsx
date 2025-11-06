import { useNavigate } from 'react-router-dom';
import type { Event } from '../types';
import { Card, CardBody, CardTitle } from './ui';

interface PlayerEventHistoryProps {
  playerEvents: Event[];
  formatDate: (dateString: string) => string;
  getInvitationStatus: (event: Event) => string;
  isSelected: (event: Event) => boolean;
  getTeamName: (event: Event) => string | undefined;
}

export default function PlayerEventHistory({
  playerEvents,
  formatDate,
  getInvitationStatus,
  isSelected,
  getTeamName
}: PlayerEventHistoryProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardBody>
        <CardTitle>Event History</CardTitle>
        {playerEvents.length === 0 ? (
          <div className="empty-state">
            <p>No event invitations yet.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {playerEvents.map((event) => {
              const status = getInvitationStatus(event);
              const selected = isSelected(event);
              const teamName = getTeamName(event);

              return (
                <div 
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{event.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 {formatDate(event.date)} at {event.startTime}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        status === 'accepted' ? 'bg-green-100 text-green-800' :
                        status === 'declined' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status === 'open' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      {selected && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Selected {teamName ? `- ${teamName}` : ''}
                        </span>
                      )}
                      {!selected && status === 'accepted' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Not Selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
