import { useTranslation } from 'react-i18next';
import type { DragEvent } from 'react';
import type { TeamCardView } from '../store/selectors/teamCardSelectors';
import PlayerRow from './PlayerRow';
import Strength from './Strength';
import styles from './TeamCard.module.css';
import { Badge, Card, CardHeader, CardFooter, ChevronRightIcon, Cluster, DragHandleIcon, EmptyState, EntityContent, EntityList, EntityTitle, IconButton, MetadataItem, Split } from './ui';

interface TeamCardProps {
  view: TeamCardView;
  onOpenTeam: () => void;
  onShareWhatsApp?: () => void;
  dragEnabled?: boolean;
  dropState?: 'active' | 'invalid' | null;
  onPlayerDragStart?: (event: DragEvent<HTMLElement>, playerId: string) => void;
  onPlayerDragEnd?: () => void;
  onDragOver?: (event: DragEvent<HTMLElement>) => void;
  onDragLeave?: (event: DragEvent<HTMLElement>) => void;
  onDrop?: (event: DragEvent<HTMLElement>) => void;
}

export default function TeamCard({ view, onOpenTeam, onShareWhatsApp, dragEnabled = false, dropState, onPlayerDragStart, onPlayerDragEnd, onDragOver, onDragLeave, onDrop }: TeamCardProps) {
  const { t } = useTranslation();

  return (
    <Card className={`team-card${dropState ? ` ui-drop-target--${dropState}` : ''}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <CardHeader>
        <Split align="center">
          <EntityContent>
            <Cluster gap="sm">
              <EntityTitle>{view.teamName}</EntityTitle>
              <Strength level={view.teamStrength} className="text-caption" />
              <MetadataItem><span className="text-rating">★</span> {view.averageLevel.toFixed(1)}</MetadataItem>
            </Cluster>
          </EntityContent>
          <Cluster gap="sm">
            {onShareWhatsApp && <IconButton label={t('page.eventDetail.shareWhatsApp')} disabled={view.selectedPlayerCount === 0} onClick={onShareWhatsApp}>
              <img className="icon-sm" src="/whatsapp.svg" alt="" aria-hidden="true" />
            </IconButton>}
            <IconButton label={t('page.events.openTeamDetails', { team: view.teamName })} onClick={onOpenTeam}>
              <ChevronRightIcon className="icon-sm" />
            </IconButton>
          </Cluster>
        </Split>
      </CardHeader>

      {view.playerRows.length === 0 ? (
        <EmptyState className={styles.emptyState}>{t('page.teamDetail.noPlayersSelected')}</EmptyState>
      ) : (
        <EntityList variant="bare" className="team-card-roster">
          {view.playerRows.map((row) => (
            <PlayerRow
              key={row.playerId}
              player={row.player}
              fallbackName={t('page.teamCard.unknownPlayer')}
              shirtNumber={row.shirtNumber}
              density="compact"
              className={`team-card-player${!row.player ? ' team-card-player--missing' : ''}`}
              leading={dragEnabled ? <DragHandleIcon /> : undefined}
              draggable={dragEnabled && Boolean(row.player)}
              onDragStart={(event) => onPlayerDragStart?.(event, row.playerId)}
              onDragEnd={onPlayerDragEnd}
              content={row.hasInactiveFutureEvent ? <Badge tone="danger" size="sm" title={t('page.teamCard.inactiveIndicatorTooltip')}>
                {t('page.teamCard.inactiveIndicator')}
              </Badge> : undefined}

            />
          ))}
        </EntityList>
      )}
      <CardFooter>
        <span>
          👤 {view.responsiblePeople.length > 0
            ? view.responsiblePeople.map((person) => `${person.firstName} ${person.lastName}`).join(', ')
            : t('page.teamCard.noResponsiblePerson')}
        </span>
        <span aria-label={t('page.teamCard.playersCount', { selected: view.selectedPlayerCount, max: view.maxPlayersPerTeam })}>
          {t('page.teamCard.playersCount', { selected: view.selectedPlayerCount, max: view.maxPlayersPerTeam })}
        </span>
      </CardFooter>
    </Card>
  );
}
