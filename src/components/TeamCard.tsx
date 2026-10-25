import { useTranslation } from 'react-i18next';
import type { TeamCardView } from '../store/selectors/teamCardSelectors';
import PlayerRow from './PlayerRow';
import Strength from './Strength';
import { Badge, Card, ChevronRightIcon, Cluster, EntityContent, EntityList, IconButton, MetadataItem, Split } from './ui';

interface TeamCardProps {
  view: TeamCardView;
  onOpenTeam: () => void;
  onShareWhatsApp?: () => void;
}

export default function TeamCard({ view, onOpenTeam, onShareWhatsApp }: TeamCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="team-card">
      <div className="team-card-header">
        <Split align="center">
          <EntityContent>
            <Cluster gap="sm">
              <h3 className="team-card-title">{view.teamName}</h3>
              <Strength level={view.teamStrength} className="team-card-strength" />
              <MetadataItem><span className="team-card-level-symbol">★</span> {view.averageLevel.toFixed(1)}</MetadataItem>
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
      </div>

      {view.playerRows.length > 0 && (
        <EntityList variant="bare" className="team-card-roster">
          {view.playerRows.map((row) => (
            <PlayerRow
              key={row.playerId}
              player={row.player}
              fallbackName={t('page.teamCard.unknownPlayer')}
              shirtNumber={row.shirtNumber}
              density="compact"
              className={`team-card-player${!row.player ? ' team-card-player--missing' : ''}`}
              content={row.hasInactiveFutureEvent ? <Badge tone="danger" size="sm" title={t('page.teamCard.inactiveIndicatorTooltip')}>
                {t('page.teamCard.inactiveIndicator')}
              </Badge> : undefined}
              levelClassName="invitation-player-level"
            />
          ))}
        </EntityList>
      )}
      <footer>
        <span>
          👤 {view.responsiblePeople.length > 0
            ? view.responsiblePeople.map((person) => `${person.firstName} ${person.lastName}`).join(', ')
            : t('page.teamCard.noResponsiblePerson')}
        </span>
        <span aria-label={t('page.teamCard.playersCount', { selected: view.selectedPlayerCount, max: view.maxPlayersPerTeam })}>
          {t('page.teamCard.playersCount', { selected: view.selectedPlayerCount, max: view.maxPlayersPerTeam })}
        </span>
      </footer>
    </Card>
  );
}
