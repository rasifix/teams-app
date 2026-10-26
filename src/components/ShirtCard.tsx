import { TrashIcon } from './ui';
import type { Shirt } from '../types';
import { useTranslation } from 'react-i18next';
import { Badge, Cluster, IconButton } from './ui';

interface ShirtCardProps {
  shirt: Shirt;
  onEdit: () => void;
  onRemove: () => void;
}

export default function ShirtCard({
  shirt,
  onEdit,
  onRemove,
}: ShirtCardProps) {
  const { t } = useTranslation();

  return (
    <div 
      className={`shirt-card ${
        shirt.status === 'unavailable'
          ? 'shirt-card--unavailable'
          : shirt.isGoalkeeper
            ? 'shirt-card--goalkeeper'
            : ''
      }`}
    >
      <Cluster gap="sm">
        <span className="text-number">#{shirt.number}</span>
        <span className="text-caption">{shirt.size}</span>
        {shirt.status === 'unavailable' && (
          <Badge tone="danger" size="sm">{t('domain.shirt.labels.unavailableShort')}</Badge>
        )}
        {shirt.isGoalkeeper && (
          <Badge tone="warning" size="sm">{t('domain.shirt.labels.goalkeeperShort')}</Badge>
        )}
      </Cluster>
      <Cluster gap="sm" wrap={false}>
        <IconButton
          label={t('page.shirts.editShirt')}
          onClick={onEdit}
        >
          <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
          </svg>
        </IconButton>
        <IconButton
          label={t('page.shirts.removeShirt')}
          variant="danger"
          onClick={onRemove}
        >
          <TrashIcon />
        </IconButton>
      </Cluster>
    </div>
  );
}
