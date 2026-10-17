import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/dateFormatter';
import type { Activity, Team, Player, Trainer, ShirtSet } from '../types';
import { getActivityDate, getActivityTime } from '../store/selectors/activitySelectors';
import { selectTeamResponsiblePeople } from '../store/selectors/teamTrainerSelectors';
import { Button, Radio } from './ui';

interface TeamPrintSummaryProps {
  event: Activity;
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
  const { t } = useTranslation();
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
    <div className="fixed inset-0 z-50 bg-backdrop bg-opacity-50 flex items-center justify-center" onClick={handleBackdropClick}>
      <div className="bg-surface rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-surface border-b border-edge px-6 py-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-content-strong">{t('teamPrint.title')}</h2>
            <div className="layout-cluster">
              <Button
                size="sm"
                onClick={handlePrint}
              >
                {t('teamPrint.print')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
              >
                {t('common.actions.close')}
              </Button>
            </div>
          </div>
          
          {/* Format Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-content">{t('teamPrint.formatLabel')}</span>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Radio
                  name="format"
                  value="guardians"
                  checked={format === 'selection'}
                  onChange={() => setFormat('selection')}
                  className="text-info-text"
                />
                <span className="text-sm">{t('teamPrint.selectionFormat')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Radio
                  name="format"
                  value="organizer"
                  checked={format === 'organizer'}
                  onChange={() => setFormat('organizer')}
                  className="text-info-text"
                />
                <span className="text-sm">{t('teamPrint.organizerFormat')}</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Print content */}
        <div className="print-content p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {teams.map((team) => {
              const selectedPlayers = team.selectedPlayers || [];
              const responsiblePeople = selectTeamResponsiblePeople(team.responsiblePersonIds, trainers, players);
              const resolvedLocation = event.kind === 'match' ? event.location?.trim() : team.location?.trim() || event.location?.trim();
              const playersData = selectedPlayers
                .map(playerId => players.find(p => p.id === playerId))
                .filter(Boolean)
                .sort((a, b) => {
                  const lastNameCompare = a!.lastName.toLowerCase().localeCompare(b!.lastName.toLowerCase());
                  if (lastNameCompare !== 0) return lastNameCompare;
                  return a!.firstName.toLowerCase().localeCompare(b!.firstName.toLowerCase());
                });

              return (
                <div key={team.id} className="border border-edge-strong rounded-lg p-4">
                  {/* Header */}
                  <div className="text-center mb-4 border-b border-edge pb-3">
                    <h2 className="text-lg font-semibold text-content mb-1">{event.name}</h2>
                    <h1 className="text-xl font-bold text-content-strong mb-1">
                      {format === 'organizer' && club ? `${club} - ` : ''} {team.name}
                    </h1>
                    <div className="body-muted">
                      <p>📅 {formatDate(getActivityDate(event))} {format === 'selection' && `🕐 ${event.kind === 'match' ? getActivityTime(event) : team.startTime || getActivityTime(event)}`}</p>
                      {resolvedLocation && format === 'selection' && (
                        <p>📍 {resolvedLocation}</p>
                      )}
                      {responsiblePeople.length > 0 && (
                        <p className="text-info-text font-medium">👤 {responsiblePeople.map((person) => person.firstName + ' ' + person.lastName + (person.isLead ? ' (' + t('teamModal.leadPerson') + ')' : '')).join(', ')}</p>
                      )}
                    </div>
                  </div>

                  {/* Players List */}
                  <div>
                    {playersData.length === 0 ? (
                      <p className="text-content-subtle italic text-sm">{t('teamPrint.noPlayers')}</p>
                    ) : (
                      <div className="space-y-2">
                        {playersData.map((player) => {
                          const shirtAssignment = team.shirtAssignments?.find(a => a.playerId === player!.id);
                          const shirtNumber = shirtAssignment?.shirtNumber;
                          
                          return (
                            <div key={player!.id} className="border-b border-edge pb-1">
                              {format === 'selection' ? (
                                <div className="flex items-center justify-center">
                                  <p className="text-sm font-medium text-content-strong">
                                    {player!.firstName} {player!.lastName}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-content-strong">
                                      {player!.firstName} {player!.lastName}
                                    </p>
                                    {player!.birthDate && (
                                      <p className="text-xs text-content-muted">
                                        {formatBirthDate(player!.birthDate)}
                                      </p>
                                    )}
                                  </div>
                                  {shirtNumber && shirtNumber > 0 && (
                                    <span className="text-content-strong text-sm font-bold">{shirtNumber}</span>
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
              background-color: white !important;
            }
            
            .print-content {
              padding: 0 !important;
              margin: 0 !important;
              background-color: white !important;
            }
            
            /* Ensure 2-column layout on print */
            .grid-cols-1.md\\:grid-cols-2 {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 1rem !important;
            }
            
            /* Hide everything except print content */
            body * {
              visibility: hidden;
              background-color: white !important;
            }
            
            .print-content, .print-content * {
              visibility: visible;
              background-color: white !important;
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
