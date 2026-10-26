import type { HTMLAttributes } from 'react';

export default function DragHandleIcon({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={`ui-drag-handle ${className}`.trim()} aria-hidden="true" {...props}><span /><span /><span /></span>;
}
