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
        <span className="shirt-card-number">#{shirt.number}</span>
        <span className="shirt-card-size">{shirt.size}</span>
        {shirt.status === 'unavailable' && (
          <Badge tone="danger" size="sm">{t('shirts.unavailableShort')}</Badge>
        )}
        {shirt.isGoalkeeper && (
          <Badge tone="warning" size="sm">{t('shirts.goalkeeperShort')}</Badge>
        )}
      </Cluster>
      <Cluster gap="sm" wrap={false}>
        <IconButton
          label={t('shirts.editShirt')}
          onClick={onEdit}
        >
          <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
          </svg>
        </IconButton>
        <IconButton
          label={t('shirts.removeShirt')}
          variant="danger"
          onClick={onRemove}
        >
          <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </IconButton>
      </Cluster>
    </div>
  );
}
