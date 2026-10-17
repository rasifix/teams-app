import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { getButtonClassName, type ButtonSize, type ButtonVariant } from './buttonStyles';

export interface ButtonLinkProps extends Omit<LinkProps, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={getButtonClassName({ variant, size, className })} {...props} />;
}
