import type { ButtonHTMLAttributes, ComponentProps, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Children, isValidElement, useState } from 'react';
import { NavLink, useLocation, useNavigate, type NavLinkProps } from 'react-router-dom';
import { classNames } from './classNames';

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return <svg className={classNames('ui-tabs-mobile__chevron', isOpen && 'ui-tabs-mobile__chevron--open')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>;
}

type NavigationTabElementProps = { to?: unknown; children?: ReactNode };
type TabElementProps = { selected?: boolean; onClick?: ComponentProps<'button'>['onClick']; children?: ReactNode };

export interface NavigationTabsProps extends HTMLAttributes<HTMLElement> {
  label: string;
  children: ReactNode;
  mobileFit?: boolean;
}

export function NavigationTabs({ label, children, mobileFit = false, className, ...props }: NavigationTabsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const tabs = Children.toArray(children).filter(isValidElement) as Array<ReactElement<NavigationTabElementProps>>;
  const activeTab = tabs.find((tab) => {
    const to = tab.props.to;
    return typeof to === 'string' && (location.pathname === to || location.pathname.startsWith(`${to}/`));
  }) ?? tabs[0];

  return (
    <div className={classNames('ui-tabs-scroll', mobileFit && 'ui-tabs-scroll--mobile-select', className)}>
      {mobileFit && (
        <div className={'ui-tabs-mobile'}>
          <button type="button" className={'ui-tabs-mobile__trigger'} aria-haspopup="menu" aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>
            <span>{activeTab?.props.children}</span>
            <ChevronIcon isOpen={isOpen} />
          </button>
          {isOpen && (
            <div className={'ui-tabs-mobile__menu'} role="menu">
              {tabs.map((tab, index) => (
                <button
                  key={tab.key ?? index}
                  type="button"
                  role="menuitem"
                  className={'ui-tabs-mobile__option'}
                  onClick={() => {
                    if (typeof tab.props.to === 'string') navigate(tab.props.to);
                    setIsOpen(false);
                  }}
                >
                  {tab.props.children}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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
  const [isOpen, setIsOpen] = useState(false);
  const tabs = Children.toArray(children).filter(isValidElement) as Array<ReactElement<TabElementProps>>;
  const activeTab = tabs.find((tab) => tab.props.selected) ?? tabs[0];

  return (
    <div className={classNames('ui-tabs-scroll', mobileFit && 'ui-tabs-scroll--mobile-select', className)}>
      {mobileFit && (
        <div className={'ui-tabs-mobile'}>
          <button type="button" className={'ui-tabs-mobile__trigger'} aria-haspopup="menu" aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>
            <span>{activeTab?.props.children}</span>
            <ChevronIcon isOpen={isOpen} />
          </button>
          {isOpen && (
            <div className={'ui-tabs-mobile__menu'} role="menu">
              {tabs.map((tab, index) => (
                <button
                  key={tab.key ?? index}
                  type="button"
                  role="menuitem"
                  className={'ui-tabs-mobile__option'}
                  onClick={(event) => {
                    tab.props.onClick?.(event);
                    setIsOpen(false);
                  }}
                >
                  {tab.props.children}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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
