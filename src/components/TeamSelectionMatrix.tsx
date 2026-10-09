import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Activity, Player } from '../types';
import { selectTeamSelectionMatrixData, type SelectionEventDetail, type TeamSelectionMode } from '../store/selectors/statisticsSelectors';
import { formatDate } from '../utils/dateFormatter';
import Level from './Level';
import LevelRangeSelector from './LevelRangeSelector';
import Strength from './Strength';
import { Card, CardBody, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';

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
      <Card>
        <CardBody>
          <div className="empty-state">
            <p>{t('statistics.teamSelections.noData')}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (matrixColumns.length === 0) {
    return (
      <Card>
        <CardBody>
          <LevelRangeSelector
            defaultRange={levelRange}
            onChange={setLevelRange}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">{t('statistics.teamSelections.groupBy')}</span>
            <div className="inline-flex rounded-md border border-gray-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setGroupByMode('strength')}
                className={`rounded px-3 py-1 text-sm transition-colors ${
                  groupByMode === 'strength'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-pressed={groupByMode === 'strength'}
              >
                {t('statistics.teamSelections.groupByStrength')}
              </button>
              <button
                type="button"
                onClick={() => setGroupByMode('teamName')}
                className={`rounded px-3 py-1 text-sm transition-colors ${
                  groupByMode === 'teamName'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-pressed={groupByMode === 'teamName'}
              >
                {t('statistics.teamSelections.groupByTeamName')}
              </button>
            </div>
          </div>
          <div className="empty-state">
            <p>{t('statistics.teamSelections.noTeamsInPeriod')}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardBody>
          <LevelRangeSelector
            defaultRange={levelRange}
            onChange={setLevelRange}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">{t('statistics.teamSelections.groupBy')}</span>
            <div className="inline-flex rounded-md border border-gray-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setGroupByMode('strength')}
                className={`rounded px-3 py-1 text-sm transition-colors ${
                  groupByMode === 'strength'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-pressed={groupByMode === 'strength'}
              >
                {t('statistics.teamSelections.groupByStrength')}
              </button>
              <button
                type="button"
                onClick={() => setGroupByMode('teamName')}
                className={`rounded px-3 py-1 text-sm transition-colors ${
                  groupByMode === 'teamName'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-pressed={groupByMode === 'teamName'}
              >
                {t('statistics.teamSelections.groupByTeamName')}
              </button>
            </div>
          </div>

          <div className="mt-4 mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
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

          {matrixRows.length === 0 ? (
            <div className="empty-state">
              <p>{t('statistics.teamSelections.noPlayersInLevelRange')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="sticky left-0 z-10 min-w-[220px] border-r-2 border-gray-300 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('domain.player')}
                    </th>
                    {matrixColumns.map((matrixColumn) => (
                      <th
                        key={matrixColumn.key}
                        className="min-w-[88px] px-3 py-3 text-center text-sm font-semibold text-gray-900"
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
                    <tr key={player.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="sticky left-0 z-10 min-w-[220px] border-r border-gray-200 bg-white px-4 py-2">
                        <button
                          type="button"
                          onClick={() => handlePlayerClick(player.id)}
                          className="flex w-full items-center gap-2 text-left text-sm font-medium text-gray-900 transition-opacity hover:opacity-70"
                        >
                          <span>{player.firstName} {player.lastName}</span>
                          <Level level={player.level} className="text-xs" />
                          <span className="ml-auto text-xs font-semibold text-gray-600">
                            {selectedCount} / {acceptedCount}
                          </span>
                        </button>
                      </td>
                      {cells.map((cell, index) => (
                        <td key={`${cell.columnKey}-${index}`} className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleCellClick(player, matrixColumns[index].label, cell.events)}
                            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                              cell.count > 0
                                ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                                : 'border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
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
        </CardBody>
      </Card>

      <Modal isOpen={selectedCell !== null} onClose={() => setSelectedCell(null)}>
        <ModalHeader>
          <ModalTitle>
            {selectedCell ? `${selectedCell.player.firstName} ${selectedCell.player.lastName} - ${selectedCell.groupLabel}` : t('statistics.teamSelections.selectionDetails')}
          </ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4">
          {selectedCell && selectedCell.events.length > 0 ? (
            <div className="space-y-3">
              {selectedCell.events.map((selectionEvent) => (
                <div
                  key={`${selectionEvent.eventId}-${selectionEvent.teamId}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectionEvent.eventName}</p>
                    <p className="text-sm text-gray-600">{formatDate(selectionEvent.eventDate)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenTeam(selectionEvent.eventId, selectionEvent.teamId)}
                    className="btn-secondary whitespace-nowrap"
                  >
                    {t('statistics.teamSelections.openTeam')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {selectedCell?.mode === 'strength'
                ? t('statistics.teamSelections.noSelectionStrength')
                : t('statistics.teamSelections.noSelectionTeam')}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={() => setSelectedCell(null)} className="btn-secondary">
            {t('common.actions.close')}
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}