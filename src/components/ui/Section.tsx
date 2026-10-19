import type { HTMLAttributes } from 'react';
import { classNames } from './classNames';

export function SectionHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <header className={classNames('ui-section-header', className)} {...props} />;
}

export function SectionHeaderContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-section-header__content', className)} {...props} />;
}

export function SectionEyebrow({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classNames('ui-section-eyebrow', className)} {...props} />;
}

export function SectionTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={classNames('ui-section-title', className)} {...props} />;
}

export function SectionDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classNames('ui-section-description', className)} {...props} />;
}

export function SectionActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-section-actions', className)} {...props} />;
}
