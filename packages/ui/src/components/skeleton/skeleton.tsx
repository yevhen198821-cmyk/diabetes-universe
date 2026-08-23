import type { HTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  readonly rounded?: 'control' | 'full' | 'none' | 'text';
}

const roundedClasses = {
  control: 'rounded-control',
  full: 'rounded-full',
  none: 'rounded-none',
  text: 'rounded',
} as const;

export function Skeleton({
  className = '',
  rounded = 'text',
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-surface-subtle animate-pulse motion-reduce:animate-none',
        roundedClasses[rounded],
        className,
      )}
      {...props}
    />
  );
}
