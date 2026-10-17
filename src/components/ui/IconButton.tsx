import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  label: string;
  children: ReactNode;
  variant?: 'neutral' | 'danger' | 'inverse';
}

export default function IconButton({
  label,
  children,
  variant = 'neutral',
  className = '',
  title = label,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={title}
      className={`icon-button ${variant !== 'neutral' ? `icon-button--${variant}` : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
