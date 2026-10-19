import type { Player, Trainer } from '../types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PlayerCard from './PlayerCard';
import { EmptyState, EntityContent, EntityTitle } from './ui';

type Member = Player | Trainer;

interface MembersListProps<T extends Member> {
  members: T[];
  onDelete?: (member: T) => void;
  memberType: 'players' | 'trainers';
  emptyMessage?: string;
}

function isPlayer(member: Member): member is Player {
  return 'level' in member && 'birthDate' in member;
}

export default function MembersList<T extends Member>({ 
  members, 
  onDelete, 
  memberType,
  emptyMessage 
}: MembersListProps<T>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [swipedMemberId, setSwipedMemberId] = useState<string | null>(null);

  if (members.length === 0) {
    const defaultEmptyMessage = memberType === 'players'
      ? t('members.list.emptyPlayers')
      : t('members.list.emptyTrainers');

    return (
      <EmptyState>
        <p>{emptyMessage || defaultEmptyMessage}</p>
      </EmptyState>
    );
  }

  const handleTouchStart = (memberId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const moveTouch = moveEvent.touches[0];
      const diffX = startX - moveTouch.clientX;
      
      // If swiped left more than 50px, show delete button
      if (diffX > 50 && swipedMemberId !== memberId) {
        setSwipedMemberId(memberId);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
      // If swiped right more than 30px while delete button is showing, hide it
      else if (diffX < -30 && swipedMemberId === memberId) {
        setSwipedMemberId(null);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleMemberClick = (member: T, e: React.MouseEvent) => {
    // Don't trigger navigation if clicking on delete button area or during swipe
    const target = e.target as HTMLElement;
    if (target.closest('.delete-button') || swipedMemberId === member.id) {
      return;
    }
    navigate(`/${memberType}/${member.id}`);
  };

  const handleDeleteClick = (member: T, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(member);
    setSwipedMemberId(null);
  };

  // Close swipe state when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Only close if clicking outside of any member card or on the backdrop itself
    if (swipedMemberId && (target === e.currentTarget || !target.closest('.member-card'))) {
      setSwipedMemberId(null);
    }
  };

  return (
    <div className="member-grid" onClick={handleBackdropClick}>
      {members.map((member) => (
        memberType === 'players' && isPlayer(member) ? (
          <PlayerCard
            key={member.id}
            player={member}
            isSwiped={swipedMemberId === member.id}
            onClick={(e) => handleMemberClick(member, e)}
            onTouchStart={onDelete ? (e) => handleTouchStart(member.id, e) : undefined}
            onDelete={onDelete ? (e) => handleDeleteClick(member, e) : undefined}
          />
        ) : (
          <div
            key={member.id}
            className="member-card"
          >
            <div
              className={`member-card-main${swipedMemberId === member.id ? ' member-card-main--swiped' : ''}`}
              onClick={(e) => handleMemberClick(member, e)}
              onTouchStart={onDelete ? (e) => handleTouchStart(member.id, e) : undefined}
            >
              <span className="member-card-icon">
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0" />
                </svg>
              </span>
              <EntityContent>
                <EntityTitle>{member.firstName} {member.lastName}</EntityTitle>
              </EntityContent>
              <svg className="member-card-chevron" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>

            {onDelete && (
              <div
                className={`ui-swipe-action-tray${swipedMemberId === member.id ? ' ui-swipe-action-tray--visible' : ''}`}
              >
                <button
                  type="button"
                  data-ui-control="composite"
                  className="delete-button member-delete-action"
                  onClick={(e) => handleDeleteClick(member, e)}
                >
                  {t('common.actions.delete')}
                </button>
              </div>
            )}
          </div>
        )
      ))}
    </div>
  );
}
