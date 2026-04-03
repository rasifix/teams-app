import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event, Player } from '../types';
import { formatDate } from '../utils/dateFormatter';
import Level from './Level';
import LevelRangeSelector from './LevelRangeSelector';
import { Card, CardBody, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';

interface TeamSelectionMatrixProps {
  players: Player[];
  events: Event[];
}

interface TeamColumn {
  key: string;
  name: string;
}

interface SelectionEventDetail {
  eventId: string;
  eventName: string;
  eventDate: string;
  teamId: string;
  teamName: string;
}

interface TeamSelectionCell {
  teamKey: string;
  count: number;
  events: SelectionEventDetail[];
}

interface TeamSelectionRow {
  player: Player;
  cells: TeamSelectionCell[];
}

interface SelectedCell {
  player: Player;
  teamName: string;
  events: SelectionEventDetail[];
}

const getTeamColumnKey = (teamName: string) => teamName.trim().toLocaleLowerCase();

const getDisplayTeamName = (teamName: string, fallbackIndex: number) => {
  const trimmedName = teamName.trim();
  return trimmedName || `Team ${fallbackIndex + 1}`;
};

export default function TeamSelectionMatrix({ players, events }: TeamSelectionMatrixProps) {
  const navigate = useNavigate();
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 5]);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const [minLevel, maxLevel] = levelRange;

  const teamColumns = useMemo(() => {
    const columns = new Map<string, TeamColumn>();

    events.forEach((event) => {
      event.teams.forEach((team, index) => {
        const displayName = getDisplayTeamName(team.name, index);
        const key = getTeamColumnKey(displayName);

        if (!columns.has(key)) {
          columns.set(key, { key, name: displayName });
        }
      });
    });

    return Array.from(columns.values()).sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [events]);

  const matrixRows = useMemo(() => {
    const filteredPlayers = players.filter((player) => (
      player.level >= minLevel && player.level <= maxLevel
    ));

    return filteredPlayers.map<TeamSelectionRow>((player) => {
      const cells = teamColumns.map<TeamSelectionCell>((teamColumn) => {
        const selectedEvents = events.flatMap((event) => (
          event.teams.flatMap((team, index) => {
            const displayName = getDisplayTeamName(team.name, index);
            const isMatchingTeam = getTeamColumnKey(displayName) === teamColumn.key;
            const isSelectedForTeam = (team.selectedPlayers || []).includes(player.id);

            if (!isMatchingTeam || !isSelectedForTeam) {
              return [];
            }

            return [{
              eventId: event.id,
              eventName: event.name,
              eventDate: event.date,
              teamId: team.id,
              teamName: displayName,
            }];
          })
        ));

        return {
          teamKey: teamColumn.key,
          count: selectedEvents.length,
          events: selectedEvents,
        };
      });

      return { player, cells };
    });
  }, [events, maxLevel, minLevel, players, teamColumns]);

  const handlePlayerClick = (playerId: string) => {
    navigate(`/players/${playerId}`);
  };

  const handleCellClick = (player: Player, teamName: string, selectionEvents: SelectionEventDetail[]) => {
    setSelectedCell({
      player,
      teamName,
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
            <p>No data available. Add players and events to see team selection statistics.</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (teamColumns.length === 0) {
    return (
      <Card>
        <CardBody>
          <LevelRangeSelector
            defaultRange={levelRange}
            onChange={setLevelRange}
          />
          <div className="empty-state">
            <p>No teams exist in the selected period.</p>
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

          <div className="mt-4 mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span>{matrixRows.length} players</span>
            <span aria-hidden="true">•</span>
            <span>{teamColumns.length} teams</span>
            <span aria-hidden="true">•</span>
            <span>Click a count to see the events</span>
          </div>

          {matrixRows.length === 0 ? (
            <div className="empty-state">
              <p>No players match the selected level range.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="sticky left-0 z-10 min-w-[220px] border-r-2 border-gray-300 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Player
                    </th>
                    {teamColumns.map((teamColumn) => (
                      <th
                        key={teamColumn.key}
                        className="min-w-[88px] px-3 py-3 text-center text-sm font-semibold text-gray-900"
                      >
                        <span className="block truncate" title={teamColumn.name}>{teamColumn.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map(({ player, cells }) => (
                    <tr key={player.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="sticky left-0 z-10 min-w-[220px] border-r border-gray-200 bg-white px-4 py-2">
                        <button
                          type="button"
                          onClick={() => handlePlayerClick(player.id)}
                          className="flex items-center gap-2 text-left text-sm font-medium text-gray-900 transition-opacity hover:opacity-70"
                        >
                          <span>{player.firstName} {player.lastName}</span>
                          <Level level={player.level} className="text-xs" />
                        </button>
                      </td>
                      {cells.map((cell, index) => (
                        <td key={`${cell.teamKey}-${index}`} className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleCellClick(player, teamColumns[index].name, cell.events)}
                            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                              cell.count > 0
                                ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                                : 'border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
                            aria-label={`${player.firstName} ${player.lastName}, ${teamColumns[index].name}, ${cell.count} selections`}
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
            {selectedCell ? `${selectedCell.player.firstName} ${selectedCell.player.lastName} - ${selectedCell.teamName}` : 'Selection details'}
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
                    Open team
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">This player has not been selected for this team in the current statistics period.</p>
          )}
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={() => setSelectedCell(null)} className="btn-secondary">
            Close
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}