import type { ReactNode, TouchEvent } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EntityActions, EntityRow, type EntityRowProps } from './DataDisplay';
import IconButton from './IconButton';

interface SwipeableEntityRowProps extends Omit<EntityRowProps, 'children'> {
  children: ReactNode;
  extraActions?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  showDesktopDelete?: boolean;
}

function PencilIcon() {
  return <svg className={'icon-xs'} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487Z" /></svg>;
}

function TrashIcon() {
  return <svg className={'icon-xs'} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.667 48.667 0 0 0-14.456 0m10.978-.397v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" /></svg>;
}

export default function SwipeableEntityRow({ children, extraActions, onEdit, onDelete, showDesktopDelete = true, className, ...props }: SwipeableEntityRowProps) {
  const { t } = useTranslation();
  const touchStartX = useRef<number | null>(null);
  const [isSwiped, setIsSwiped] = useState(false);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const distance = touchStartX.current - (event.changedTouches[0]?.clientX ?? touchStartX.current);
    if (distance > 50) setIsSwiped(true);
    if (distance < -30) setIsSwiped(false);
    touchStartX.current = null;
  };

  return (
    <EntityRow
      {...props}
      className={`ui-swipeable-row${isSwiped ? ' ui-swipeable-row--swiped' : ''}${className ? ` ${className}` : ''}`}
      onTouchStart={onDelete ? handleTouchStart : undefined}
      onTouchEnd={onDelete ? handleTouchEnd : undefined}
    >
      {children}
      {(extraActions || onEdit || (onDelete && showDesktopDelete)) && (
        <EntityActions className={'ui-entity-actions--separated'}>
          {extraActions}
          {onEdit && <IconButton label={t('common.actions.edit')} onClick={onEdit}><PencilIcon /></IconButton>}
          {onDelete && showDesktopDelete && <IconButton className="ui-swipeable-row__delete" label={t('common.actions.delete')} variant="danger" onClick={onDelete}><TrashIcon /></IconButton>}
        </EntityActions>
      )}
      {onDelete && (
        <div className={`ui-swipe-action-tray${isSwiped ? ' ui-swipe-action-tray--visible' : ''}`}>
          <IconButton label={t('common.actions.delete')} variant="inverse" onClick={onDelete}><TrashIcon /></IconButton>
        </div>
      )}
    </EntityRow>
  );
}
