import type { ShirtSet, Shirt } from '../types';
import { useTranslation } from 'react-i18next';
import ShirtCard from './ShirtCard';
import { selectSortedShirts } from '../store/selectors/shirtSetSelectors';

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
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_36px_-30px_rgba(15,29,38,.5)] transition hover:border-orange-200 hover:shadow-md">
      <div className="flex items-center gap-2 p-3 sm:p-4">
        <button type="button" onClick={onToggleExpanded} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-orange-400">
          <span className="h-10 w-3 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: shirtSet.color }} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold tracking-tight text-slate-900">{shirtSet.sponsor}</span>
            <span className="mt-0.5 block text-xs text-slate-500">{t('shirts.shirtCount', { count: shirtSet.shirts.length })}</span>
          </span>
          <svg className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex shrink-0 items-center gap-1 border-l border-slate-100 pl-2">
          <button type="button" onClick={onEdit} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400" title={t('shirts.editSet')}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
            </svg>
          </button>
          <button type="button" onClick={onDelete} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400" title={t('shirts.deleteSet')}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.667 48.667 0 0 0-14.456 0m10.978-.397v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedShirts.map((shirt) => (
              <ShirtCard key={shirt.number} shirt={shirt} onEdit={() => onEditShirt(shirt)} onRemove={() => onRemoveShirt(shirtSet.id, shirt.number)} />
            ))}
            <button type="button" onClick={onAddShirt} className="group flex h-11 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400" title={t('shirtModal.addTitle')}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
