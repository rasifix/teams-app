import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity, Player } from '../types';
import { selectTeamSelectionMatrixData, type SelectionEventDetail, type TeamSelectionMode } from '../store/selectors/statisticsSelectors';
import { formatDate } from '../utils/dateFormatter';
import Level from './Level';
import LevelRangeSelector from './LevelRangeSelector';
import Strength from './Strength';
import { Button, Cluster, DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeaderCell, DataTableRow, EmptyState, EntityActions, EntityContent, EntityList, EntityMeta, EntityRow, EntityTitle, FilterBar, MetadataItem, MetadataList, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Panel, PanelBody, Stack, StickyMatrix, Tab, TabList, VisuallyHidden } from './ui';

interface TeamSelectionMatrixProps {
  players: Player[];
  events: Activity[];
  onOpenPlayer: (playerId: string) => void;
  onOpenTeam: (activityId: string, teamId: string) => void;
}

interface SelectedCell {
  player: Player;
  groupLabel: string;
  mode: TeamSelectionMode;
  events: SelectionEventDetail[];
}

export default function TeamSelectionMatrix({ players, events, onOpenPlayer, onOpenTeam }: TeamSelectionMatrixProps) {
  const { t } = useTranslation();
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [groupByMode, setGroupByMode] = useState<TeamSelectionMode>('strength');
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const { columns: matrixColumns, rows: matrixRows } = useMemo(
    () => selectTeamSelectionMatrixData(
      players,
      events,
      selectedLevels,
      groupByMode,
      (strength) => t('page.statistics.teamSelections.strengthLabel', { level: strength }),
      t('domain.team.label')
    ),
    [events, groupByMode, selectedLevels, players, t]
  );

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
    onOpenTeam(eventId, teamId);
    setSelectedCell(null);
  };

  if (players.length === 0 || events.length === 0) {
    return (
      <EmptyState>{t('page.statistics.teamSelections.noData')}</EmptyState>
    );
  }

  if (matrixColumns.length === 0) {
    return (
      <Panel>
        <Stack>
          <FilterBar><LevelRangeSelector selectedLevels={selectedLevels} onChange={setSelectedLevels} /></FilterBar>
          <Cluster gap="sm">
            <strong>{t('page.statistics.teamSelections.groupBy')}</strong>
            <TabList label={t('page.statistics.teamSelections.groupBy')}>
              <Tab
                selected={groupByMode === 'strength'}
                onClick={() => setGroupByMode('strength')}
              >
                {t('page.statistics.teamSelections.groupByStrength')}
              </Tab>
              <Tab
                selected={groupByMode === 'teamName'}
                onClick={() => setGroupByMode('teamName')}
              >
                {t('page.statistics.teamSelections.groupByTeamName')}
              </Tab>
            </TabList>
          </Cluster>
          <EmptyState>
            <p>{t('page.statistics.teamSelections.noTeamsInPeriod')}</p>
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
            <FilterBar><LevelRangeSelector selectedLevels={selectedLevels} onChange={setSelectedLevels} /></FilterBar>
            <Cluster gap="sm">
              <strong>{t('page.statistics.teamSelections.groupBy')}</strong>
              <TabList label={t('page.statistics.teamSelections.groupBy')}>
                <Tab selected={groupByMode === 'strength'} onClick={() => setGroupByMode('strength')}>
                  {t('page.statistics.teamSelections.groupByStrength')}
                </Tab>
                <Tab selected={groupByMode === 'teamName'} onClick={() => setGroupByMode('teamName')}>
                  {t('page.statistics.teamSelections.groupByTeamName')}
                </Tab>
              </TabList>
            </Cluster>
            <MetadataList>
              <MetadataItem>{t('page.statistics.teamSelections.playersCount', { count: matrixRows.length })}</MetadataItem>
              <MetadataItem>
              {groupByMode === 'strength'
                ? t('page.statistics.teamSelections.strengthGroupsCount', { count: matrixColumns.length })
                : t('page.statistics.teamSelections.teamsCount', { count: matrixColumns.length })}
              </MetadataItem>
              <MetadataItem>{t('page.statistics.teamSelections.clickCountHint')}</MetadataItem>
            </MetadataList>
          </Stack>
        </PanelBody>

          {matrixRows.length === 0 ? (
            <PanelBody><EmptyState>{t('page.statistics.teamSelections.noPlayersInLevelRange')}</EmptyState></PanelBody>
          ) : (
            <StickyMatrix>
              <DataTable density="compact">
                <DataTableHead>
                  <DataTableRow>
                    <DataTableHeaderCell sticky className="statistics-matrix-player-heading">
                      {t('domain.player.label')}
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
                          onClick={() => onOpenPlayer(player.id)}
                          className="text-link selection-matrix-player-button"
                        >
                          <span>{player.firstName} {player.lastName}</span>
                          <Level level={player.level} className="text-caption" />
                          <span className="text-caption selection-matrix-player-count">
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
                            aria-label={t('page.statistics.teamSelections.cellAriaLabel', {
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
            {selectedCell ? `${selectedCell.player.firstName} ${selectedCell.player.lastName} – ${selectedCell.groupLabel}` : t('page.statistics.teamSelections.selectionDetails')}
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
                      {t('page.statistics.teamSelections.openTeam')}
                    </Button>
                  </EntityActions>
                </EntityRow>
              ))}
            </EntityList>
          ) : (
            <p className="body-muted">
              {selectedCell?.mode === 'strength'
                ? t('page.statistics.teamSelections.noSelectionStrength')
                : t('page.statistics.teamSelections.noSelectionTeam')}
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
