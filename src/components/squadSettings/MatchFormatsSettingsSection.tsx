import { TrashIcon } from '../ui';
import { useTranslation } from 'react-i18next';
import type { MatchFormat } from '../../types';
import { AddCardButton, Alert, Badge, Button, Cluster, EntityActions, EntityContent, EntityList, EntityMeta, EntityTitle, IconButton, Panel, PanelHeader, PanelTitle, SwipeableEntityRow } from '../ui';
import { selectIsOfficialMatchFormat } from '../../store/selectors/sfvCatalogSelectors';

interface Props {
  formats: MatchFormat[];
  referencedIds: Set<string>;
  error: string | null;
  onAdd: () => void;
  onEdit: (format: MatchFormat) => void;
  onDelete: (format: MatchFormat) => void;
  onSetDefault: (id: string) => void;
}

export default function MatchFormatsSettingsSection({ formats, referencedIds, error, onAdd, onEdit, onDelete, onSetDefault }: Props) {
  const { t } = useTranslation();

  return <Panel>
    <PanelHeader><PanelTitle>{t('page.matchPlanning.matchFormats.title')}</PanelTitle></PanelHeader>
    {error && <Alert>{error}</Alert>}
    <EntityList>
      {formats.map((format) => {
        const isOfficial = selectIsOfficialMatchFormat(format);
        const canDelete = !referencedIds.has(format.id);
        return <SwipeableEntityRow key={format.id} align="start" onDelete={canDelete ? () => onDelete(format) : undefined} showDesktopDelete={false}>
          <EntityContent>
            <Cluster gap="sm">
              <EntityTitle>{format.name}</EntityTitle>
              {format.isDefault && <Badge tone="brand" size="sm">{t('page.matchPlanning.matchFormats.defaultBadge')}</Badge>}
              {isOfficial && <Badge tone="info" size="sm">{t('page.matchPlanning.matchFormats.officialBadge')}</Badge>}
            </Cluster>
            {format.playersOnField !== undefined && <EntityMeta>{t('page.matchPlanning.matchFormats.players', { onField: format.playersOnField, min: format.minPlayersPerTeam ?? '-', max: format.maxPlayersPerTeam ?? '-' })}</EntityMeta>}
            <EntityMeta>{t('page.matchPlanning.matchFormats.summary', { periods: format.numberOfPeriods, minutes: format.periodLengthMinutes })}</EntityMeta>
            <EntityMeta>{t('page.matchPlanning.matchFormats.minimumPeriods', { count: format.minimumPeriodsPerPlayer ?? 0 })}</EntityMeta>
          </EntityContent>
          <EntityActions className="ui-entity-actions--separated">
            {!format.isDefault && <Button variant="ghost" size="sm" onClick={() => onSetDefault(format.id)}>{t('page.matchPlanning.matchFormats.setDefault')}</Button>}
            {!isOfficial && <IconButton label={t('common.actions.edit')} onClick={() => onEdit(format)}><svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487Z" /></svg></IconButton>}
            {canDelete && <IconButton label={t('common.actions.delete')} variant="danger" onClick={() => onDelete(format)}><TrashIcon /></IconButton>}
          </EntityActions>
        </SwipeableEntityRow>;
      })}
      <AddCardButton cardSize="sm" label={t('common.actions.add')} onClick={onAdd} />
    </EntityList>
  </Panel>;
}
