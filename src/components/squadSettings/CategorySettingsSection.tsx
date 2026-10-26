import { useTranslation } from 'react-i18next';
import type { SquadCategory, SfvCategoryCatalog } from '../../types';
import { Alert, Button, Cluster, EntityContent, Field, IconTile, Panel, PanelTitle, Select } from '../ui';
import { GROUP_CATEGORIES } from '../../store/selectors/squadCategorySelectors';
import { selectIsTournamentOnlyCategory, selectOfficialMatchFormatForCategory } from '../../store/selectors/sfvCatalogSelectors';

interface Props {
  category: SquadCategory | '';
  squadCategory: SquadCategory | null | undefined;
  catalog: SfvCategoryCatalog | null;
  isSaving: boolean;
  error: string | null;
  onChange: (category: SquadCategory | '') => void;
  onSave: () => void;
}

export default function CategorySettingsSection({ category, squadCategory, catalog, isSaving, error, onChange, onSave }: Props) {
  const { t } = useTranslation();
  const officialFormat = selectOfficialMatchFormatForCategory(catalog, category || null);

  return <Panel>
    <Cluster align="start" gap="sm" wrap={false}>
      <IconTile tone="brand"><svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75c-4.5 0-8.25 2.1-8.25 4.5S7.5 12.75 12 12.75s8.25-2.1 8.25-4.5S16.5 3.75 12 3.75Zm-8.25 4.5v7.5c0 2.4 3.75 4.5 8.25 4.5s8.25-2.1 8.25-4.5v-7.5" /></svg></IconTile>
      <EntityContent>
        <PanelTitle>{t('page.matchPlanning.category.title')}</PanelTitle>
        <p className="field-help">{t('page.matchPlanning.category.description')}</p>
      </EntityContent>
    </Cluster>
    <div className="ui-form-row">
      <Field label={t('page.matchPlanning.category.label')} htmlFor="squad-category">
        <Select id="squad-category" controlSize="sm" value={category} onChange={(event) => onChange(event.target.value as SquadCategory | '')}>
          <option value="">{t('page.matchPlanning.category.none')}</option>
          {GROUP_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
      </Field>
      <Button variant="primary" size="sm" onClick={onSave} disabled={isSaving || category === (squadCategory ?? '')}>
        {isSaving ? t('page.matchPlanning.category.saving') : t('common.actions.save')}
      </Button>
    </div>
    {error && <Alert>{error}</Alert>}
    {category && officialFormat && <Alert tone="warning">{t('page.matchPlanning.category.officialModeHint', { mode: officialFormat.name })}</Alert>}
    {category && selectIsTournamentOnlyCategory(catalog, category) && <Alert tone="info">{t('page.matchPlanning.category.tournamentOnlyHint')}</Alert>}
    {category === 'FF14' && <Alert tone="info">{t('page.matchPlanning.category.ff14Hint')}</Alert>}
  </Panel>;
}
