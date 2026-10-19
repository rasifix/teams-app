import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Activity, Player } from '../types';
import { selectTeamSelectionMatrixData, type SelectionEventDetail, type TeamSelectionMode } from '../store/selectors/statisticsSelectors';
import { formatDate } from '../utils/dateFormatter';
import Level from './Level';
import LevelRangeSelector from './LevelRangeSelector';
import Strength from './Strength';
import { Button, Cluster, DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeaderCell, DataTableRow, EmptyState, EntityActions, EntityContent, EntityList, EntityMeta, EntityRow, EntityTitle, MetadataItem, MetadataList, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Panel, PanelBody, Stack, StickyMatrix, Tab, TabList, VisuallyHidden } from './ui';

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
      <EmptyState>{t('statistics.teamSelections.noData')}</EmptyState>
    );
  }

  if (matrixColumns.length === 0) {
    return (
      <Panel>
        <Stack>
          <LevelRangeSelector
            defaultRange={levelRange}
            onChange={setLevelRange}
          />
          <Cluster gap="sm">
            <strong>{t('statistics.teamSelections.groupBy')}</strong>
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
          </Cluster>
          <EmptyState>
            <p>{t('statistics.teamSelections.noTeamsInPeriod')}</p>
          </EmptyState>
        </Stack>
      </Panel>
    );
  }

  return (
    <>
      <Panel padding="none">
        <PanelBody>
          <Stack gap="sm">
            <LevelRangeSelector defaultRange={levelRange} onChange={setLevelRange} />
            <Cluster gap="sm">
              <strong>{t('statistics.teamSelections.groupBy')}</strong>
              <TabList label={t('statistics.teamSelections.groupBy')}>
                <Tab selected={groupByMode === 'strength'} onClick={() => setGroupByMode('strength')}>
                  {t('statistics.teamSelections.groupByStrength')}
                </Tab>
                <Tab selected={groupByMode === 'teamName'} onClick={() => setGroupByMode('teamName')}>
                  {t('statistics.teamSelections.groupByTeamName')}
                </Tab>
              </TabList>
            </Cluster>
            <MetadataList>
              <MetadataItem>{t('statistics.teamSelections.playersCount', { count: matrixRows.length })}</MetadataItem>
              <MetadataItem>
              {groupByMode === 'strength'
                ? t('statistics.teamSelections.strengthGroupsCount', { count: matrixColumns.length })
                : t('statistics.teamSelections.teamsCount', { count: matrixColumns.length })}
              </MetadataItem>
              <MetadataItem>{t('statistics.teamSelections.clickCountHint')}</MetadataItem>
            </MetadataList>
          </Stack>
        </PanelBody>

          {matrixRows.length === 0 ? (
            <PanelBody><EmptyState>{t('statistics.teamSelections.noPlayersInLevelRange')}</EmptyState></PanelBody>
          ) : (
            <StickyMatrix>
              <DataTable density="compact">
                <DataTableHead>
                  <DataTableRow>
                    <DataTableHeaderCell sticky className="statistics-matrix-player-heading">
                      {t('domain.player')}
                    </DataTableHeaderCell>
                    {matrixColumns.map((matrixColumn) => (
                      <DataTableHeaderCell
                        key={matrixColumn.key}
                        align="center"
                        className="selection-matrix-column-heading"
                      >
                        {groupByMode === 'strength' && matrixColumn.strength !== undefined ? (
                          <span className="selection-matrix-strength" title={matrixColumn.label}>
                            <Strength level={matrixColumn.strength} />
                            <VisuallyHidden>{matrixColumn.label}</VisuallyHidden>
                          </span>
                        ) : (
                          <span className="selection-matrix-column-label" title={matrixColumn.label}>{matrixColumn.label}</span>
                        )}
                      </DataTableHeaderCell>
                    ))}
                  </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                  {matrixRows.map(({ player, selectedCount, acceptedCount, cells }) => (
                    <DataTableRow key={player.id} highlight>
                      <DataTableCell sticky className="statistics-matrix-player-cell">
                        <button
                          type="button"
                          data-ui-control="composite"
                          onClick={() => handlePlayerClick(player.id)}
                          className="selection-matrix-player-button"
                        >
                          <span>{player.firstName} {player.lastName}</span>
                          <Level level={player.level} className="selection-matrix-player-level" />
                          <span className="selection-matrix-player-count">
                            {selectedCount} / {acceptedCount}
                          </span>
                        </button>
                      </DataTableCell>
                      {cells.map((cell, index) => (
                        <DataTableCell key={`${cell.columnKey}-${index}`} align="center" className="selection-matrix-cell">
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
                        </DataTableCell>
                      ))}
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </StickyMatrix>
          )}
      </Panel>

      <Modal isOpen={selectedCell !== null} onClose={() => setSelectedCell(null)}>
        <ModalHeader>
          <ModalTitle>
            {selectedCell ? `${selectedCell.player.firstName} ${selectedCell.player.lastName} – ${selectedCell.groupLabel}` : t('statistics.teamSelections.selectionDetails')}
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          <Stack>
          {selectedCell && selectedCell.events.length > 0 ? (
            <EntityList variant="separated">
              {selectedCell.events.map((selectionEvent) => (
                <EntityRow
                  key={`${selectionEvent.eventId}-${selectionEvent.teamId}`}
                >
                  <EntityContent>
                    <EntityTitle>{selectionEvent.eventName}</EntityTitle>
                    <EntityMeta>{formatDate(selectionEvent.eventDate)}</EntityMeta>
                  </EntityContent>
                  <EntityActions>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleOpenTeam(selectionEvent.eventId, selectionEvent.teamId)}
                    >
                      {t('statistics.teamSelections.openTeam')}
                    </Button>
                  </EntityActions>
                </EntityRow>
              ))}
            </EntityList>
          ) : (
            <p className="body-muted">
              {selectedCell?.mode === 'strength'
                ? t('statistics.teamSelections.noSelectionStrength')
                : t('statistics.teamSelections.noSelectionTeam')}
            </p>
          )}
          </Stack>
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
