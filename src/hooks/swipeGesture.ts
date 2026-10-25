export type SwipeAction = 'open' | 'close' | null;

export function getSwipeAction(startX: number, endX: number, isOpen: boolean): SwipeAction {
  const distance = startX - endX;
  if (distance > 50 && !isOpen) return 'open';
  if (distance < -30 && isOpen) return 'close';
  return null;
}

export function updateActiveSwipeId(currentId: string | null, rowId: string, isOpen: boolean): string | null {
  if (isOpen) return rowId;
  return currentId === rowId ? null : currentId;
}

export function shouldNavigateFromRow(isOpen: boolean, clickedDeleteAction: boolean): boolean {
  return !isOpen && !clickedDeleteAction;
}
