import type { HTMLAttributes, LabelHTMLAttributes } from 'react';
import { classNames } from './classNames';

export type SemanticTone = 'neutral' | 'brand' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

export interface IconTileProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg';
  tone?: SemanticTone;
}

export function IconTile({ size = 'md', tone = 'neutral', className, ...props }: IconTileProps) {
  return <span className={classNames('ui-icon-tile', `ui-icon-tile--${size}`, `ui-tone--${tone}`, className)} {...props} />;
}

export interface StatusMarkerProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: SemanticTone;
}

export function StatusMarker({ tone = 'neutral', className, ...props }: StatusMarkerProps) {
  return <span className={classNames('ui-status-marker', `ui-tone--${tone}`, className)} {...props} />;
}

export function Legend({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-legend', className)} {...props} />;
}

export function LegendItem({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-legend__item', className)} {...props} />;
}

export function ChoiceGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-choice-group', className)} {...props} />;
}

export interface ChoiceCardProps extends LabelHTMLAttributes<HTMLLabelElement> {
  selected?: boolean;
  density?: 'default' | 'compact';
}

export function ChoiceCard({ selected = false, density = 'default', className, ...props }: ChoiceCardProps) {
  return <label className={classNames('ui-choice-card', selected && 'ui-choice-card--selected', density === 'compact' && 'ui-choice-card--compact', className)} {...props} />;
}

export function AdjacentNavigation({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <nav className={classNames('ui-adjacent-navigation', className)} {...props} />;
}

export function AdjacentNavigationLabel({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={classNames('ui-adjacent-navigation__label', className)} {...props} />;
}

export function ActionDock({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-action-dock', className)} {...props} />;
}

export interface ActionDockContentProps extends HTMLAttributes<HTMLDivElement> {
  width?: 'default' | 'medium' | 'narrow';
}

export function ActionDockContent({ width = 'default', className, ...props }: ActionDockContentProps) {
  return <div className={classNames('ui-action-dock__content', width !== 'default' && `ui-action-dock__content--${width}`, className)} {...props} />;
}
