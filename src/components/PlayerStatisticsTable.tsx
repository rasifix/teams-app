import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import type { Player } from '../types';
import Level from './Level';
import { Card, CardBody } from './ui';
import PlayerLevelFilter from './PlayerLevelFilter';

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
  const navigate = useNavigate();
  const [minLevel, setMinLevel] = useState<number>(1);
  const [maxLevel, setMaxLevel] = useState<number>(5);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleReset = () => {
    setMinLevel(1);
    setMaxLevel(5);
  };

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
    <Card>
      <CardBody>        
        {/* Level Filter */}
        <PlayerLevelFilter
          minLevel={minLevel}
          maxLevel={maxLevel}
          onMinLevelChange={setMinLevel}
          onMaxLevelChange={setMaxLevel}
          onReset={handleReset}
        />
        
        {filteredPlayerStats.length === 0 ? (
          <div className="empty-state">
            <p>No player data available yet. Add players and events to see statistics.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead className="table-header hidden md:table-header-group">
                <tr>
                  <th 
                    className="table-header-cell cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    Player{getSortIndicator('name')}
                  </th>
                  <th 
                    className="table-header-cell cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('invited')}
                  >
                    Invited{getSortIndicator('invited')}
                  </th>
                  <th 
                    className="table-header-cell cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('accepted')}
                  >
                    Accepted{getSortIndicator('accepted')}
                  </th>
                  <th 
                    className="table-header-cell cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('selected')}
                  >
                    Selected{getSortIndicator('selected')}
                  </th>
                  <th 
                    className="table-header-cell cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('acceptanceRate')}
                  >
                    Acceptance Rate{getSortIndicator('acceptanceRate')}
                  </th>
                  <th 
                    className="table-header-cell cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('selectionRate')}
                  >
                    Selection Rate{getSortIndicator('selectionRate')}
                  </th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredPlayerStats.map((stat) => (
                  <tr 
                    key={stat.player.id} 
                    className="table-row cursor-pointer hover:bg-gray-50"
                    onClick={() => handlePlayerClick(stat.player.id)}
                  >
                    {/* Desktop view */}
                    <td className="table-cell hidden md:table-cell">
                      <div className="text-sm font-medium text-gray-900">
                        {stat.player.firstName} {stat.player.lastName}
                        <span className="text-xs text-muted m-2">{stat.player.birthYear}</span>
                      </div>
                      <div className="text-xs flex items-center gap-2">
                        <Level level={stat.player.level} className="text-xs" />
                      </div>
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      {stat.invitedCount}
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      {stat.acceptedCount}
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      <span className="font-semibold">{stat.selectedCount}</span>
                    </td>
                    <td className="table-cell text-gray-600 hidden md:table-cell">
                      {stat.acceptanceRate.toFixed(0)}%
                    </td>
                    <td className="table-cell text-gray-600 hidden md:table-cell">
                      {stat.selectionRate.toFixed(0)}%
                    </td>
                    
                    {/* Mobile view */}
                    <td className="px-4 py-3 md:hidden" colSpan={6}>
                      <div className="text-sm font-medium text-gray-900 mb-1 text-center">
                        {stat.player.firstName} {stat.player.lastName}{' '}
                        <span className="text-xs text-muted m-2">{stat.player.birthYear}</span>{' '}
                        <Level level={stat.player.level} className="text-xs" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{stat.invitedCount}</div>
                          <div className="text-muted">Invited</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{stat.acceptedCount} ({stat.acceptanceRate.toFixed(0)}%)</div>
                          <div className="text-muted">Accepted</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-green-600">{stat.selectedCount} ({stat.selectionRate.toFixed(0)}%)</div>
                          <div className="text-muted">Selected</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
