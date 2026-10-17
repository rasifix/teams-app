import type { ShirtSet, Shirt } from '../types';
import { useTranslation } from 'react-i18next';
import ShirtCard from './ShirtCard';
import { selectSortedShirts } from '../store/selectors/shirtSetSelectors';
import { Button, IconButton } from './ui';

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
    <article className="overflow-hidden rounded-3xl border border-edge bg-surface shadow-md transition hover:border-brand-border hover:shadow-md">
      <div className="flex items-center gap-2 p-3 sm:p-4">
        <button type="button" data-ui-control="composite" onClick={onToggleExpanded} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-brand">
          <span className="h-10 w-3 shrink-0 rounded-full border border-edge" style={{ backgroundColor: shirtSet.color }} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold tracking-tight text-content-strong">{shirtSet.sponsor}</span>
            <span className="mt-0.5 block text-xs text-content-subtle">{t('shirts.shirtCount', { count: shirtSet.shirts.length })}</span>
          </span>
          <svg className={`h-4 w-4 shrink-0 text-content-disabled transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex shrink-0 items-center gap-1 border-l border-edge pl-2">
          <IconButton label={t('shirts.editSet')} onClick={onEdit}>
            <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
            </svg>
          </IconButton>
          <IconButton label={t('shirts.deleteSet')} variant="danger" onClick={onDelete}>
            <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.667 48.667 0 0 0-14.456 0m10.978-.397v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
            </svg>
          </IconButton>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-edge bg-surface-subtle p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedShirts.map((shirt) => (
              <ShirtCard key={shirt.number} shirt={shirt} onEdit={() => onEditShirt(shirt)} onRemove={() => onRemoveShirt(shirtSet.id, shirt.number)} />
            ))}
            <Button type="button" variant="secondary" onClick={onAddShirt} className="h-11 w-full border-dashed" title={t('shirtModal.addTitle')} aria-label={t('shirtModal.addTitle')}>
              <svg className="icon-sm" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
