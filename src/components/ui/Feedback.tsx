import type { HTMLAttributes } from 'react';
import { classNames } from './classNames';

export type AlertTone = 'error' | 'warning' | 'success' | 'info';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
}

export function Alert({ tone = 'error', className = '', role, children, ...props }: AlertProps) {
  const icon = tone === 'success'
    ? <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>
    : tone === 'warning'
      ? <><path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></>
      : tone === 'error'
        ? <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>
        : null;

  return (
    <div
      className={`ui-alert ui-alert--${tone} ${className}`.trim()}
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      {...props}
    >
      {icon && <svg className="ui-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>}
      <div className="ui-alert__content">{children}</div>
    </div>
  );
}

export function EmptyState({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`ui-empty-state ${className}`.trim()} {...props} />;
}

export function PageState({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-page-state', className)} {...props} />;
}

export function PageStateContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-page-state__content', className)} {...props} />;
}

export interface StateIconProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'error' | 'warning';
}

export function StateIcon({ tone = 'error', className, ...props }: StateIconProps) {
  return <div className={classNames('ui-state-icon', `ui-state-icon--${tone}`, className)} {...props} />;
}

export function StateTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={classNames('ui-state-title', className)} {...props} />;
}

export function StateDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classNames('ui-state-description', className)} {...props} />;
}

export function StateActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-state-actions', className)} {...props} />;
}

export function StateDetails({ className, ...props }: HTMLAttributes<HTMLDetailsElement>) {
  return <details className={classNames('ui-state-details', className)} {...props} />;
}

export function StateDetailsSummary({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <summary className={classNames('ui-state-details__summary', className)} {...props} />;
}

export function StateDetailsContent({ className, ...props }: HTMLAttributes<HTMLPreElement>) {
  return <pre className={classNames('ui-state-details__content', className)} {...props} />;
}

export function FloatingStatus({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-floating-status', className)} {...props} />;
}
