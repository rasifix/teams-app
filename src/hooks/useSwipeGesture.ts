import { useRef } from 'react';
import type { TouchEvent } from 'react';
import { getSwipeAction } from './swipeGesture';

interface Options {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  disabled?: boolean;
}

export function useSwipeGesture({ isOpen, onOpenChange, disabled = false }: Options) {
  const startX = useRef<number | null>(null);
  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (disabled) return;
    startX.current = event.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (disabled || startX.current === null) return;
    const action = getSwipeAction(startX.current, event.changedTouches[0]?.clientX ?? startX.current, isOpen);
    if (action) onOpenChange(action === 'open');
    startX.current = null;
  };
  return { onTouchStart, onTouchEnd };
}
