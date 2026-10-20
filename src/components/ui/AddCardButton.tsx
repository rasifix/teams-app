import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Button from './Button';

type AddCardButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string;
  cardSize?: 'sm' | 'md' | 'lg';
  leading?: ReactNode;
};

export default function AddCardButton({ label, cardSize = 'sm', leading, className = '', ...props }: AddCardButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      className={`ui-add-card ui-add-card--${cardSize} ${className}`.trim()}
      title={label}
      aria-label={label}
      {...props}
    >
      {leading && <span className="ui-add-card__leading" aria-hidden="true">{leading}</span>}
      <svg className="icon-sm" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
      </svg>
    </Button>
  );
}
