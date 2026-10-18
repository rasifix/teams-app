import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/dateFormatter';
import type { Activity, Team, Player, Trainer, ShirtSet } from '../types';
import { getActivityDate, getActivityTime } from '../store/selectors/activitySelectors';
import { selectTeamResponsiblePeople } from '../store/selectors/teamTrainerSelectors';
import { Button, Modal, ModalBody, ModalHeader, ModalTitle, Radio } from './ui';

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="team-print-modal">
        <ModalHeader className="team-print-header">
          <div className="team-print-header-row">
            <ModalTitle>{t('teamPrint.title')}</ModalTitle>
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
          <div className="team-print-format">
            <span className="team-print-format-label">{t('teamPrint.formatLabel')}</span>
            <div className="team-print-format-options">
              <label className="team-print-format-option">
                <Radio
                  name="format"
                  value="guardians"
                  checked={format === 'selection'}
                  onChange={() => setFormat('selection')}
                  className="team-print-radio"
                />
                <span>{t('teamPrint.selectionFormat')}</span>
              </label>
              <label className="team-print-format-option">
                <Radio
                  name="format"
                  value="organizer"
                  checked={format === 'organizer'}
                  onChange={() => setFormat('organizer')}
                  className="team-print-radio"
                />
                <span>{t('teamPrint.organizerFormat')}</span>
              </label>
            </div>
          </div>
        </ModalHeader>
        
        {/* Print content */}
        <ModalBody className="team-print-content">
          <div className="team-print-grid">
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
                <div key={team.id} className="team-print-card">
                  {/* Header */}
                  <div className="team-print-team-header">
                    <h2 className="team-print-event-name">{event.name}</h2>
                    <h1 className="team-print-team-name">
                      {format === 'organizer' && club ? `${club} - ` : ''} {team.name}
                    </h1>
                    <div className="body-muted">
                      <p>📅 {formatDate(getActivityDate(event))} {format === 'selection' && `🕐 ${event.kind === 'match' ? getActivityTime(event) : team.startTime || getActivityTime(event)}`}</p>
                      {resolvedLocation && format === 'selection' && (
                        <p>📍 {resolvedLocation}</p>
                      )}
                      {responsiblePeople.length > 0 && (
                        <p className="team-print-responsible">👤 {responsiblePeople.map((person) => person.firstName + ' ' + person.lastName + (person.isLead ? ' (' + t('teamModal.leadPerson') + ')' : '')).join(', ')}</p>
                      )}
                    </div>
                  </div>

                  {/* Players List */}
                  <div>
                    {playersData.length === 0 ? (
                      <p className="team-print-empty">{t('teamPrint.noPlayers')}</p>
                    ) : (
                      <div className="team-print-player-list">
                        {playersData.map((player) => {
                          const shirtAssignment = team.shirtAssignments?.find(a => a.playerId === player!.id);
                          const shirtNumber = shirtAssignment?.shirtNumber;
                          
                          return (
                            <div key={player!.id} className="team-print-player-row">
                              {format === 'selection' ? (
                                <div className="team-print-player-selection">
                                  <p className="team-print-player-name">
                                    {player!.firstName} {player!.lastName}
                                  </p>
                                </div>
                              ) : (
                                <div className="team-print-player-organizer">
                                  <div className="team-print-player-identity">
                                    <p className="team-print-player-name">
                                      {player!.firstName} {player!.lastName}
                                    </p>
                                    {player!.birthDate && (
                                      <p className="team-print-birth-date">
                                        {formatBirthDate(player!.birthDate)}
                                      </p>
                                    )}
                                  </div>
                                  {shirtNumber && shirtNumber > 0 && (
                                    <span className="team-print-shirt-number">{shirtNumber}</span>
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
        </ModalBody>
    </Modal>
  );
}
