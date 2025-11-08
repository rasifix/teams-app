import { getPlayerById } from '../services/playerService';
import { getTrainerById } from '../services/trainerService';
import { getShirtSetById } from '../services/shirtService';
import { formatDate } from '../utils/dateFormatter';
import type { Event, Team } from '../types';

interface TeamPrintSummaryProps {
  event: Event;
  teams: Team[];
  isOpen: boolean;
  onClose: () => void;
}

export default function TeamPrintSummary({ event, teams, isOpen, onClose }: TeamPrintSummaryProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Team Summary - Print Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Print content */}
        <div className="print-content p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {teams.map((team) => {
              const selectedPlayers = team.selectedPlayers || [];
              const trainer = team.trainerId ? getTrainerById(team.trainerId) : null;
              const shirtSet = team.shirtSetId ? getShirtSetById(team.shirtSetId) : null;
              const playersData = selectedPlayers
                .map(playerId => getPlayerById(playerId))
                .filter(Boolean)
                .sort((a, b) => {
                  const lastNameCompare = a!.lastName.toLowerCase().localeCompare(b!.lastName.toLowerCase());
                  if (lastNameCompare !== 0) return lastNameCompare;
                  return a!.firstName.toLowerCase().localeCompare(b!.firstName.toLowerCase());
                });

              return (
                <div key={team.id} className="border border-gray-300 rounded-lg p-4">
                  {/* Header */}
                  <div className="text-center mb-4 border-b border-gray-200 pb-3">
                    <h2 className="text-lg font-semibold text-gray-700 mb-1">{event.name}</h2>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">{team.name}</h1>
                    <div className="text-sm text-gray-600">
                      <p>📅 {formatDate(event.date)} 🕐 {event.startTime}</p>
                      {trainer && (
                        <p className="text-blue-600 font-medium">👨‍🏫 {trainer.firstName} {trainer.lastName}</p>
                      )}
                      {shirtSet && (
                        <p className="text-gray-600 font-medium">👕 {shirtSet.sponsor}</p>
                      )}
                    </div>
                  </div>

                  {/* Players List */}
                  <div>
                    {playersData.length === 0 ? (
                      <p className="text-gray-500 italic text-sm">No players selected for this team yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {playersData.map((player) => {
                          const shirtAssignment = team.shirtAssignments?.find(a => a.playerId === player!.id);
                          const shirtNumber = shirtAssignment && shirtSet 
                            ? shirtSet.shirts.find(s => s.id === shirtAssignment.shirtId)?.number 
                            : null;
                          
                          return (
                            <div key={player!.id} className="border-b border-gray-100 pb-1 relative">
                                <div className="flex items-center justify-center">
                                  {shirtNumber && (
                                    <span className="absolute left-0 text-blue-600 text-sm font-medium">#{shirtNumber}</span>
                                  )}
                                  <p className="text-sm font-medium text-gray-900">
                                    {player!.firstName} {player!.lastName}
                                  </p>
                                </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Print-specific styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .fixed, .sticky {
              position: static !important;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .print-content {
              padding: 0 !important;
              margin: 0 !important;
            }
            
            /* Ensure 2-column layout on print */
            .grid-cols-1.md\\:grid-cols-2 {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 1rem !important;
            }
            
            /* Hide everything except print content */
            body * {
              visibility: hidden;
            }
            
            .print-content, .print-content * {
              visibility: visible;
            }
            
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `
      }} />
    </div>
  );
}