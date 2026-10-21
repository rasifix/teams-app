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
            <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.667 48.667 0 0 0-14.456 0m10.978-.397v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
            </svg>
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
