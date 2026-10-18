import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Activity, Player } from '../types';
import { selectTeamSelectionMatrixData, type SelectionEventDetail, type TeamSelectionMode } from '../store/selectors/statisticsSelectors';
import { formatDate } from '../utils/dateFormatter';
import Level from './Level';
import LevelRangeSelector from './LevelRangeSelector';
import Strength from './Strength';
import { Button, EmptyState, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Panel, Tab, TabList } from './ui';

interface TeamSelectionMatrixProps {
  players: Player[];
  events: Activity[];
}

interface SelectedCell {
  player: Player;
  groupLabel: string;
  mode: TeamSelectionMode;
  events: SelectionEventDetail[];
}

export default function TeamSelectionMatrix({ players, events }: TeamSelectionMatrixProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 5]);
  const [groupByMode, setGroupByMode] = useState<TeamSelectionMode>('strength');
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const { columns: matrixColumns, rows: matrixRows } = useMemo(
    () => selectTeamSelectionMatrixData(
      players,
      events,
      levelRange,
      groupByMode,
      (strength) => t('statistics.teamSelections.strengthLabel', { level: strength }),
      t('domain.team')
    ),
    [events, groupByMode, levelRange, players, t]
  );

  const handlePlayerClick = (playerId: string) => {
    navigate(`/players/${playerId}`);
  };

  const handleCellClick = (
    player: Player,
    groupLabel: string,
    selectionEvents: SelectionEventDetail[]
  ) => {
    setSelectedCell({
      player,
      groupLabel,
      mode: groupByMode,
      events: selectionEvents,
    });
  };

  const handleOpenTeam = (eventId: string, teamId: string) => {
    navigate(`/events/${eventId}/teams/${teamId}`);
    setSelectedCell(null);
  };

  if (players.length === 0 || events.length === 0) {
    return (
      <section className="statistics-matrix-empty">
        <p>{t('statistics.teamSelections.noData')}</p>
      </section>
    );
  }

  if (matrixColumns.length === 0) {
    return (
      <Panel padding="none" className="statistics-controls">
          <LevelRangeSelector
            defaultRange={levelRange}
            onChange={setLevelRange}
          />
          <div className="selection-matrix-grouping">
            <span className="font-semibold">{t('statistics.teamSelections.groupBy')}</span>
            <TabList label={t('statistics.teamSelections.groupBy')}>
              <Tab
                selected={groupByMode === 'strength'}
                onClick={() => setGroupByMode('strength')}
              >
                {t('statistics.teamSelections.groupByStrength')}
              </Tab>
              <Tab
                selected={groupByMode === 'teamName'}
                onClick={() => setGroupByMode('teamName')}
              >
                {t('statistics.teamSelections.groupByTeamName')}
              </Tab>
            </TabList>
          </div>
          <EmptyState>
            <p>{t('statistics.teamSelections.noTeamsInPeriod')}</p>
          </EmptyState>
      </Panel>
    );
  }

  return (
    <>
      <Panel padding="none">
        <div className="statistics-controls">
          <LevelRangeSelector
            defaultRange={levelRange}
            onChange={setLevelRange}
          />

          <div className="selection-matrix-grouping">
            <span className="font-semibold">{t('statistics.teamSelections.groupBy')}</span>
            <TabList label={t('statistics.teamSelections.groupBy')}>
              <Tab
                selected={groupByMode === 'strength'}
                onClick={() => setGroupByMode('strength')}
              >
                {t('statistics.teamSelections.groupByStrength')}
              </Tab>
              <Tab
                selected={groupByMode === 'teamName'}
                onClick={() => setGroupByMode('teamName')}
              >
                {t('statistics.teamSelections.groupByTeamName')}
              </Tab>
            </TabList>
          </div>

          <div className="selection-matrix-meta">
            <span>{t('statistics.teamSelections.playersCount', { count: matrixRows.length })}</span>
            <span aria-hidden="true">•</span>
            <span>
              {groupByMode === 'strength'
                ? t('statistics.teamSelections.strengthGroupsCount', { count: matrixColumns.length })
                : t('statistics.teamSelections.teamsCount', { count: matrixColumns.length })}
            </span>
            <span aria-hidden="true">•</span>
            <span>{t('statistics.teamSelections.clickCountHint')}</span>
          </div>
        </div>

          {matrixRows.length === 0 ? (
            <div className="statistics-empty-section">
              <p>{t('statistics.teamSelections.noPlayersInLevelRange')}</p>
            </div>
          ) : (
            <div className="statistics-scroll">
              <table className="statistics-matrix-table">
                <thead>
                  <tr className="statistics-matrix-heading-row">
                    <th className="statistics-matrix-player-heading">
                      {t('domain.player')}
                    </th>
                    {matrixColumns.map((matrixColumn) => (
                      <th
                        key={matrixColumn.key}
                        className="selection-matrix-column-heading"
                      >
                        {groupByMode === 'strength' && matrixColumn.strength !== undefined ? (
                          <span className="inline-flex items-center justify-center" title={matrixColumn.label}>
                            <Strength level={matrixColumn.strength} />
                            <span className="sr-only">{matrixColumn.label}</span>
                          </span>
                        ) : (
                          <span className="block truncate" title={matrixColumn.label}>{matrixColumn.label}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map(({ player, selectedCount, acceptedCount, cells }) => (
                    <tr key={player.id} className="statistics-matrix-row">
                      <td className="statistics-matrix-player-cell">
                        <button
                          type="button"
                          data-ui-control="composite"
                          onClick={() => handlePlayerClick(player.id)}
                          className="selection-matrix-player-button"
                        >
                          <span>{player.firstName} {player.lastName}</span>
                          <Level level={player.level} className="text-xs" />
                          <span className="selection-matrix-player-count">
                            {selectedCount} / {acceptedCount}
                          </span>
                        </button>
                      </td>
                      {cells.map((cell, index) => (
                        <td key={`${cell.columnKey}-${index}`} className="selection-matrix-cell">
                          <button
                            type="button"
                            data-ui-control="composite"
                            onClick={() => handleCellClick(player, matrixColumns[index].label, cell.events)}
                            className={`selection-matrix-cell-button${cell.count > 0 ? ' selection-matrix-cell-button--selected' : ''}`}
                            aria-label={t('statistics.teamSelections.cellAriaLabel', {
                              player: `${player.firstName} ${player.lastName}`,
                              group: matrixColumns[index].label,
                              count: cell.count,
                            })}
                          >
                            {cell.count}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Panel>

      <Modal isOpen={selectedCell !== null} onClose={() => setSelectedCell(null)}>
        <ModalHeader>
          <ModalTitle>
            {selectedCell ? `${selectedCell.player.firstName} ${selectedCell.player.lastName} - ${selectedCell.groupLabel}` : t('statistics.teamSelections.selectionDetails')}
          </ModalTitle>
        </ModalHeader>
        <ModalBody className="layout-stack">
          {selectedCell && selectedCell.events.length > 0 ? (
            <div className="layout-stack layout-stack--sm">
              {selectedCell.events.map((selectionEvent) => (
                <div
                  key={`${selectionEvent.eventId}-${selectionEvent.teamId}`}
                  className="selection-matrix-event"
                >
                  <div>
                    <p className="text-sm font-semibold text-content-strong">{selectionEvent.eventName}</p>
                    <p className="mt-0.5 text-sm text-content-subtle">{formatDate(selectionEvent.eventDate)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleOpenTeam(selectionEvent.eventId, selectionEvent.teamId)}
                    className="whitespace-nowrap"
                  >
                    {t('statistics.teamSelections.openTeam')}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="body-muted">
              {selectedCell?.mode === 'strength'
                ? t('statistics.teamSelections.noSelectionStrength')
                : t('statistics.teamSelections.noSelectionTeam')}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => setSelectedCell(null)}>
            {t('common.actions.close')}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
