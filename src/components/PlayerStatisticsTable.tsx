import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getBirthYear } from '../utils/birthDate';
import {
  selectVisiblePlayerStatistics,
  type PlayerActivityStatistics,
  type PlayerStatisticsSortField,
  type SortDirection,
} from '../store/selectors/statisticsSelectors';
import Level from './Level';
import LevelRangeSelector from './LevelRangeSelector';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  DataTableSortButton,
  EmptyState,
  FilterBar,
  ListAction,
  ListFrame,
  Panel,
  PanelBody,
  ResponsiveView,
  StickyMatrix,
} from './ui';

interface PlayerStatisticsTableProps {
  playerStats: PlayerActivityStatistics[];
  onOpenPlayer: (playerId: string) => void;
}

export default function PlayerStatisticsTable({ playerStats, onOpenPlayer }: PlayerStatisticsTableProps) {
  const { t } = useTranslation();
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [sortField, setSortField] = useState<PlayerStatisticsSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const visiblePlayerStats = useMemo(
    () => selectVisiblePlayerStatistics(playerStats, selectedLevels, sortField, sortDirection),
    [selectedLevels, playerStats, sortDirection, sortField],
  );

  const handleSort = (field: PlayerStatisticsSortField) => {
    if (sortField === field) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortField(field);
    setSortDirection(field === 'name' ? 'asc' : 'desc');
  };

  const sortHeader = (field: PlayerStatisticsSortField, label: string) => (
    <DataTableHeaderCell aria-sort={sortField === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <DataTableSortButton
        active={sortField === field}
        direction={sortDirection}
        onClick={() => handleSort(field)}
      >
        {label}
      </DataTableSortButton>
    </DataTableHeaderCell>
  );

  return (
    <Panel padding="none">
      <PanelBody>
        <FilterBar><LevelRangeSelector selectedLevels={selectedLevels} onChange={setSelectedLevels} /></FilterBar>
      </PanelBody>

      {visiblePlayerStats.length === 0 ? (
        <PanelBody>
          <EmptyState>{t('page.statistics.playerTable.emptyState')}</EmptyState>
        </PanelBody>
      ) : (
        <>
          <ResponsiveView show="desktop">
            <StickyMatrix>
              <DataTable>
                <DataTableHead>
                  <DataTableRow>
                    {sortHeader('name', t('domain.player.label'))}
                    {sortHeader('invited', t('page.statistics.playerTable.invited'))}
                    {sortHeader('accepted', t('page.statistics.playerTable.accepted'))}
                    {sortHeader('selected', t('page.statistics.playerTable.selected'))}
                    {sortHeader('acceptanceRate', t('page.statistics.playerTable.acceptanceRate'))}
                    {sortHeader('selectionRate', t('page.statistics.playerTable.selectionRate'))}
                  </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                  {visiblePlayerStats.map((statistic) => (
                    <DataTableRow key={statistic.player.id} highlight>
                      <DataTableCell>
                        <button
                          type="button"
                          data-ui-control="composite"
                          className="player-statistics-link"
                          onClick={() => onOpenPlayer(statistic.player.id)}
                        >
                          <span>{statistic.player.firstName} {statistic.player.lastName}</span>
                          <Level level={statistic.player.level} />
                        </button>
                      </DataTableCell>
                      <DataTableCell>{statistic.invitedCount}</DataTableCell>
                      <DataTableCell>{statistic.acceptedCount}</DataTableCell>
                      <DataTableCell strong>{statistic.selectedCount}</DataTableCell>
                      <DataTableCell>{statistic.acceptanceRate.toFixed(0)}%</DataTableCell>
                      <DataTableCell>{statistic.selectionRate.toFixed(0)}%</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </StickyMatrix>
          </ResponsiveView>

          <ResponsiveView show="mobile">
            <PanelBody padding="compact">
              <ListFrame>
                {visiblePlayerStats.map((statistic) => (
                  <ListAction
                    key={statistic.player.id}
                    className="player-statistics-mobile-action"
                    onClick={() => onOpenPlayer(statistic.player.id)}
                  >
                    <span className="player-statistics-mobile-title">
                      <span>{statistic.player.firstName} {statistic.player.lastName}</span>
                      <span className="player-statistics-birth-year">{getBirthYear(statistic.player.birthDate)}</span>
                      <Level level={statistic.player.level} />
                    </span>
                    <span className="player-statistics-metrics">
                      <span>
                        <strong>{statistic.invitedCount}</strong>
                        <span>{t('page.statistics.playerTable.invited')}</span>
                      </span>
                      <span>
                        <strong>{statistic.acceptedCount} ({statistic.acceptanceRate.toFixed(0)}%)</strong>
                        <span>{t('page.statistics.playerTable.accepted')}</span>
                      </span>
                      <span className="player-statistics-metric--success">
                        <strong>{statistic.selectedCount} ({statistic.selectionRate.toFixed(0)}%)</strong>
                        <span>{t('page.statistics.playerTable.selected')}</span>
                      </span>
                    </span>
                  </ListAction>
                ))}
              </ListFrame>
            </PanelBody>
          </ResponsiveView>
        </>
      )}
    </Panel>
  );
}
