import type { Player, Trainer } from '../types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PlayerCard from './PlayerCard';
import MemberCardShell from './MemberCardShell';
import { EmptyState } from './ui';
import { shouldNavigateFromRow, updateActiveSwipeId } from '../hooks/swipeGesture';

type Member = Player | Trainer;

interface MembersListProps<T extends Member> {
  members: T[];
  onDelete?: (member: T) => void;
  memberType: 'players' | 'trainers';
  onOpenMember: (memberType: 'players' | 'trainers', memberId: string) => void;
  emptyMessage?: string;
}

function isPlayer(member: Member): member is Player {
  return 'level' in member && 'birthDate' in member;
}

export default function MembersList<T extends Member>({ members, onDelete, memberType, onOpenMember, emptyMessage }: MembersListProps<T>) {
  const { t } = useTranslation();
  const [swipedMemberId, setSwipedMemberId] = useState<string | null>(null);

  if (members.length === 0) {
    const defaultEmptyMessage = memberType === 'players' ? t('page.members.list.emptyPlayers') : t('page.members.list.emptyTrainers');
    return <EmptyState><p>{emptyMessage || defaultEmptyMessage}</p></EmptyState>;
  }

  const handleMemberClick = (member: T, event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!shouldNavigateFromRow(swipedMemberId === member.id, Boolean(target.closest('.delete-button')))) return;
    onOpenMember(memberType, member.id);
  };

  const handleDeleteClick = (member: T, event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete?.(member);
    setSwipedMemberId(null);
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (swipedMemberId && (target === event.currentTarget || !target.closest('.member-card'))) setSwipedMemberId(null);
  };

  const setMemberSwipe = (memberId: string, isSwiped: boolean) => setSwipedMemberId((current) => updateActiveSwipeId(current, memberId, isSwiped));

  return <div className="member-grid" onClick={handleBackdropClick}>
    {members.map((member) => isPlayer(member) && memberType === 'players' ? (
      <PlayerCard
        key={member.id}
        player={member}
        isSwiped={swipedMemberId === member.id}
        onSwipeChange={(isSwiped) => setMemberSwipe(member.id, isSwiped)}
        onClick={(event) => handleMemberClick(member, event)}
        onDelete={onDelete ? (event) => handleDeleteClick(member, event) : undefined}
      />
    ) : <MemberCardShell
      key={member.id}
      name={`${member.firstName} ${member.lastName}`}
      isSwiped={swipedMemberId === member.id}
      onSwipeChange={(isSwiped) => setMemberSwipe(member.id, isSwiped)}
      onClick={(event) => handleMemberClick(member, event)}
      onDelete={onDelete ? (event) => handleDeleteClick(member, event) : undefined}
    />)}
  </div>;
}
