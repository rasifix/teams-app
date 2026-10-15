import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Activity, Player } from '../types';
import { selectTeamSelectionMatrixData, type SelectionEventDetail, type TeamSelectionMode } from '../store/selectors/statisticsSelectors';
import { formatDate } from '../utils/dateFormatter';
import Level from './Level';
import LevelRangeSelector from './LevelRangeSelector';
import Strength from './Strength';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';

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
      <section className="rounded-3xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)]">
        <p>{t('statistics.teamSelections.noData')}</p>
      </section>
    );
  }

  if (matrixColumns.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-5">
          <LevelRangeSelector
            defaultRange={levelRange}
            onChange={setLevelRange}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <span className="font-semibold">{t('statistics.teamSelections.groupBy')}</span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setGroupByMode('strength')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  groupByMode === 'strength'
                    ? 'bg-white text-orange-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-pressed={groupByMode === 'strength'}
              >
                {t('statistics.teamSelections.groupByStrength')}
              </button>
              <button
                type="button"
                onClick={() => setGroupByMode('teamName')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  groupByMode === 'teamName'
                    ? 'bg-white text-orange-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-pressed={groupByMode === 'teamName'}
              >
                {t('statistics.teamSelections.groupByTeamName')}
              </button>
            </div>
          </div>
          <div className="py-12 text-center text-sm text-slate-500">
            <p>{t('statistics.teamSelections.noTeamsInPeriod')}</p>
          </div>
      </section>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)]">
        <div className="p-4 sm:p-5">
          <LevelRangeSelector
            defaultRange={levelRange}
            onChange={setLevelRange}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <span className="font-semibold">{t('statistics.teamSelections.groupBy')}</span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setGroupByMode('strength')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  groupByMode === 'strength'
                    ? 'bg-white text-orange-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-pressed={groupByMode === 'strength'}
              >
                {t('statistics.teamSelections.groupByStrength')}
              </button>
              <button
                type="button"
                onClick={() => setGroupByMode('teamName')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  groupByMode === 'teamName'
                    ? 'bg-white text-orange-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-pressed={groupByMode === 'teamName'}
              >
                {t('statistics.teamSelections.groupByTeamName')}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 px-1 text-xs text-slate-500">
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
            <div className="border-t border-slate-100 px-4 py-12 text-center text-sm text-slate-500">
              <p>{t('statistics.teamSelections.noPlayersInLevelRange')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="sticky left-0 z-10 min-w-[220px] border-r border-slate-200 bg-slate-50 px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                      {t('domain.player')}
                    </th>
                    {matrixColumns.map((matrixColumn) => (
                      <th
                        key={matrixColumn.key}
                        className="min-w-[88px] px-3 py-3 text-center text-sm font-semibold text-slate-900"
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
                    <tr key={player.id} className="border-b border-slate-100 transition hover:bg-slate-50/80">
                      <td className="sticky left-0 z-10 min-w-[220px] border-r border-slate-200 bg-white px-5 py-2.5">
                        <button
                          type="button"
                          onClick={() => handlePlayerClick(player.id)}
                          className="flex w-full items-center gap-2 text-left text-sm font-semibold text-slate-900 transition-opacity hover:opacity-70"
                        >
                          <span>{player.firstName} {player.lastName}</span>
                          <Level level={player.level} className="text-xs" />
                          <span className="ml-auto text-xs font-semibold text-slate-500">
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
                                : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100'
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
      </section>

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
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectionEvent.eventName}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{formatDate(selectionEvent.eventDate)}</p>
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
            <p className="text-sm text-slate-600">
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
