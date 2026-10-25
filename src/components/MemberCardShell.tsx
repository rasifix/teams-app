import type { MouseEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { EntityContent, EntityTitle } from './ui';

interface Props {
  name: string;
  details?: ReactNode;
  isSwiped: boolean;
  onSwipeChange: (isSwiped: boolean) => void;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
  onDelete?: (event: MouseEvent<HTMLButtonElement>) => void;
  cardClassName?: string;
}

export default function MemberCardShell({ name, details, isSwiped, onSwipeChange, onClick, onDelete, cardClassName = '' }: Props) {
  const { t } = useTranslation();
  const swipeHandlers = useSwipeGesture({ isOpen: isSwiped, onOpenChange: onSwipeChange, disabled: !onDelete });
  return <div className={`member-card${cardClassName}`}>
    <div className={`member-card-main${isSwiped ? ' member-card-main--swiped' : ''}`} onClick={onClick} {...swipeHandlers}>
      <span className="member-card-icon">
        <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0" />
        </svg>
      </span>
      <EntityContent>
        <EntityTitle>{name}</EntityTitle>
        {details}
      </EntityContent>
      <svg className="member-card-chevron" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </div>
    {onDelete && <div className={`ui-swipe-action-tray${isSwiped ? ' ui-swipe-action-tray--visible' : ''}`}>
      <button type="button" data-ui-control="composite" className="delete-button member-delete-action" onClick={onDelete}>{t('common.actions.delete')}</button>
    </div>}
  </div>;
}
