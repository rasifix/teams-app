import { useNavigate } from 'react-router-dom';
import type { PlayerEventHistoryItem } from '../types';
import { Card, CardBody, CardTitle } from './ui';
import { formatDate } from '../utils/dateFormatter';

interface PlayerEventHistoryProps {
  eventHistory: PlayerEventHistoryItem[];
}

export default function PlayerEventHistory({
  eventHistory
}: PlayerEventHistoryProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardBody>
        <CardTitle>Event History</CardTitle>
        {eventHistory.length === 0 ? (
          <div className="empty-state">
            <p>No event invitations yet.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {eventHistory.map((item) => {
              return (
                <div 
                  key={item.eventId}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/events/${item.eventId}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.eventName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 {formatDate(item.eventDate)} 🕐 {item.eventStartTime}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.invitationStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                        item.invitationStatus === 'declined' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.invitationStatus === 'open' ? 'Pending' : item.invitationStatus.charAt(0).toUpperCase() + item.invitationStatus.slice(1)}
                      </span>
                      {item.isSelected && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Selected {item.teamName ? `- ${item.teamName}` : ''}
                        </span>
                      )}
                      {!item.isSelected && item.invitationStatus === 'accepted' && (
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
