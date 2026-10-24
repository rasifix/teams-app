import { TrashIcon } from './ui';
import type { ShirtSet, Shirt } from '../types';
import { useTranslation } from 'react-i18next';
import ShirtCard from './ShirtCard';
import { selectSortedShirts } from '../store/selectors/shirtSetSelectors';
import { AddCardButton, ChevronRightIcon, Cluster, EntityContent, EntityMeta, EntityTitle, IconButton, IconTile, ShirtIcon } from './ui';

interface ShirtSetCardProps {
  shirtSet: ShirtSet;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddShirt: () => void;
  onEditShirt: (shirt: Shirt) => void;
  onRemoveShirt: (shirtId: string, shirtNumber: number) => void;
}

export default function ShirtSetCard({
  shirtSet,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onDelete,
  onAddShirt,
  onEditShirt,
  onRemoveShirt,
}: ShirtSetCardProps) {
  const { t } = useTranslation();
  const sortedShirts = selectSortedShirts(shirtSet.shirts);

  return (
    <article className="shirt-set-card">
      <div className="shirt-set-header">
        <button type="button" data-ui-control="composite" onClick={onToggleExpanded} className="shirt-set-toggle" aria-expanded={isExpanded}>
          <IconTile size="sm" className="shirt-set-icon" style={{ backgroundColor: shirtSet.color }}>
            <ShirtIcon className="icon-sm" />
          </IconTile>
          <EntityContent>
            <EntityTitle>{shirtSet.sponsor}</EntityTitle>
            <EntityMeta><span>{t('page.shirts.shirtCount', { count: shirtSet.shirts.length })}</span></EntityMeta>
          </EntityContent>
          <ChevronRightIcon className={`shirt-set-chevron${isExpanded ? ' shirt-set-chevron--expanded' : ''}`} />
        </button>
        <Cluster gap="sm" wrap={false} className="shirt-set-actions">
          <IconButton label={t('page.shirts.editSet')} onClick={onEdit}>
            <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
            </svg>
          </IconButton>
          <IconButton label={t('page.shirts.deleteSet')} variant="danger" onClick={onDelete}>
            <TrashIcon />
          </IconButton>
        </Cluster>
      </div>

      {isExpanded && (
        <div className="shirt-set-content">
          <div className="shirt-grid">
            {sortedShirts.map((shirt) => (
              <ShirtCard key={shirt.number} shirt={shirt} onEdit={() => onEditShirt(shirt)} onRemove={() => onRemoveShirt(shirtSet.id, shirt.number)} />
            ))}
            <AddCardButton onClick={onAddShirt} label={t('page.shirtModal.addTitle')} />
          </div>
        </div>
      )}
    </article>
  );
}
