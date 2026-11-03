import { type ComponentProps, useId } from 'react';
import { inputClassName, labelClassName } from './styles';

interface TextareaFieldProps extends ComponentProps<'textarea'> {
  label: string;
  error?: string;
}

export function TextareaField({ label, error, id, ...textareaProps }: TextareaFieldProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={textareaId} className={labelClassName}>
        {label}
      </label>
      <textarea
        id={textareaId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={inputClassName}
        {...textareaProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
