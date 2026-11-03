import type { ComponentProps } from 'react';
import { Spinner } from './Spinner';

const variants = {
  primary: 'bg-indigo-700 text-white hover:bg-indigo-800',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100',
  danger: 'bg-red-700 text-white hover:bg-red-800',
};

interface ButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof variants;
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  isLoading = false,
  // Not "submit" by default, so a button inside a form never submits it by accident
  type = 'button',
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  );
}
