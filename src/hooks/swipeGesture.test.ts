import { describe, expect, it } from 'vitest';
import { getSwipeAction, shouldNavigateFromRow, updateActiveSwipeId } from './swipeGesture';

describe('getSwipeAction', () => {
  it('opens after a left swipe over 50 pixels', () => {
    expect(getSwipeAction(120, 69, false)).toBe('open');
    expect(getSwipeAction(120, 70, false)).toBeNull();
  });
  it('closes an open row after a right swipe over 30 pixels', () => {
    expect(getSwipeAction(60, 91, true)).toBe('close');
    expect(getSwipeAction(60, 90, true)).toBeNull();
  });
  it('ignores a swipe that repeats the current state', () => {
    expect(getSwipeAction(120, 60, true)).toBeNull();
    expect(getSwipeAction(60, 120, false)).toBeNull();
  });
});

describe('swipe row behavior', () => {
  it('keeps at most one active row and only closes the active row', () => {
    expect(updateActiveSwipeId('first', 'second', true)).toBe('second');
    expect(updateActiveSwipeId('second', 'first', false)).toBe('second');
    expect(updateActiveSwipeId('second', 'second', false)).toBeNull();
  });

  it('suppresses row navigation while swiped or when clicking delete', () => {
    expect(shouldNavigateFromRow(false, false)).toBe(true);
    expect(shouldNavigateFromRow(true, false)).toBe(false);
    expect(shouldNavigateFromRow(false, true)).toBe(false);
  });
});
