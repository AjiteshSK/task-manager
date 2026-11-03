import { type ComponentProps, useId } from 'react';
import { inputClassName, labelClassName } from './styles';

interface TextFieldProps extends ComponentProps<'input'> {
  label: string;
  error?: string;
  hint?: string;
}

/** An input with its label, an optional hint and its error message, linked for screen readers. */
export function TextField({ label, error, hint, id, ...inputProps }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className={labelClassName}>
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={inputClassName}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="text-xs text-slate-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
