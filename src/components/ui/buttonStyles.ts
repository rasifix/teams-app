export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'dangerGhost' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  success: 'btn-success',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
  dangerGhost: 'btn-danger-ghost',
  inverse: 'btn-inverse',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export function getButtonClassName({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return `${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();
}
