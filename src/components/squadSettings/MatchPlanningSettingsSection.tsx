import { useTranslation } from 'react-i18next';
import { Alert, Cluster, EntityContent, IconTile, Panel, PanelTitle, Split, Switch } from '../ui';

interface Props {
  enabled: boolean;
  isSaving: boolean;
  onToggle: () => void;
}

export default function MatchPlanningSettingsSection({ enabled, isSaving, onToggle }: Props) {
  const { t } = useTranslation();

  return <Panel>
    <Split align="start">
      <Cluster align="start" gap="sm" wrap={false}>
        <IconTile tone="success"><svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18M3 12h18M5.64 5.64l12.72 12.72m0-12.72L5.64 18.36" /></svg></IconTile>
        <EntityContent>
          <PanelTitle>{t('page.matchPlanning.title')}</PanelTitle>
          <p className="field-help">{t('page.matchPlanning.description')}</p>
        </EntityContent>
      </Cluster>
      <Switch checked={enabled} label={t('page.matchPlanning.title')} disabled={isSaving} onClick={onToggle} />
    </Split>
    {!enabled && <Alert tone="info">{t('page.matchPlanning.disabledState')}</Alert>}
  </Panel>;
}
