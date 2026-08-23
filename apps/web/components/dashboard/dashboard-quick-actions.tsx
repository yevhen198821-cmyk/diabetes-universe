'use client';

import { quickAddActions } from '../../lib/quick-add/actions';
import type { QuickAddOpenCategory } from '../../lib/quick-add/quick-add-controller-model';

const visibleCategories: readonly QuickAddOpenCategory[] = [
  'glucose',
  'insulin',
  'nutrition',
  'activity',
];

const toneByCategory: Record<QuickAddOpenCategory, string> = {
  glucose:
    'from-emerald-400/25 via-teal-300/15 to-cyan-300/25 text-teal-700 dark:text-teal-200',
  insulin:
    'from-violet-400/25 via-fuchsia-300/15 to-purple-300/25 text-violet-700 dark:text-violet-200',
  nutrition:
    'from-amber-300/30 via-orange-300/20 to-rose-200/25 text-orange-700 dark:text-orange-200',
  activity:
    'from-sky-400/25 via-blue-300/15 to-indigo-300/25 text-sky-700 dark:text-sky-200',
  medication:
    'from-rose-300/25 via-pink-300/15 to-violet-300/20 text-rose-700 dark:text-rose-200',
  note: 'from-slate-300/25 via-slate-200/20 to-slate-300/25 text-slate-700 dark:text-slate-200',
};

export interface DashboardQuickActionsProps {
  readonly disabled?: boolean;
  readonly onOpenCategory: (category: QuickAddOpenCategory) => void;
}

export function DashboardQuickActions({
  disabled = false,
  onOpenCategory,
}: DashboardQuickActionsProps) {
  const actions = quickAddActions.filter((action) =>
    visibleCategories.includes(action.category),
  );

  return (
    <section
      aria-label="Quick add"
      className="relative col-span-full overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/80 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 sm:p-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-gradient-to-br from-emerald-200/45 via-cyan-200/30 to-violet-200/40 blur-2xl dark:opacity-20"
      />
      <div className="relative">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-text-primary text-lg font-extrabold tracking-tight sm:text-xl">
              Quick add
            </h2>
            <p className="text-text-secondary mt-1 text-sm">
              Add a record with one tap
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {actions.map((action) => (
            <button
              aria-label={action.addTitle}
              className="group min-w-0 rounded-2xl p-1 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
              key={action.id}
              onClick={() => onOpenCategory(action.category)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`mx-auto grid size-14 place-items-center rounded-full bg-gradient-to-br shadow-[0_10px_28px_rgba(15,23,42,0.10)] ring-1 ring-white/70 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-95 sm:size-16 ${toneByCategory[action.category]}`}
              >
                {action.icon}
              </span>
              <span className="text-text-primary mt-2 block truncate text-xs font-semibold sm:text-sm">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
