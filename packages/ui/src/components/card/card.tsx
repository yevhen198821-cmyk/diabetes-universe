import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/cn';

export type CardVariant = 'default' | 'interactive' | 'subtle';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  readonly as?: 'article' | 'div' | 'section';
  readonly children: ReactNode;
  readonly padding?: 'lg' | 'md' | 'none';
  readonly tone?: 'default' | 'error';
  readonly variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-surface shadow-elevation-sm',
  interactive:
    'bg-surface shadow-elevation-sm transition hover:border-border-strong hover:shadow-elevation-md',
  subtle: 'bg-surface-subtle shadow-none',
};

const paddingClasses = {
  lg: 'p-6',
  md: 'p-5',
  none: 'p-0',
} as const;

export function Card({
  as: Component = 'section',
  children,
  className = '',
  padding = 'md',
  tone = 'default',
  variant = 'default',
  ...props
}: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-card border',
        tone === 'error' ? 'border-status-danger/40' : 'border-border-default',
        variantClasses[variant],
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export interface CardHeaderProps {
  readonly action?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly icon?: ReactNode;
}

export function CardHeader({
  action,
  children,
  className = '',
  icon,
}: CardHeaderProps) {
  return (
    <div className={cn('flex items-start gap-4', className)}>
      {icon ? (
        <div
          aria-hidden="true"
          className="rounded-control bg-surface-subtle text-interactive-primary grid size-11 shrink-0 place-items-center"
        >
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
