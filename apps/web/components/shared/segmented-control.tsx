'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export interface SegmentedControlItem {
  readonly href: string;
  readonly id: string;
  readonly label: string;
}

export interface SegmentedControlProps {
  readonly activeItemId: string;
  readonly ariaLabel: string;
  readonly items: readonly SegmentedControlItem[];
}

const segmentedControlShellClassName =
  'rounded-[1.25rem] border border-border-default bg-surface-subtle p-1 shadow-elevation-sm dark:border-white/10 dark:bg-slate-950/70 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] dark:backdrop-blur-md';

const segmentedControlActiveClassName =
  'bg-surface text-text-primary shadow-elevation-sm ring-1 ring-border-default dark:bg-slate-800 dark:text-white dark:ring-white/15';

const segmentedControlInactiveClassName =
  'text-text-secondary hover:bg-surface hover:text-text-primary dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100';

export function SegmentedControl({
  activeItemId,
  ariaLabel,
  items,
}: SegmentedControlProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={segmentedControlShellClassName}
      role="tablist"
    >
      <div className="grid grid-cols-3 gap-1">
        {items.map((item) => {
          const isActive = item.id === activeItemId;

          return (
            <Link
              aria-selected={isActive}
              className={`focus-visible:outline-interactive-primary flex min-h-11 items-center justify-center rounded-[1rem] px-2 py-2 text-center text-xs leading-tight font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm ${
                isActive
                  ? segmentedControlActiveClassName
                  : segmentedControlInactiveClassName
              }`}
              href={item.href}
              id={`profile-segment-${item.id}`}
              key={item.id}
              role="tab"
            >
              <span className="line-clamp-2">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function SegmentedControlPanel({
  children,
  labelledBy,
}: {
  readonly children: ReactNode;
  readonly labelledBy: string;
}) {
  return (
    <section aria-labelledby={labelledBy} role="tabpanel">
      {children}
    </section>
  );
}
