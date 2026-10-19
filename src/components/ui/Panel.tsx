import type { HTMLAttributes } from 'react';
import { classNames } from './classNames';

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  padding?: 'default' | 'compact' | 'none';
  tone?: 'default' | 'danger';
}

export function Panel({ padding = 'default', tone = 'default', className, ...props }: PanelProps) {
  return (
    <section
      className={classNames(
        'ui-panel',
        padding === 'compact' && 'ui-panel--compact',
        padding === 'none' && 'ui-panel--flush',
        tone === 'danger' && 'ui-panel--danger',
        className,
      )}
      {...props}
    />
  );
}

export function PanelHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-panel-header', className)} {...props} />;
}

export interface PanelBodyProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'default' | 'compact';
}

export function PanelBody({ padding = 'default', className, ...props }: PanelBodyProps) {
  return <div className={classNames('ui-panel-body', padding === 'compact' && 'ui-panel-body--compact', className)} {...props} />;
}

export function PanelTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={classNames('ui-panel-title', className)} {...props} />;
}

export function PanelDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classNames('ui-panel-description', className)} {...props} />;
}

export function PanelActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-panel-actions', className)} {...props} />;
}
