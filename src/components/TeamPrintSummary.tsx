import { useState } from 'react';
import { formatDate } from '../utils/dateFormatter';
import type { Event, Team, Player, Trainer, ShirtSet } from '../types';

interface TeamPrintSummaryProps {
  event: Event;
  teams: Team[];
  players: Player[];
  trainers: Trainer[];
  shirtSets: ShirtSet[];
  club?: string;
  isOpen: boolean;
  onClose: () => void;
}

type PrintFormat = 'selection' | 'organizer';

export default function TeamPrintSummary({ 
  event, 
  teams, 
  players, 
  trainers,
  club,
  isOpen, 
  onClose 
}: TeamPrintSummaryProps) {
  const [format, setFormat] = useState<PrintFormat>('selection');
  
  if (!isOpen) return null;

  const formatBirthDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

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
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center mb-3">
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
          
          {/* Format Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Format:</span>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="guardians"
                  checked={format === 'selection'}
                  onChange={() => setFormat('selection')}
                  className="text-blue-600"
                />
                <span className="text-sm">Selection</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="organizer"
                  checked={format === 'organizer'}
                  onChange={() => setFormat('organizer')}
                  className="text-blue-600"
                />
                <span className="text-sm">Organizer</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Print content */}
        <div className="print-content p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {teams.map((team) => {
              const selectedPlayers = team.selectedPlayers || [];
              const trainer = team.trainerId ? trainers.find(t => t.id === team.trainerId) : null;
              const playersData = selectedPlayers
                .map(playerId => players.find(p => p.id === playerId))
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
                    <h1 className="text-xl font-bold text-gray-900 mb-1">
                      {format === 'organizer' && club ? `${club} - ` : ''} {team.name}
                    </h1>
                    <div className="text-sm text-gray-600">
                      <p>📅 {formatDate(event.date)} {format === 'selection' && `🕐 ${team.startTime}`}</p>
                      {event.location && format === 'selection' && (
                        <p>📍 {event.location}</p>
                      )}
                      {trainer && (
                        <p className="text-blue-600 font-medium">👤 {trainer.firstName} {trainer.lastName}</p>
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
                          const shirtNumber = shirtAssignment?.shirtNumber;
                          
                          return (
                            <div key={player!.id} className="border-b border-gray-100 pb-1">
                              {format === 'selection' ? (
                                <div className="flex items-center justify-center">
                                  <p className="text-sm font-medium text-gray-900">
                                    {player!.firstName} {player!.lastName}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {player!.firstName} {player!.lastName}
                                    </p>
                                    {player!.birthDate && (
                                      <p className="text-xs text-gray-600">
                                        {formatBirthDate(player!.birthDate)}
                                      </p>
                                    )}
                                  </div>
                                  {shirtNumber && shirtNumber > 0 && (
                                    <span className="text-gray-800 text-sm font-bold">{shirtNumber}</span>
                                  )}
                                </div>
                              )}
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