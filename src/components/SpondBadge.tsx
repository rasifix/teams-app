import { useTranslation } from 'react-i18next';

export default function SpondBadge() {
  const { t } = useTranslation();
  return <img className="icon-sm" src="/spond-logo.png" alt={t('spondSync.badge')} />;
}
