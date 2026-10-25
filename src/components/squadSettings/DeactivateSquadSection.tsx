import { useTranslation } from 'react-i18next';
import { Alert, Button, Panel, PanelDescription, PanelTitle } from '../ui';

interface Props {
  error: string | null;
  onDeactivate: () => void;
}

export default function DeactivateSquadSection({ error, onDeactivate }: Props) {
  const { t } = useTranslation();

  return <Panel tone="danger" className="settings-danger-panel">
    <PanelTitle>{t('page.squadSettings.deactivate.title')}</PanelTitle>
    <PanelDescription>{t('page.squadSettings.deactivate.description')}</PanelDescription>
    {error && <Alert className="settings-danger-alert">{error}</Alert>}
    <Button className="settings-danger-action" variant="danger" size="sm" onClick={onDeactivate}>{t('page.squadSettings.deactivate.action')}</Button>
  </Panel>;
}
