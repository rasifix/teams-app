import type { HTMLAttributes } from 'react';

export type AlertTone = 'error' | 'warning' | 'success' | 'info';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
}

export function Alert({ tone = 'error', className = '', role, ...props }: AlertProps) {
  return (
    <div
      className={`ui-alert ui-alert--${tone} ${className}`.trim()}
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      {...props}
    />
  );
}

export function EmptyState({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`ui-empty-state ${className}`.trim()} {...props} />;
}
