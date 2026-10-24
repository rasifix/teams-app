import type { SVGProps } from 'react';

interface MovePlayerIconProps extends SVGProps<SVGSVGElement> {
  direction: 'up' | 'down';
}

export default function MovePlayerIcon({ direction, className = 'icon-xs', ...props }: MovePlayerIconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d={direction === 'up' ? 'M12 19V5m-7 7 7-7 7 7' : 'M12 5v14m7-7-7 7-7-7'} />
    </svg>
  );
}
