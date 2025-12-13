import type { Event, Trainer } from '../types';
import Strength from './Strength';
import { DateColumn } from './ui';

interface EventCardProps {
  event: Event;
  trainers?: Trainer[];
  onClick?: (eventId: string) => void;
}

export default function EventCard({ event, trainers = [], onClick }: EventCardProps) {
  const hasSelections = event.teams.some(team => team.selectedPlayers?.length > 0);
  
  // Get earliest start time and total teams count
  const earliestStartTime = event.teams.length > 0 
    ? event.teams
        .map(team => team.startTime)
        .sort()[0] // Sort times and get the first (earliest)
    : undefined;
  const teamsCount = event.teams.length;

  // Calculate player counts
  const acceptedCount = event.invitations.filter(inv => inv.status === 'accepted').length;
  const selectedCount = event.teams.reduce((sum, team) => sum + (team.selectedPlayers?.length || 0), 0);
  const openCount = event.invitations.filter(inv => inv.status === 'open').length;
  const declinedCount = event.invitations.filter(inv => inv.status === 'declined').length;
  const injuredCount = event.invitations.filter(inv => inv.status === 'injured').length;

  const handleClick = () => {
    onClick?.(event.id);
  };

  return (
    <div
      onClick={handleClick}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Date column */}
        <DateColumn date={event.date} />
        
        {/* Content and status */}
        <div className="flex justify-between items-start flex-1">
          <div className="flex-1">
            <h3 className="text-md font-semibold text-gray-900">{event.name}</h3>
            <div className="mt-2 space-y-1">
              {/* Mobile view - simplified */}
              <div className="block sm:hidden">
                {earliestStartTime && (
                  <p className="text-sm text-gray-600">
                    🕐 {earliestStartTime}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  👥 {teamsCount} {teamsCount === 1 ? 'team' : 'teams'}
                </p>
              </div>
              
              {/* Desktop view - detailed */}
              <div className="hidden sm:block space-y-1">
                {event.teams.map((team) => {
                  const trainer = team.trainerId ? trainers.find(t => t.id === team.trainerId) : null;
                  return (
                    <p key={team.id} className="text-sm text-gray-600 flex items-center gap-1">
                      🕐 {team.startTime} 👥 {team.name} <Strength level={team.strength} />
                      {trainer && (
                        <span className="text-sm text-gray-600">
                          👤 {trainer.firstName} {trainer.lastName}
                        </span>
                      )}
                    </p>
                  );
                })}
                <div className="flex items-center gap-3 text-sm">
                  {/* Accepted */}
                  <div className="flex items-center gap-1" title="Players who have accepted the invitation">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span className="text-gray-600">{acceptedCount}</span>
                  </div>
                  {/* Selected */}
                  <div className="flex items-center gap-1" title="Players who have been assigned to teams">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-600">{selectedCount}</span>
                  </div>
                  {/* Open */}
                  <div className="flex items-center gap-1" title="Pending invitations awaiting response">
                    <span className="text-yellow-600 font-bold">?</span>
                    <span className="text-gray-600">{openCount}</span>
                  </div>
                  {/* Declined */}
                  <div className="flex items-center gap-1" title="Players who have declined the invitation">
                    <span className="text-red-600 font-bold">✗</span>
                    <span className="text-gray-600">{declinedCount}</span>
                  </div>
                  {/* Injured */}
                  <div className="flex items-center gap-1" title="Players marked as injured">
                    <span className="text-purple-600 font-bold">✚</span>
                    <span className="text-gray-600">{injuredCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="ml-4 hidden sm:block">
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
    </div>
  );
}