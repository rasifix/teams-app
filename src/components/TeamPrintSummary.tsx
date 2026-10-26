import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/dateFormatter';
import type { Activity, Team, Player, Trainer, ShirtSet } from '../types';
import { getActivityDate, getActivityTime } from '../store/selectors/activitySelectors';
import { selectTeamPrintSummaries } from '../store/selectors/teamPlayerSelectors';
import { Button, ChoiceGroup, Cluster, Modal, ModalBody, ModalHeader, ModalTitle, Radio } from './ui';

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

  const printSummaries = selectTeamPrintSummaries(event, teams, players, trainers);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="team-print-modal">
        <ModalHeader className="team-print-header">
          <div className="team-print-header-row">
            <ModalTitle>{t('page.teamPrint.title')}</ModalTitle>
            <Cluster gap="sm">
              <Button
                size="sm"
                onClick={handlePrint}
              >
                {t('page.teamPrint.print')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
              >
                {t('common.actions.close')}
              </Button>
            </Cluster>
          </div>
          
          {/* Format Toggle */}
          <div className="team-print-format">
            <span className="team-print-format-label">{t('page.teamPrint.formatLabel')}</span>
            <ChoiceGroup>
              <label className="team-print-format-option">
                <Radio
                  name="format"
                  value="guardians"
                  checked={format === 'selection'}
                  onChange={() => setFormat('selection')}
                />
                <span>{t('page.teamPrint.selectionFormat')}</span>
              </label>
              <label className="team-print-format-option">
                <Radio
                  name="format"
                  value="organizer"
                  checked={format === 'organizer'}
                  onChange={() => setFormat('organizer')}
                />
                <span>{t('page.teamPrint.organizerFormat')}</span>
              </label>
            </ChoiceGroup>
          </div>
        </ModalHeader>
        
        {/* Print content */}
        <ModalBody className="team-print-content">
          <div className="team-print-grid">
            {printSummaries.map(({ team, location, responsiblePeople, players: playerRows }) => {
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
                      {location && format === 'selection' && (
                        <p>📍 {location}</p>
                      )}
                      {team.meetingTime && <p>🕐 {t('domain.team.fields.meetingTime')}: {team.meetingTime}</p>}
                      {team.meetingLocation && <p>📍 {t('domain.team.fields.meetingLocation')}: {team.meetingLocation}</p>}
                      {responsiblePeople.length > 0 && (
                        <p className="team-print-responsible">👤 {responsiblePeople.map((person) => person.firstName + ' ' + person.lastName).join(', ')}</p>
                      )}
                    </div>
                  </div>

                  {/* Players List */}
                  <div>
                    {playerRows.length === 0 ? (
                      <p className="team-print-empty">{t('page.teamPrint.noPlayers')}</p>
                    ) : (
                      <div className="ui-stack ui-stack--sm">
                        {playerRows.map(({ player, shirtNumber }) => {
                          return (
                            <div key={player.id} className="team-print-player-row">
                              {format === 'selection' ? (
                                <div className="team-print-player-selection">
                                  <p className="team-print-player-name">
                                    {player.firstName} {player.lastName}
                                  </p>
                                </div>
                              ) : (
                                <div className="team-print-player-organizer">
                                  <div className="team-print-player-identity">
                                    <p className="team-print-player-name">
                                      {player.firstName} {player.lastName}
                                    </p>
                                    {player.birthDate && (
                                      <p className="team-print-birth-date">
                                        {formatDate(player.birthDate)}
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
