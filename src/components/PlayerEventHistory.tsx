import { useNavigate } from 'react-router-dom';
import type { PlayerEventHistoryItem } from '../types';
import { Card, CardBody, CardTitle, DateColumn } from './ui';

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
        <CardTitle>Events</CardTitle>
        {eventHistory.length === 0 ? (
          <div className="empty-state">
            <p>No event invitations yet.</p>
          </div>
        ) : (
          <div className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-3  ">
              {eventHistory.map((item) => (
                <div 
                  key={item.eventId}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/events/${item.eventId}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* Date column */}
                    <DateColumn date={item.eventDate} />
                    
                    {/* Content and status */}
                    <div className="flex justify-between items-center flex-1">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-gray-900 truncate">{item.eventName}</h5>
                        <div className="mt-2">
                          {item.isSelected ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Selected
                            </span>
                          ) : item.invitationStatus === 'accepted' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Accepted
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.invitationStatus === 'declined' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.invitationStatus === 'open' ? 'Open' : 'Declined'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Chevron icon */}
                      <div className="ml-4 flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
