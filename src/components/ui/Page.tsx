import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';

export interface PageProps extends HTMLAttributes<HTMLDivElement> {
  width?: 'default' | 'medium' | 'narrow';
}

export function Page({ width = 'default', className, ...props }: PageProps) {
  return <main className={classNames('ui-page', width !== 'default' && `ui-page--${width}`, className)} {...props} />;
}

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  align?: 'start' | 'end';
}

export function PageHeader({ align = 'end', className, ...props }: PageHeaderProps) {
  return <header className={classNames('ui-page-header', align === 'start' && 'ui-page-header--start', className)} {...props} />;
}

export function PageHeaderContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-page-header__content', className)} {...props} />;
}

export function PageTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={classNames('ui-page-title', className)} {...props} />;
}

export function PageDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classNames('ui-page-description', className)} {...props} />;
}

export interface PageActionsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function PageActions({ className, ...props }: PageActionsProps) {
  return <div className={classNames('ui-page-actions', className)} {...props} />;
}
