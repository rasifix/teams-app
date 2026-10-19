import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { forwardRef } from 'react';
import { classNames } from './classNames';

export interface EntityListProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'framed' | 'bare' | 'separated';
}

export function EntityList({ variant = 'framed', className, ...props }: EntityListProps) {
  return <div className={classNames('ui-entity-list', `ui-entity-list--${variant}`, className)} role="list" {...props} />;
}

export interface EntityRowProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'center' | 'start';
  density?: 'default' | 'compact';
  selected?: boolean;
}

export function EntityRow({ align = 'center', density = 'default', selected = false, className, ...props }: EntityRowProps) {
  return <div className={classNames('ui-entity-row', `ui-entity-row--${density}`, align === 'start' && 'ui-entity-row--start', selected && 'ui-entity-row--selected', className)} role="listitem" {...props} />;
}

export function EntityLeading({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-entity-leading', className)} {...props} />;
}

export function EntityContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-entity-content', className)} {...props} />;
}

export function EntityTitle({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classNames('ui-entity-title', className)} {...props} />;
}

export function EntityMeta({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-entity-meta', className)} {...props} />;
}

export function EntityActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-entity-actions', className)} {...props} />;
}

export function PropertyList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-property-list', className)} {...props} />;
}

export function PropertyRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-property-row', className)} {...props} />;
}

export function PropertyAction({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={classNames('ui-property-row', 'ui-property-row--action', className)} {...props} />;
}

export function PropertyLabel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <span className={classNames('ui-property-label', className)} {...props} />;
}

export interface PropertyValueProps extends HTMLAttributes<HTMLElement> {
  muted?: boolean;
}

export function PropertyValue({ muted = false, className, ...props }: PropertyValueProps) {
  return <span className={classNames('ui-property-value', muted && 'ui-property-value--muted', className)} {...props} />;
}

export function PropertyActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-property-actions', className)} {...props} />;
}

export function MetadataList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-metadata-list', className)} {...props} />;
}

export function MetadataItem({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={classNames('ui-metadata-item', className)} {...props} />;
}

export interface DataTableProps extends TableHTMLAttributes<HTMLTableElement> {
  density?: 'default' | 'compact';
}

export function DataTable({ density = 'default', className, ...props }: DataTableProps) {
  return <table className={classNames('ui-data-table', `ui-data-table--${density}`, className)} {...props} />;
}

export function DataTableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={classNames('ui-data-table__head', className)} {...props} />;
}

export function DataTableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={classNames('ui-data-table__body', className)} {...props} />;
}

export interface DataTableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean;
  highlight?: boolean;
  selected?: boolean;
}

export function DataTableRow({ interactive = false, highlight = false, selected = false, className, ...props }: DataTableRowProps) {
  return <tr className={classNames('ui-data-table__row', interactive && 'ui-data-table__row--interactive', highlight && 'ui-data-table__row--highlight', selected && 'ui-data-table__row--selected', className)} {...props} />;
}

interface TableCellOptions {
  align?: 'start' | 'center' | 'end';
  sticky?: boolean;
}

export type DataTableHeaderCellProps = Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> & TableCellOptions;

export function DataTableHeaderCell({ align = 'start', sticky = false, className, ...props }: DataTableHeaderCellProps) {
  return <th className={classNames('ui-data-table__heading', `ui-data-table__cell--${align}`, sticky && 'ui-data-table__cell--sticky', className)} {...props} />;
}

export interface DataTableSortButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  direction?: 'asc' | 'desc';
}

export function DataTableSortButton({ active = false, direction = 'asc', children, className, type = 'button', ...props }: DataTableSortButtonProps) {
  return (
    <button type={type} className={classNames('ui-data-table__sort', active && 'ui-data-table__sort--active', className)} {...props}>
      <span>{children}</span>
      {active && <span className="ui-data-table__sort-indicator" aria-hidden="true">{direction === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );
}

export type DataTableCellProps = Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> & TableCellOptions & { strong?: boolean };

export function DataTableCell({ align = 'start', sticky = false, strong = false, className, ...props }: DataTableCellProps) {
  return <td className={classNames('ui-data-table__cell', `ui-data-table__cell--${align}`, sticky && 'ui-data-table__cell--sticky', strong && 'ui-data-table__cell--strong', className)} {...props} />;
}

export const StickyMatrix = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function StickyMatrix(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={classNames('ui-sticky-matrix', className)} {...props} />;
});

export interface ResponsiveViewProps extends HTMLAttributes<HTMLDivElement> {
  show: 'mobile' | 'desktop';
}

export function ResponsiveView({ show, className, ...props }: ResponsiveViewProps) {
  return <div className={classNames('ui-responsive-view', `ui-responsive-view--${show}`, className)} {...props} />;
}
