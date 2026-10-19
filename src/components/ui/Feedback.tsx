import type { HTMLAttributes } from 'react';
import { classNames } from './classNames';

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
