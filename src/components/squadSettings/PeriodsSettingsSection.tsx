import { useTranslation } from 'react-i18next';
import type { Period } from '../../types';
import { AddCardButton, Cluster, EntityContent, EntityList, EntityMeta, EntityTitle, IconTile, Panel, PanelHeader, PanelTitle, SwipeableEntityRow } from '../ui';

interface Props {
  periods: Period[];
  onAdd: () => void;
  onEdit: (period: Period) => void;
  onDelete: (period: Period) => void;
}

export default function PeriodsSettingsSection({ periods, onAdd, onEdit, onDelete }: Props) {
  const { t } = useTranslation();

  return <Panel>
    <PanelHeader>
      <Cluster align="start" gap="sm" wrap={false}>
        <IconTile tone="info"><svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 9.75h16.5m-15-4.5h13.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z" /></svg></IconTile>
        <EntityContent>
          <PanelTitle>{t('page.squadSettings.periods.title')}</PanelTitle>
          <p className="field-help">{t('page.squadSettings.periods.description')}</p>
        </EntityContent>
      </Cluster>
    </PanelHeader>
    <EntityList>
      {periods.map((period) => <SwipeableEntityRow key={period.id} onEdit={() => onEdit(period)} onDelete={() => onDelete(period)}>
        <EntityContent>
          <EntityTitle>{period.name}</EntityTitle>
          <EntityMeta>{t('page.squadSettings.periods.range', { startDate: period.startDate, endDate: period.endDate })}</EntityMeta>
        </EntityContent>
      </SwipeableEntityRow>)}
      <AddCardButton cardSize="sm" label={t('page.squadSettings.periods.add')} onClick={onAdd} />
    </EntityList>
  </Panel>;
}
