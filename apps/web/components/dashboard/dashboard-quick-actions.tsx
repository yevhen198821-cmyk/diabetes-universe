'use client';

import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { quickAddActions } from '../../lib/quick-add/actions';
import type { QuickAddOpenCategory } from '../../lib/quick-add/quick-add-controller-model';
import { useTimelinePresentationDependencies } from '../../lib/timeline/react/use-timeline-presentation-dependencies';
import { resolveDashboardQuickActionsLabels } from './dashboard-quick-actions-labels';

const visibleCategories: readonly QuickAddOpenCategory[] = [
  'glucose',
  'insulin',
  'nutrition',
  'activity',
];

const iconToneByCategory: Record<QuickAddOpenCategory, string> = {
  glucose: 'bg-teal-500 text-white',
  insulin: 'bg-violet-500 text-white',
  nutrition: 'bg-orange-500 text-white',
  activity: 'bg-blue-500 text-white',
  medication: 'bg-rose-500 text-white',
  note: 'bg-slate-500 text-white',
};

const eventKindByCategory = {
  activity: 'activity',
  glucose: 'glucose',
  insulin: 'insulin',
  nutrition: 'nutrition',
} as const;

function FloralSilhouette({ side }: { readonly side: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-2 ${side === 'left' ? 'left-0' : 'right-0'} h-28 w-20 opacity-35`}
      viewBox="0 0 80 112"
    >
      <path
        d={
          side === 'left'
            ? 'M40 90 C20 70 8 45 18 20 C24 8 34 12 40 28 C46 12 56 8 62 20 C72 45 60 70 40 90 Z'
            : 'M40 90 C60 70 72 45 62 20 C56 8 46 12 40 28 C34 12 24 8 18 20 C8 45 20 70 40 90 Z'
        }
        fill="currentColor"
        className={side === 'left' ? 'text-violet-300' : 'text-cyan-300'}
      />
    </svg>
  );
}

export interface DashboardQuickActionsProps {
  readonly disabled?: boolean;
  readonly onOpenCategory: (category: QuickAddOpenCategory) => void;
}

function toQuickAddOpenCategory(category: string): QuickAddOpenCategory {
  return category as QuickAddOpenCategory;
}

export function DashboardQuickActions({
  disabled = false,
  onOpenCategory,
}: DashboardQuickActionsProps) {
  const localization = useLocalization();
  const presentationDependencies = useTimelinePresentationDependencies();
  const sectionLabel = useMemo(
    () => resolveDashboardQuickActionsLabels(localization).title,
    [localization],
  );
  const actions = quickAddActions.filter((action) =>
    visibleCategories.includes(toQuickAddOpenCategory(action.category)),
  );

  return (
    <section
      aria-label={sectionLabel}
      className="relative col-span-full overflow-hidden rounded-[1.75rem] px-1 py-2 sm:px-2"
    >
      <FloralSilhouette side="left" />
      <FloralSilhouette side="right" />
      <div className="relative">
        <h2 className="mb-4 text-[1.35rem] font-extrabold tracking-tight text-[#1e3a5f] dark:text-white">
          {sectionLabel}
        </h2>

        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {actions.map((action) => {
            const category = toQuickAddOpenCategory(action.category);
            const eventKind =
              eventKindByCategory[category as keyof typeof eventKindByCategory];
            const label = eventKind
              ? presentationDependencies.labels.eventKinds[eventKind]
              : action.label;

            return (
              <button
                aria-label={`${sectionLabel}: ${label}`}
                className="group focus-visible:outline-interactive-primary min-w-0 rounded-2xl p-1 text-center focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled}
                key={action.id}
                onClick={() => onOpenCategory(category)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="mx-auto grid size-[4.5rem] place-items-center rounded-full bg-white shadow-[0_14px_34px_rgba(15,23,42,0.10)] ring-1 ring-slate-100 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-95 sm:size-[5rem]"
                >
                  <span
                    className={`grid size-12 place-items-center rounded-full sm:size-[3.25rem] ${iconToneByCategory[category]}`}
                  >
                    {action.icon}
                  </span>
                </span>
                <span className="mt-2 block truncate text-xs font-semibold text-slate-700 sm:text-sm dark:text-slate-200">
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
