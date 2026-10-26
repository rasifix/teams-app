import { TrashIcon } from '../ui';
import { useTranslation } from 'react-i18next';
import type { Formation } from '../../types';
import { AddCardButton, Alert, Badge, EntityActions, EntityContent, EntityList, EntityTitle, IconButton, Panel, PanelHeader, PanelTitle, SwipeableEntityRow } from '../ui';
import { getPositionLabelKey, selectSlotDisplayIndexes } from '../../store/selectors/matchPlanningSelectors';

interface Props {
  formations: Formation[];
  referencedIds: Set<string>;
  error: string | null;
  onAdd: () => void;
  onEdit: (formation: Formation) => void;
  onDelete: (formation: Formation) => void;
}

export default function FormationsSettingsSection({ formations, referencedIds, error, onAdd, onEdit, onDelete }: Props) {
  const { t } = useTranslation();

  return <Panel>
    <PanelHeader><PanelTitle>{t('page.matchPlanning.formations.title')}</PanelTitle></PanelHeader>
    {error && <Alert>{error}</Alert>}
    <EntityList>
      {formations.map((formation) => {
        const displayIndexes = selectSlotDisplayIndexes(formation.slots);
        const canDelete = !referencedIds.has(formation.id);
        return <SwipeableEntityRow key={formation.id} align="start" onDelete={canDelete ? () => onDelete(formation) : undefined} showDesktopDelete={false}>
          <EntityContent>
            <EntityTitle>{formation.name}</EntityTitle>
            <div className="ui-cluster ui-cluster--wrap ui-cluster--sm">
              {formation.slots.map((slot) => {
                const displayIndex = displayIndexes.get(slot.id);
                return <Badge key={slot.id} tone="neutral" size="sm">{t(getPositionLabelKey(slot.positionCode))}{displayIndex !== null && displayIndex !== undefined ? ` ${displayIndex}` : ''}</Badge>;
              })}
            </div>
          </EntityContent>
          <EntityActions className="ui-entity-actions--separated">
            <IconButton label={t('common.actions.edit')} onClick={() => onEdit(formation)}><svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487Z" /></svg></IconButton>
            {canDelete && <IconButton label={t('common.actions.delete')} variant="danger" onClick={() => onDelete(formation)}><TrashIcon /></IconButton>}
          </EntityActions>
        </SwipeableEntityRow>;
      })}
      <AddCardButton cardSize="sm" label={t('common.actions.add')} onClick={onAdd} />
    </EntityList>
  </Panel>;
}
