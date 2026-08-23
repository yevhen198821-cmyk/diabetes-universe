import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/cn';

export type BadgeVariant =
  'danger' | 'demo' | 'info' | 'neutral' | 'success' | 'warning';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly children: ReactNode;
  readonly variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  danger:
    'border-status-danger/30 bg-status-danger/10 text-status-danger [&>svg]:text-status-danger',
  demo: 'border-dashed border-status-warning/50 bg-status-warning/10 text-status-warning [&>svg]:text-status-warning',
  info: 'border-status-info/30 bg-status-info/10 text-status-info [&>svg]:text-status-info',
  neutral:
    'border-border-default bg-surface-subtle text-text-secondary [&>svg]:text-text-secondary',
  success:
    'border-status-success/30 bg-status-success/10 text-status-success [&>svg]:text-status-success',
  warning:
    'border-status-warning/30 bg-status-warning/10 text-status-warning [&>svg]:text-status-warning',
};

export function Badge({
  children,
  className = '',
  variant = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
