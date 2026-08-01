import type { DaySummary } from '@diabetes-universe/types';

import { surfaceCard } from './ui-styles';

interface DaySummaryPanelProps {
  readonly summary: DaySummary;
}

export function DaySummaryPanel({ summary }: DaySummaryPanelProps) {
  return (
    <aside aria-labelledby="day-summary-title" className={`${surfaceCard} p-5`}>
      <h2 className="text-lg font-bold text-slate-950" id="day-summary-title">
        Сводка дня
      </h2>

      <dl className="mt-4">
        <div className="rounded-xl bg-slate-50 p-3.5">
          <dt className="text-xs text-slate-500">Время в диапазоне</dt>
          <dd className="mt-0.5 text-lg font-bold text-slate-950">
            {summary.timeInRange}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
