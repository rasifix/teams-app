import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { getButtonClassName } from './buttonStyles';
import type { ButtonSize, ButtonVariant } from './buttonStyles';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  size = 'md',
  children, 
  className = '', 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={getButtonClassName({ variant, size, className })}
      {...props}
    >
      {children}
    </button>
  );
}
