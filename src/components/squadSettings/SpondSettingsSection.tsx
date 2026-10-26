import { useTranslation } from 'react-i18next';
import { Alert, Button, ButtonAnchor, ButtonLink, Cluster, EntityContent, IconTile, Panel, PanelTitle } from '../ui';

interface Props {
  groupUrl: string | null;
  error: string | null;
  onUnlink: () => void;
}

export default function SpondSettingsSection({ groupUrl, error, onUnlink }: Props) {
  const { t } = useTranslation();

  return <Panel>
    <Cluster align="start" gap="sm" wrap={false}>
      <IconTile tone="brand"><svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12.75 10.5 15l5.25-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></IconTile>
      <EntityContent>
        <PanelTitle>{t('page.squadSettings.spond.title')}</PanelTitle>
        <p className="field-help">{t('page.squadSettings.spond.description')}</p>
      </EntityContent>
    </Cluster>
    {error && <Alert>{error}</Alert>}
    <Cluster gap="sm">
      {groupUrl ? <>
        <ButtonAnchor size="sm" href={groupUrl} target="_blank" rel="noreferrer">
          {t('page.squadSettings.spond.openGroup')}
        </ButtonAnchor>
        <Button variant="danger" size="sm" onClick={onUnlink}>{t('page.squadSettings.spond.unlinkGroup')}</Button>
      </> : <ButtonLink size="sm" to="/spond-import">{t('page.squadSettings.spond.linkGroup')}</ButtonLink>}
    </Cluster>
  </Panel>;
}
