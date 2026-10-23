import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ListAction,
  ListFrame,
  Panel,
  PanelBody,
  ResponsiveView,
  StickyMatrix,
} from './ui';

interface PlayerStatisticsTableProps {
  playerStats: PlayerActivityStatistics[];
}

export default function PlayerStatisticsTable({ playerStats }: PlayerStatisticsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 5]);
  const [sortField, setSortField] = useState<PlayerStatisticsSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const visiblePlayerStats = useMemo(
    () => selectVisiblePlayerStatistics(playerStats, levelRange, sortField, sortDirection),
    [levelRange, playerStats, sortDirection, sortField],
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

  const openPlayer = (playerId: string) => navigate(`/players/${playerId}`);

  return (
    <Panel padding="none">
      <PanelBody>
        <LevelRangeSelector defaultRange={levelRange} onChange={setLevelRange} />
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
                          onClick={() => openPlayer(statistic.player.id)}
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
                    onClick={() => openPlayer(statistic.player.id)}
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
