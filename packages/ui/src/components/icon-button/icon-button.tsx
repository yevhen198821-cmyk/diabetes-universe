import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly label: string;
  readonly size?: 'lg' | 'md';
}

const sizeClasses = {
  lg: 'size-11 min-h-11 min-w-11',
  md: 'size-10 min-h-10 min-w-10',
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { children, className = '', label, size = 'md', type = 'button', ...props },
    ref,
  ) {
    return (
      <button
        aria-label={label}
        className={cn(
          'rounded-control border-border-default bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-interactive-primary grid shrink-0 place-items-center border transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
          sizeClasses[size],
          className,
        )}
        ref={ref}
        title={label}
        type={type}
        {...props}
      >
        {children}
      </button>
    );
  },
);
