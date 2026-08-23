import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from './lib/cn';

export type ButtonVariant = 'destructive' | 'ghost' | 'primary' | 'secondary';
export type ButtonSize = 'icon' | 'lg' | 'md' | 'sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly size?: ButtonSize;
  readonly variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  destructive:
    'border border-status-danger/30 bg-surface text-status-danger hover:border-status-danger/50 hover:bg-status-danger/10 focus-visible:outline-status-danger disabled:text-status-danger/60',
  ghost:
    'border border-transparent bg-transparent text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-interactive-primary disabled:text-text-tertiary',
  primary:
    'border border-transparent bg-interactive-primary text-text-inverse hover:bg-interactive-primary-hover focus-visible:outline-interactive-primary disabled:bg-interactive-primary/50',
  secondary:
    'border border-border-default bg-surface text-text-primary hover:border-border-strong hover:bg-surface-subtle focus-visible:outline-interactive-primary disabled:text-text-tertiary',
};

const sizeClasses: Record<ButtonSize, string> = {
  icon: 'grid size-11 min-h-11 min-w-11 place-items-center p-0',
  lg: 'min-h-11 px-6 py-3 text-base',
  md: 'min-h-11 px-5 py-2.5 text-sm',
  sm: 'min-h-9 px-4 py-2 text-sm',
};

const baseClass =
  'inline-flex items-center justify-center rounded-control font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className = '',
      size = 'md',
      type = 'button',
      variant = 'primary',
      ...props
    },
    ref,
  ) {
    return (
      <button
        className={cn(
          baseClass,
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref}
        type={type}
        {...props}
      />
    );
  },
);
