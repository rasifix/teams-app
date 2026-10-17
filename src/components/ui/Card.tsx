import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: CardProps) {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h2 className={`card-title ${className}`}>
      {children}
    </h2>
  );
}

interface SummaryCardProps extends CardProps {
  tone?: 'brand' | 'info' | 'success' | 'accent';
}

export function SummaryCard({ children, className = '', tone = 'brand' }: SummaryCardProps) {
  return (
    <div className={`summary-card summary-card--${tone} ${className}`.trim()}>
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
