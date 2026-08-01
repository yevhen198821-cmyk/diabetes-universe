import type { DaySummary as DaySummaryData } from '@diabetes-universe/types';
import {
  Activity,
  CalendarDays,
  CookingPot,
  Droplets,
  Syringe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DaySummaryProps {
  readonly summary: DaySummaryData;
}

interface SummaryItem {
  readonly label: string;
  readonly value: string;
  readonly icon: LucideIcon;
  readonly color: string;
}

export function DaySummary({ summary }: DaySummaryProps) {
  const items: readonly SummaryItem[] = [
    {
      label: 'Последняя глюкоза',
      value: summary.glucose,
      icon: Droplets,
      color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    },
    {
      label: 'Событий сегодня',
      value: String(summary.events),
      icon: CalendarDays,
      color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Углеводы',
      value: summary.carbohydrates,
      icon: CookingPot,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Инсулин',
      value: summary.insulin,
      icon: Syringe,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Активность',
      value: summary.activity,
      icon: Activity,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <aside
      aria-labelledby="day-summary-title"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-teal-700 uppercase dark:text-teal-300">
            Сегодня
          </p>
          <h2
            className="mt-1 text-xl font-bold text-slate-950 dark:text-white"
            id="day-summary-title"
          >
            Сводка дня
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Демонстрационные данные
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-1">
        {items.map(({ color, icon: Icon, label, value }) => (
          <div
            className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-950/70"
            key={label}
          >
            <div
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${color}`}
            >
              <Icon aria-hidden="true" size={19} />
            </div>
            <div className="min-w-0">
              <dt className="truncate text-xs text-slate-500 dark:text-slate-400">
                {label}
              </dt>
              <dd className="mt-0.5 truncate text-sm font-bold text-slate-950 dark:text-white">
                {value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </aside>
  );
}
