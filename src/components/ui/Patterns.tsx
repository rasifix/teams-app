import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from 'react';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { classNames } from './classNames';

export function PageToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-page-toolbar', className)} {...props} />;
}

interface ActionCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  leading?: ReactNode;
}

export function ActionCard({ leading, children, className, type = 'button', ...props }: ActionCardProps) {
  return (
    <button type={type} className={classNames('ui-action-card', className)} {...props}>
      {leading}
      <span className="ui-action-card__content">{children}</span>
      <ChevronRightIcon className="ui-action-card__chevron" />
    </button>
  );
}

export function ActionCardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={classNames('ui-action-card__title', className)} {...props} />;
}

export function ListFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-list', className)} {...props} />;
}

interface ListRowProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'center' | 'start';
}

export function ListRow({ align = 'center', className, ...props }: ListRowProps) {
  return <div className={classNames('ui-list-row', align === 'start' && 'ui-list-row--start', className)} {...props} />;
}

export function ListAction({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={classNames('ui-list-action', className)} {...props} />;
}

export function FilterBar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-filter-bar', className)} {...props} />;
}

export function FilterGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-filter-group', className)} {...props} />;
}

export function FilterLabel({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={classNames('ui-filter-label', className)} {...props} />;
}
