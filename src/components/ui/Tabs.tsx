import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { NavLink, type NavLinkProps } from 'react-router-dom';
import { classNames } from './classNames';

export interface NavigationTabsProps extends HTMLAttributes<HTMLElement> {
  label: string;
  children: ReactNode;
  mobileFit?: boolean;
}

export function NavigationTabs({ label, children, mobileFit = false, className, ...props }: NavigationTabsProps) {
  return (
    <div className={classNames('ui-tabs-scroll', mobileFit && 'ui-tabs-scroll--mobile-fit', className)}>
      <nav className="ui-tabs" aria-label={label} {...props}>{children}</nav>
    </div>
  );
}

export interface NavigationTabProps extends Omit<NavLinkProps, 'className'> {
  className?: string;
}

export function NavigationTab({ className, ...props }: NavigationTabProps) {
  return (
    <NavLink
      className={({ isActive }) => classNames('ui-tab', isActive && 'ui-tab--active', className)}
      {...props}
    />
  );
}

export interface TabListProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  children: ReactNode;
  mobileFit?: boolean;
}

export function TabList({ label, children, mobileFit = false, className, ...props }: TabListProps) {
  return (
    <div className={classNames('ui-tabs-scroll', mobileFit && 'ui-tabs-scroll--mobile-fit', className)}>
      <div className="ui-tabs" role="tablist" aria-label={label} {...props}>{children}</div>
    </div>
  );
}

export interface TabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'role'> {
  selected: boolean;
}

export function Tab({ selected, className, ...props }: TabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={classNames('ui-tab', selected && 'ui-tab--active', className)}
      {...props}
    />
  );
}
