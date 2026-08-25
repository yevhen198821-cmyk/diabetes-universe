'use client';

import { useMemo, type RefObject } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { quickAddActions } from '../../lib/quick-add/actions';
import type { QuickAddOpenCategory } from '../../lib/quick-add/quick-add-controller-model';
import { useTimelinePresentationDependencies } from '../../lib/timeline/react/use-timeline-presentation-dependencies';
import { resolveDashboardQuickActionsLabels } from './dashboard-quick-actions-labels';

const visibleCategories = [
  'glucose',
  'insulin',
  'nutrition',
  'activity',
  'note',
] as const satisfies readonly QuickAddOpenCategory[];

type VisibleQuickAddCategory = (typeof visibleCategories)[number];

const iconToneByCategory: Record<QuickAddOpenCategory, string> = {
  glucose: 'bg-teal-500 text-white',
  insulin: 'bg-violet-500 text-white',
  nutrition: 'bg-orange-500 text-white',
  activity: 'bg-blue-500 text-white',
  medication: 'bg-rose-500 text-white',
  note: 'bg-emerald-500 text-white',
};

const eventKindByCategory: Record<
  VisibleQuickAddCategory,
  'activity' | 'glucose' | 'insulin' | 'note' | 'nutrition'
> = {
  activity: 'activity',
  glucose: 'glucose',
  insulin: 'insulin',
  note: 'note',
  nutrition: 'nutrition',
};

function OrganicAccent({ side }: { readonly side: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute ${side === 'left' ? 'bottom-0 -left-1' : '-right-1 bottom-1'} h-24 w-20 opacity-40`}
      viewBox="0 0 80 96"
    >
      <path
        d={
          side === 'left'
            ? 'M40 78 C18 58 6 34 16 12 C22 2 32 8 40 24 C48 8 58 2 64 12 C74 34 62 58 40 78 Z M18 64 C12 52 10 44 16 36 C20 30 24 34 22 42 C20 48 16 52 18 64 Z'
            : 'M40 78 C62 58 74 34 64 12 C58 2 48 8 40 24 C32 8 22 2 16 12 C6 34 18 58 40 78 Z M62 64 C68 52 70 44 64 36 C60 30 56 34 58 42 C60 48 64 52 62 64 Z'
        }
        fill="currentColor"
        className={
          side === 'left' ? 'text-violet-300/70' : 'text-orange-300/70'
        }
      />
    </svg>
  );
}

function isVisibleQuickAddCategory(
  category: string,
): category is VisibleQuickAddCategory {
  return (visibleCategories as readonly string[]).includes(category);
}

export interface DashboardQuickActionsProps {
  readonly disabled?: boolean;
  readonly onOpenCategory: (category: QuickAddOpenCategory) => void;
  readonly returnFocusRef?: RefObject<HTMLButtonElement | null>;
}

export function DashboardQuickActions({
  disabled = false,
  onOpenCategory,
  returnFocusRef,
}: DashboardQuickActionsProps) {
  const localization = useLocalization();
  const presentationDependencies = useTimelinePresentationDependencies();
  const sectionLabel = useMemo(
    () => resolveDashboardQuickActionsLabels(localization).title,
    [localization],
  );
  const actions = quickAddActions.filter(
    (
      action,
    ): action is (typeof quickAddActions)[number] & {
      category: VisibleQuickAddCategory;
    } => isVisibleQuickAddCategory(action.category),
  );

  return (
    <section
      aria-label={sectionLabel}
      className="relative col-span-full overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/62 p-3.5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur-md sm:p-5 dark:border-white/10 dark:bg-slate-900/58"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(167,139,250,0.12),transparent_34%),radial-gradient(circle_at_88%_22%,rgba(251,146,60,0.12),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(45,212,191,0.10),transparent_40%)]"
      />
      <OrganicAccent side="left" />
      <OrganicAccent side="right" />

      <div className="relative">
        <h2 className="mb-3 text-[1.25rem] font-extrabold tracking-tight text-[#1e3a5f] sm:text-[1.35rem] dark:text-white">
          {sectionLabel}
        </h2>

        <div className="grid grid-cols-5 gap-0.5 sm:gap-1.5 md:gap-2">
          {actions.map((action, index) => {
            const category = action.category;
            const eventKind = eventKindByCategory[category];
            const label = presentationDependencies.labels.eventKinds[eventKind];

            return (
              <button
                aria-label={`${sectionLabel}: ${label}`}
                className="group focus-visible:outline-interactive-primary flex min-h-11 min-w-0 flex-col items-center rounded-2xl px-0.5 py-1 text-center focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled}
                key={action.id}
                onClick={() => onOpenCategory(category)}
                ref={index === 0 ? returnFocusRef : undefined}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="mx-auto grid size-11 place-items-center rounded-full bg-white/95 shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-1 ring-white/85 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-95 sm:size-[3.75rem] md:size-[4.25rem]"
                >
                  <span
                    className={`grid size-8 place-items-center rounded-full sm:size-9 md:size-10 ${iconToneByCategory[category]}`}
                  >
                    {action.icon}
                  </span>
                </span>
                <span className="mt-1 block max-w-full px-0.5 text-[9px] leading-[1.05] font-semibold break-words hyphens-auto text-slate-700 sm:text-[10px] sm:leading-tight md:text-[11px] dark:text-slate-200">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
