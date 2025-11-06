import { useNavigate } from 'react-router-dom';
import type { Player } from '../types';
import Level from './Level';
import { Card, CardBody, CardTitle } from './ui';

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

export default function PlayerStatisticsTable({ playerStats }: PlayerStatisticsTableProps) {
  const navigate = useNavigate();

  const handlePlayerClick = (playerId: string) => {
    navigate(`/players/${playerId}`);
  };

  return (
    <Card>
      <CardBody>      
        {playerStats.length === 0 ? (
          <div className="empty-state">
            <p>No player data available yet. Add players and events to see statistics.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead className="table-header hidden md:table-header-group">
                <tr>
                  <th className="table-header-cell">Player</th>
                  <th className="table-header-cell">Invited</th>
                  <th className="table-header-cell">Accepted</th>
                  <th className="table-header-cell">Selected</th>
                  <th className="table-header-cell">Acceptance Rate</th>
                  <th className="table-header-cell">Selection Rate</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {playerStats.map((stat) => (
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
