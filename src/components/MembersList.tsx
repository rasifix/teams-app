import type { Player, Trainer } from '../types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Level from './Level';

type Member = Player | Trainer;

interface MembersListProps<T extends Member> {
  members: T[];
  onDelete: (member: T) => void;
  memberType: 'players' | 'trainers';
  emptyMessage?: string;
}

function isPlayer(member: Member): member is Player {
  return 'level' in member && 'birthYear' in member;
}

export default function MembersList<T extends Member>({ 
  members, 
  onDelete, 
  memberType,
  emptyMessage 
}: MembersListProps<T>) {
  const navigate = useNavigate();
  const [swipedMemberId, setSwipedMemberId] = useState<string | null>(null);

  if (members.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>{emptyMessage || `No ${memberType} added yet. Click "Add ${memberType.slice(0, -1).replace('s', '')}" to get started.`}</p>
      </div>
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
    onDelete(member);
    setSwipedMemberId(null);
  };

  // Close swipe state when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Only close if clicking outside of any member card or on the backdrop itself
    if (swipedMemberId && (target.classList.contains('grid') || !target.closest('.member-card'))) {
      setSwipedMemberId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" onClick={handleBackdropClick}>
      {members.map((member) => (
        <div 
          key={member.id}
          className="member-card relative overflow-hidden bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          {/* Main card content */}
          <div 
            className={`flex items-center justify-between p-3 cursor-pointer transition-transform duration-200 ${
              swipedMemberId === member.id ? '-translate-x-20' : 'translate-x-0'
            } active:bg-gray-50`}
            onClick={(e) => handleMemberClick(member, e)}
            onTouchStart={(e) => handleTouchStart(member.id, e)}
          >
            {/* Member info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.firstName} {member.lastName}
                    {isPlayer(member) && (
                      <span className="text-xs text-gray-500 ml-1">{member.birthYear}</span>
                    )}
                  </p>
                </div>
                {/* Level for players, chevron for trainers */}
                <div className="ml-2 flex-shrink-0">
                  {isPlayer(member) ? (
                    <Level level={member.level} className="text-lg" />
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Delete button that appears on swipe */}
          <div 
            className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-600 transition-opacity duration-200 ${
              swipedMemberId === member.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              className="delete-button flex items-center justify-center w-full h-full text-white font-medium"
              onClick={(e) => handleDeleteClick(member, e)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}