import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player } from '../types';
import Level from './Level';
import LevelRangeSelector from './LevelRangeSelector';
import { getBirthYear } from '../utils/birthDate';

interface PlayerStats {
  player: Player;
  invitedCount: number;
  acceptedCount: number;
  selectedCount: number;
  acceptanceRate: number;
  selectionRate: number;
}

interface PlayerStatisticsTableProps {
  playerStats: PlayerStats[];
}

type SortField = 'name' | 'invited' | 'accepted' | 'selected' | 'acceptanceRate' | 'selectionRate';
type SortDirection = 'asc' | 'desc';

export default function PlayerStatisticsTable({ playerStats }: PlayerStatisticsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 5]);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [minLevel, maxLevel] = levelRange;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default descending for numeric fields, ascending for name
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  // Helper function to compare by full name
  const compareByName = (a: PlayerStats, b: PlayerStats) => {
    const nameA = `${a.player.lastName} ${a.player.firstName}`.toLowerCase();
    const nameB = `${b.player.lastName} ${b.player.firstName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  };

  // Filter and sort player stats
  const filteredPlayerStats = useMemo(() => {
    const filtered = playerStats.filter(stat => 
      stat.player.level >= minLevel && stat.player.level <= maxLevel
    );

    // Sort the filtered data
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = compareByName(a, b);
          break;
        case 'invited':
          comparison = a.invitedCount - b.invitedCount;
          break;
        case 'accepted':
          comparison = a.acceptedCount - b.acceptedCount;
          break;
        case 'selected':
          comparison = a.selectedCount - b.selectedCount;
          break;
        case 'acceptanceRate':
          comparison = a.acceptanceRate - b.acceptanceRate;
          break;
        case 'selectionRate':
          comparison = a.selectionRate - b.selectionRate;
          break;
      }

      // If values are equal, use name as secondary sort
      if (comparison === 0 && sortField !== 'name') {
        comparison = compareByName(a, b);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [playerStats, minLevel, maxLevel, sortField, sortDirection]);

  const handlePlayerClick = (playerId: string) => {
    navigate(`/players/${playerId}`);
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)]">
      <div className="p-4 sm:p-5">
        <LevelRangeSelector
          defaultRange={levelRange}
          onChange={setLevelRange}
        />
      </div>

        {filteredPlayerStats.length === 0 ? (
          <div className="border-t border-slate-100 px-4 py-12 text-center text-sm text-slate-500">
            <p>{t('statistics.playerTable.emptyState')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="min-w-full">
              <thead className="hidden bg-slate-50/80 md:table-header-group">
                <tr>
                  <th 
                    className="cursor-pointer px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 transition hover:bg-slate-100"
                    onClick={() => handleSort('name')}
                  >
                    {t('domain.player')}{getSortIndicator('name')}
                  </th>
                  <th 
                    className="cursor-pointer px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 transition hover:bg-slate-100"
                    onClick={() => handleSort('invited')}
                  >
                    {t('statistics.playerTable.invited')}{getSortIndicator('invited')}
                  </th>
                  <th 
                    className="cursor-pointer px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 transition hover:bg-slate-100"
                    onClick={() => handleSort('accepted')}
                  >
                    {t('statistics.playerTable.accepted')}{getSortIndicator('accepted')}
                  </th>
                  <th 
                    className="cursor-pointer px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 transition hover:bg-slate-100"
                    onClick={() => handleSort('selected')}
                  >
                    {t('statistics.playerTable.selected')}{getSortIndicator('selected')}
                  </th>
                  <th 
                    className="cursor-pointer px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 transition hover:bg-slate-100"
                    onClick={() => handleSort('acceptanceRate')}
                  >
                    {t('statistics.playerTable.acceptanceRate')}{getSortIndicator('acceptanceRate')}
                  </th>
                  <th 
                    className="cursor-pointer px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 transition hover:bg-slate-100"
                    onClick={() => handleSort('selectionRate')}
                  >
                    {t('statistics.playerTable.selectionRate')}{getSortIndicator('selectionRate')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPlayerStats.map((stat) => (
                  <tr 
                    key={stat.player.id} 
                    className="cursor-pointer transition hover:bg-slate-50/80"
                    onClick={() => handlePlayerClick(stat.player.id)}
                  >
                    {/* Desktop view */}
                    <td className="hidden whitespace-nowrap px-5 py-3.5 md:table-cell">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <span>{stat.player.firstName} {stat.player.lastName}</span>
                        <Level level={stat.player.level} className="text-xs" />
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3.5 text-sm text-slate-600 md:table-cell">
                      {stat.invitedCount}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3.5 text-sm text-slate-600 md:table-cell">
                      {stat.acceptedCount}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3.5 text-sm md:table-cell">
                      <span className="font-semibold text-slate-900">{stat.selectedCount}</span>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3.5 text-sm text-slate-600 md:table-cell">
                      {stat.acceptanceRate.toFixed(0)}%
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3.5 text-sm text-slate-600 md:table-cell">
                      {stat.selectionRate.toFixed(0)}%
                    </td>
                    
                    {/* Mobile view */}
                    <td className="px-4 py-4 md:hidden" colSpan={6}>
                      <div className="mb-3 flex items-center justify-center text-sm font-semibold text-slate-900">
                        {stat.player.firstName} {stat.player.lastName}{' '}
                        <span className="mx-2 text-xs font-normal text-slate-400">{getBirthYear(stat.player.birthDate)}</span>{' '}
                        <Level level={stat.player.level} className="text-xs" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-xs">
                        <div className="text-center">
                          <div className="font-semibold text-slate-900">{stat.invitedCount}</div>
                          <div className="mt-0.5 text-slate-500">{t('statistics.playerTable.invited')}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-slate-900">{stat.acceptedCount} ({stat.acceptanceRate.toFixed(0)}%)</div>
                          <div className="mt-0.5 text-slate-500">{t('statistics.playerTable.accepted')}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-emerald-600">{stat.selectedCount} ({stat.selectionRate.toFixed(0)}%)</div>
                          <div className="mt-0.5 text-slate-500">{t('statistics.playerTable.selected')}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </section>
  );
}
