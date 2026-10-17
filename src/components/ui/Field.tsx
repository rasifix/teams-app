import { forwardRef, type HTMLAttributes, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: ReactNode;
}

export function FieldLabel({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`ui-field__label ${className}`.trim()} {...props} />;
}

export function FieldLegend({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={`ui-field__label ${className}`.trim()} {...props} />;
}

export function Field({ label, htmlFor, hint, error, children, className = '', ...props }: FieldProps) {
  return (
    <div className={`ui-field ${className}`.trim()} {...props}>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {error ? <p className="ui-field__error">{error}</p> : hint ? <p className="ui-field__hint">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = '', ...props },
  ref,
) {
  return <input ref={ref} className={`ui-input ${className}`.trim()} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = '', ...props },
  ref,
) {
  return <select ref={ref} className={`ui-select ${className}`.trim()} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className = '', ...props },
  ref,
) {
  return <textarea ref={ref} className={`ui-textarea ${className}`.trim()} {...props} />;
});

export const ColorInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(function ColorInput(
  { className = '', ...props },
  ref,
) {
  return <input ref={ref} type="color" className={`ui-color-input ${className}`.trim()} {...props} />;
});

export const Checkbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(function Checkbox(
  { className = '', ...props },
  ref,
) {
  return <input ref={ref} type="checkbox" className={`ui-choice ${className}`.trim()} {...props} />;
});

export const Radio = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(function Radio(
  { className = '', ...props },
  ref,
) {
  return <input ref={ref} type="radio" className={`ui-choice ${className}`.trim()} {...props} />;
});
