import { useTranslation } from 'react-i18next';

export default function SpondBadge() {
  const { t } = useTranslation();
  return <img className="h-5 w-5" src="/spond-logo.png" alt={t('spondSync.badge')} />;
}
