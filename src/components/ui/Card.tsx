import type { HTMLAttributes } from 'react';
import { classNames } from './classNames';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'selected' | 'print';
}

export function Card({ variant = 'default', className, ...props }: CardProps) {
  return <div className={classNames('card', variant !== 'default' && `card--${variant}`, className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('card-body', className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('card-header', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <footer className={classNames('card-footer', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={classNames('card-title', className)} {...props} />;
}

interface SummaryCardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'brand' | 'info' | 'success' | 'accent';
}

export function SummaryCard({ children, className, tone = 'brand', ...props }: SummaryCardProps) {
  return (
    <div className={classNames('summary-card', `summary-card--${tone}`, className)} {...props}>
      <div className="summary-card__accent" />
      {children}
    </div>
  );
}

interface SummaryCardContentProps {
  label: string;
  value: string | number;
}

export function SummaryCardContent({ label, value }: SummaryCardContentProps) {
  return (
    <>
      <p className="summary-card-value">{value}</p>
      <h3 className="summary-card-label">{label}</h3>
    </>
  );
}
