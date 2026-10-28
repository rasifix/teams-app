import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  label: string;
  children: ReactNode;
  variant?: 'neutral' | 'danger' | 'inverse';
  size?: 'default' | 'sm';
}

export default function IconButton({
  label,
  children,
  variant = 'neutral',
  size = 'default',
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
      className={`icon-button ${variant !== 'neutral' ? `icon-button--${variant}` : ''} ${size === 'sm' ? 'icon-button--sm' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
