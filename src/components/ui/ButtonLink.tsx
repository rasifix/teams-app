import type { AnchorHTMLAttributes, ReactNode } from 'react';
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

export interface ButtonAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function ButtonAnchor({ variant, size, className, ...props }: ButtonAnchorProps) {
  return <a className={getButtonClassName({ variant, size, className })} {...props} />;
}
