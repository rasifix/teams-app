import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity, Player } from '../types';
import { getActivityDate } from '../store/selectors/activitySelectors';
import { selectEventParticipationRows, selectNextUpcomingEventIndex } from '../store/selectors/statisticsSelectors';
import { invitationStatusMeta, invitationStatusOrder } from '../utils/invitationStatus';
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeaderCell, DataTableRow, DateColumn, EmptyState, FilterBar, Legend, LegendItem, Panel, PanelBody, Stack, StatusMarker, StickyMatrix, type SemanticTone } from './ui';
import { formatDate } from '../utils/dateFormatter';
import LevelRangeSelector from './LevelRangeSelector';
import Level from './Level';

interface EventParticipationMatrixProps {
  players: Player[];
  events: Activity[];
  onOpenPlayer: (playerId: string) => void;
  onOpenActivity: (activityId: string) => void;
}

export default function EventParticipationMatrix({ players, events, onOpenPlayer, onOpenActivity }: EventParticipationMatrixProps) {
  const { t } = useTranslation();
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleEventClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenActivity(eventId);
  };

  const sortedData = useMemo(
    () => selectEventParticipationRows(players, events, selectedLevels),
    [players, events, selectedLevels]
  );

  const getStatusIcon = (status: string): { icon: string; tone: SemanticTone } => {
    switch (status) {
      case 'selected':
        return { icon: '✓', tone: 'success' };
      case 'accepted':
        return { icon: invitationStatusMeta.accepted.icon, tone: 'neutral' };
      case 'declined':
        return { icon: invitationStatusMeta.declined.icon, tone: 'danger' };
      case 'injured':
        return { icon: invitationStatusMeta.injured.icon, tone: 'accent' };
      case 'sick':
        return { icon: invitationStatusMeta.sick.icon, tone: 'brand' };
      case 'unavailable':
        return { icon: invitationStatusMeta.unavailable.icon, tone: 'neutral' };
      case 'open':
        return { icon: invitationStatusMeta.open.icon, tone: 'warning' };
      default:
        return { icon: '-', tone: 'neutral' };
    }
  };

  // Scroll to next upcoming event on mount
  useEffect(() => {
    if (events.length === 0 || players.length === 0) return;
    if (!scrollContainerRef.current) return;

    const nextEventIndex = selectNextUpcomingEventIndex(events, new Date());

    // If we found an upcoming event, scroll to it
    if (nextEventIndex > 0) {
      // Use setTimeout to ensure DOM is rendered
      setTimeout(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Find the header cell for this event
        const headers = container.querySelectorAll('th');
        // +1 because first header is the "Player" column
        const targetHeader = headers[nextEventIndex + 1];
        
        if (targetHeader) {
          const containerRect = container.getBoundingClientRect();
          const targetRect = targetHeader.getBoundingClientRect();
          const scrollLeft = targetRect.left - containerRect.left + container.scrollLeft - 220; // 220px is the player column width
          
          container.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [events, players]);

  if (events.length === 0 || players.length === 0) {
    return (
      <EmptyState>{t('page.statistics.eventParticipation.emptyState')}</EmptyState>
    );
  }

  return (
    <Panel padding="none">
      <PanelBody>
        <Stack gap="sm">
          <FilterBar><LevelRangeSelector selectedLevels={selectedLevels} onChange={setSelectedLevels} /></FilterBar>
          <Legend>
            <LegendItem>
              <StatusMarker tone="success">✓</StatusMarker>
              <span>{t('page.statistics.playerTable.selected')}</span>
            </LegendItem>
            {invitationStatusOrder.map((status) => (
              <LegendItem key={status}>
                <StatusMarker tone={getStatusIcon(status).tone}>{invitationStatusMeta[status].icon}</StatusMarker>
                <span>{t(`domain.invitation.status.${status}`)}</span>
              </LegendItem>
            ))}
            <LegendItem>
              <StatusMarker>-</StatusMarker>
              <span>{t('domain.invitation.status.notInvited')}</span>
            </LegendItem>
          </Legend>
        </Stack>
      </PanelBody>
        <StickyMatrix ref={scrollContainerRef}>
          <DataTable density="compact">
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell sticky className="statistics-matrix-player-heading">
                  {t('domain.player.label')}
                </DataTableHeaderCell>
                {events.map(event => (
                  <DataTableHeaderCell
                    key={event.id} 
                    align="center"
                    className="participation-event-heading"
                    title={`${event.name} - ${formatDate(getActivityDate(event))}`}
                  >
                    <button
                      type="button"
                      data-ui-control="composite"
                      className="participation-event-link"
                      onClick={(e) => handleEventClick(event.id, e)}
                    >
                      <DateColumn date={getActivityDate(event)} />
                    </button>
                  </DataTableHeaderCell>
                ))}
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {sortedData.map(({ player, attendance }) => (
                <DataTableRow
                  key={player.id} 
                  highlight
                >
                  <DataTableCell sticky className="statistics-matrix-player-cell">
                    <button type="button" data-ui-control="composite" className="statistics-player-link" onClick={() => onOpenPlayer(player.id)}>
                      <span>{player.firstName} {player.lastName}</span>
                      <Level level={player.level} className="participation-player-level" />
                    </button>
                  </DataTableCell>
                  {attendance.map(({ status, event }) => {
                    const statusInfo = getStatusIcon(status);
                    return (
                      <DataTableCell
                        key={event.id}
                        align="center"
                        title={`${event.name} - ${formatDate(getActivityDate(event))}\n${t('common.labels.status')}: ${status === 'not-invited' ? t('domain.invitation.status.notInvited') : t(`domain.invitation.status.${status}`)}`}
                      >
                        <StatusMarker tone={statusInfo.tone}>{statusInfo.icon}</StatusMarker>
                      </DataTableCell>
                    );
                  })}
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </StickyMatrix>
    </Panel>
  );
}
