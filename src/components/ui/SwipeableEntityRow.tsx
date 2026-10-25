import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EntityActions, EntityRow, type EntityRowProps } from './DataDisplay';
import IconButton from './IconButton';
import TrashIcon from './icons/TrashIcon';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

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


export default function SwipeableEntityRow({ children, extraActions, onEdit, onDelete, showDesktopDelete = true, className, ...props }: SwipeableEntityRowProps) {
  const { t } = useTranslation();
  const [isSwiped, setIsSwiped] = useState(false);
  const swipeHandlers = useSwipeGesture({ isOpen: isSwiped, onOpenChange: setIsSwiped, disabled: !onDelete });

  const handleDelete = () => {
    setIsSwiped(false);
    onDelete?.();
  };

  return (
    <EntityRow
      {...props}
      className={`ui-swipeable-row${isSwiped ? ' ui-swipeable-row--swiped' : ''}${className ? ` ${className}` : ''}`}
      onTouchStart={onDelete ? swipeHandlers.onTouchStart : undefined}
      onTouchEnd={onDelete ? swipeHandlers.onTouchEnd : undefined}
    >
      {children}
      {(extraActions || onEdit || (onDelete && showDesktopDelete)) && (
        <EntityActions className={'ui-entity-actions--separated'}>
          {extraActions}
          {onEdit && <IconButton label={t('common.actions.edit')} onClick={onEdit}><PencilIcon /></IconButton>}
          {onDelete && showDesktopDelete && <IconButton className="ui-swipeable-row__delete" label={t('common.actions.delete')} variant="danger" onClick={handleDelete}><TrashIcon /></IconButton>}
        </EntityActions>
      )}
      {onDelete && (
        <div className={`ui-swipe-action-tray${isSwiped ? ' ui-swipe-action-tray--visible' : ''}`}>
          <IconButton label={t('common.actions.delete')} variant="inverse" onClick={handleDelete}><TrashIcon /></IconButton>
        </div>
      )}
    </EntityRow>
  );
}
