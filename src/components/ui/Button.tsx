import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { getButtonClassName } from './buttonStyles';
import type { ButtonSize, ButtonVariant } from './buttonStyles';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  width?: 'fit' | 'full' | 'grow';
  children: ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  size = 'md',
  loading = false,
  width = 'fit',
  children, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={getButtonClassName({ variant, size, className: `${width !== 'fit' ? `btn-${width}` : ''} ${className}`.trim() })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="ui-button-spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
