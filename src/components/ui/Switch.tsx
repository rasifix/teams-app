import type { ButtonHTMLAttributes } from 'react';

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-checked' | 'aria-label' | 'children' | 'role'> {
  checked: boolean;
  label: string;
}

export default function Switch({ checked, label, className = '', type = 'button', ...props }: SwitchProps) {
  return (
    <button
      type={type}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`ui-switch ${className}`.trim()}
      data-checked={checked ? 'true' : 'false'}
      {...props}
    >
      <span className="ui-switch__thumb" />
    </button>
  );
}
