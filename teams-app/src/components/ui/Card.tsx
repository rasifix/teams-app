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

export function SummaryCard({ children, className = '' }: CardProps) {
  return (
    <div className={`summary-card ${className}`}>
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
      <h3 className="summary-card-label">{label}</h3>
      <p className="summary-card-value">{value}</p>
    </>
  );
}
