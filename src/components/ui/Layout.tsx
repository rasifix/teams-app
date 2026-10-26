import type { HTMLAttributes } from 'react';
import { classNames } from './classNames';

type Gap = 'sm' | 'base' | 'md' | 'lg' | 'card';

interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  gap?: Gap;
}

export function Stack({ gap = 'md', className, ...props }: LayoutProps) {
  return <div className={classNames('ui-stack', `ui-stack--${gap}`, className)} {...props} />;
}

interface ClusterProps extends LayoutProps {
  align?: 'center' | 'start' | 'end';
  wrap?: boolean;
}

export function Cluster({ gap = 'md', align = 'center', wrap = true, className, ...props }: ClusterProps) {
  return <div className={classNames('ui-cluster', `ui-cluster--${gap}`, `ui-cluster--${align}`, wrap && 'ui-cluster--wrap', className)} {...props} />;
}

interface SplitProps extends LayoutProps {
  align?: 'center' | 'start' | 'end';
}

export function Split({ gap = 'md', align = 'center', className, ...props }: SplitProps) {
  return <div className={classNames('ui-split', `ui-split--${gap}`, `ui-split--${align}`, className)} {...props} />;
}

export interface ContentGridProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'equal' | 'equalSm' | 'sidebar' | 'sidebarEnd' | 'editor' | 'dashboard' | 'threeColumn' | 'metrics';
}

export function ContentGrid({ variant = 'equal', className, ...props }: ContentGridProps) {
  return <div className={classNames('ui-content-grid', `ui-content-grid--${variant}`, className)} {...props} />;
}
