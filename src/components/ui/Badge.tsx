import type { HTMLAttributes } from 'react';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
}

export function Badge({ tone = 'neutral', size = 'md', className = '', ...props }: BadgeProps) {
  return <span className={`ui-badge ui-badge--${tone} ui-badge--${size} ${className}`.trim()} {...props} />;
}
