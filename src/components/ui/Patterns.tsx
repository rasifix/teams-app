import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { classNames } from './classNames';

export function PageToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-page-toolbar', className)} {...props} />;
}

interface ActionCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  showChevron?: boolean;
}

export function ActionCard({ leading, trailing, selected, showChevron = true, children, className, type = 'button', ...props }: ActionCardProps) {
  return (
    <button type={type} className={classNames('ui-action-card', selected && 'ui-action-card--selected', className)} aria-pressed={selected} {...props}>
      {leading}
      <span className="ui-action-card__content">{children}</span>
      {trailing ?? (showChevron && <ChevronRightIcon className="ui-action-card__chevron" />)}
    </button>
  );
}

export interface ActionCardLinkProps extends Omit<LinkProps, 'className'> {
  leading?: ReactNode;
  trailing?: ReactNode;
  showChevron?: boolean;
  className?: string;
}

export function ActionCardLink({ leading, trailing, showChevron = true, children, className, ...props }: ActionCardLinkProps) {
  return (
    <Link className={classNames('ui-action-card', className)} {...props}>
      {leading}
      <span className="ui-action-card__content">{children}</span>
      {trailing ?? (showChevron && <ChevronRightIcon className="ui-action-card__chevron" />)}
    </Link>
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

export function VisuallyHidden({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={classNames('ui-visually-hidden', className)} {...props} />;
}

export function MenuSurface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-menu', className)} role="menu" {...props} />;
}

export function MenuLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classNames('ui-menu__label', className)} {...props} />;
}

export interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function MenuItem({ selected, className, type = 'button', ...props }: MenuItemProps) {
  return <button type={type} role={selected === undefined ? 'menuitem' : 'menuitemradio'} aria-checked={selected} className={classNames('ui-menu__item', selected && 'ui-menu__item--selected', className)} {...props} />;
}

export function MenuItemTitle({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={classNames('ui-menu__item-title', className)} {...props} />;
}

export function MenuItemDescription({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={classNames('ui-menu__item-description', className)} {...props} />;
}

export function MenuDivider({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={classNames('ui-menu__divider', className)} {...props} />;
}
